const SHARED_ATTRIBUTES = Symbol('shared_attributes');
// WebGL constants. It may cause cross-browser problems if constants are
// different between browsers, but they don't.
const TYPES = {
  points: 0,
  lines: 1,
  lineLoop: 2,
  lineStrip: 3,
  triangles: 4,
  triangleStrip: 5,
  triangleFan: 6
};

// TODO Currently it's not possible to disable culling at all.
const CULL_FACE = {
  front: 0x0404,
  back: 0x0405,
  both: 0x0408
};

const USAGE = {
  static: 0x88e4,
  stream: 0x88e0,
  dynamic: 0x88e8
};

export default class InternalGeometry {
  constructor() {
    this.vbo = null;
    this.ebo = null;
    this.eboType = 0;
    this.type = 0;
    this.attributes = [];
    this.vao = {};
    this.name = null;
  }
  upload(context, geometry) {
    const gl = context.gl;
    if (Array.isArray(geometry.type)) {
      // If type is array, that means it's in 'separate' mode, which runs
      // render command multiple times.
      this.type = geometry.type.map(original => ({
        first: original.first,
        count: original.count,
        type: TYPES[original.type]
      }));
      this.typeArray = true;
    } else {
      // Just normal full rendering mode otherwise.
      this.type = TYPES[geometry.type];
      this.typeArray = false;
    }
    this.name = geometry.name;
    if (this.vbo == null) this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    // Convert the provided geometry to internal format
    this.attributes = [];
    let vertexCount = geometry.getVertexCount();
    let geometryData = geometry.getAttributes();
    let pos = 0;
    for (let key in geometryData) {
      let entry = geometryData[key];
      let typeId = 0;
      let size = 0;
      if (entry.data == null) {
        continue;
      }
      if (entry.data.length !== entry.axis * vertexCount) {
        throw new Error('Vertex data size mismatch');
      }
      // Obtain buffer size and type from data type
      if (entry.data instanceof Float32Array) {
        typeId = gl.FLOAT;
        size = 4;
      } else if (entry.data instanceof Float64Array) {
        // Not supported by WebGL at all
        throw new Error('Float64Array is not supported by WebGL');
      } else if (entry.data instanceof Int8Array) {
        typeId = gl.BYTE;
        size = 1;
      } else if (entry.data instanceof Int16Array) {
        typeId = gl.SHORT;
        size = 2;
      } else if (entry.data instanceof Int32Array) {
        typeId = gl.INT;
        size = 4;
      } else if (entry.data instanceof Uint8Array) {
        typeId = gl.UNSIGNED_BYTE;
        size = 1;
      } else if (entry.data instanceof Uint16Array) {
        typeId = gl.UNSIGNED_SHORT;
        size = 2;
      } else if (entry.data instanceof Uint32Array) {
        typeId = gl.UNSIGNED_INT;
        size = 4;
      } else {
        // Nope
        throw new Error('Unknown vertex data type');
      }
      this.attributes.push({
        name: key,
        axis: entry.axis,
        type: typeId,
        size: size * entry.axis,
        pos: pos,
        data: entry.data
      });
      pos += vertexCount * size * entry.axis;
    }
    // Set the buffer size needed by geometry
    // TODO Maybe it can be dynamically edited?
    gl.bufferData(gl.ARRAY_BUFFER, pos, USAGE[geometry.usage] || USAGE.static);
    // Upload each attribute, one at a time
    for (let i = 0; i < this.attributes.length; ++i) {
      let attribute = this.attributes[i];
      gl.bufferSubData(gl.ARRAY_BUFFER, attribute.pos, attribute.data);
    }
    // Done!
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    let geomIndices = geometry.getIndices();
    if (geomIndices) {
      if (geomIndices instanceof Uint8Array) {
        this.eboType = gl.UNSIGNED_BYTE;
        this.eboSize = 1;
      } else if (geomIndices instanceof Uint16Array) {
        this.eboType = gl.UNSIGNED_SHORT;
        this.eboSize = 2;
      } else if (geomIndices instanceof Uint32Array) {
        // TODO OES_element_index_uint extension must be enabled before doing
        // this
        if (context.uintExt == null) {
          throw new Error('Uint32Array indices is not supported by the device');
        }
        this.eboType = gl.UNSIGNED_INT;
        this.eboSize = 4;
      } else {
        throw new Error('Unsupported indices array type');
      }
      if (this.ebo == null) this.ebo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geomIndices,
        USAGE[geometry.usage] || USAGE.static);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
      this.eboLength = geomIndices.length;
    }
    this.cullFace = CULL_FACE[geometry.cullFace];
  }
  use(context) {
    const gl = context.gl;
    const shader = context.currentShader;
    const name = shader.isShared ? SHARED_ATTRIBUTES : shader.name;
    if (context.currentCullFace !== this.cullFace) {
      gl.cullFace(this.cullFace);
      context.currentCullFace = this.cullFace;
    }
    // If VAO extension exists, try to use it
    if (context.vaoExt) {
      // If VAO exists, just bind it and return
      if (this.vao[name]) {
        context.vaoExt.bindVertexArrayOES(this.vao[name]);
        if (this.ebo !== null) {
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        }
        return;
      } else {
        // If it doesn't, create new one and proceed
        let vao = context.vaoExt.createVertexArrayOES();
        context.vaoExt.bindVertexArrayOES(vao);
        this.vao[name] = vao;
      }
    }
    const attributes = shader.isShared ? context.sharedAttributes :
      shader.attributes;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    // Read each attribute, and set pointer to it
    for (let i = 0; i < this.attributes.length; ++i) {
      let attribute = this.attributes[i];
      let attribPos = attributes[attribute.name];
      if (attribPos == null) continue;
      gl.enableVertexAttribArray(attribPos);
      gl.vertexAttribPointer(attribPos, attribute.axis, attribute.type,
        false, attribute.size, attribute.pos);
    }
  }
  render(context, geometry) {
    const gl = context.gl;
    if (this.ebo !== null) {
      context.metrics.activeVertices += this.eboLength;
    } else {
      context.metrics.activeVertices += geometry.getVertexCount();
    }
    context.metrics.vertices += geometry.getVertexCount();
    if (this.typeArray) {
      for (let i = 0; i < this.type.length; ++i) {
        let data = this.type[i];
        if (this.ebo !== null) {
          // Draw by elements if indices buffer exists
          // Note that offset accepts the BYTE index, not array index!
          // Since we're using Uint16, Uint8, ... we have to multiply the
          // byte size of it. Who made this thing??
          gl.drawElements(data.type, data.count, this.eboType,
            data.first * this.eboSize);
        } else {
          // Or just use array drawing
          gl.drawArrays(data.type, data.first, data.count);
        }
        if (data.type === TYPES.triangles) {
          context.metrics.triangles += data.count / 3 | 0;
        }
        context.metrics.drawCalls ++;
      }
    } else {
      if (this.ebo !== null) {
        // Draw by elements if indices buffer exists
        gl.drawElements(this.type, this.eboLength, this.eboType, 0);
        if (this.type === TYPES.triangles) {
          context.metrics.triangles += this.eboLength / 3 | 0;
        }
      } else {
        // Or just use array drawing
        gl.drawArrays(this.type, 0, geometry.getVertexCount());
        if (this.type === TYPES.triangles) {
          context.metrics.triangles += geometry.getVertexCount() / 3 | 0;
        }
      }
      context.metrics.drawCalls ++;
    }
  }
  dispose(context) {
    const gl = context.gl;
    // Throw away vbo, ebo, vao
    gl.deleteBuffer(this.vbo);
    gl.deleteBuffer(this.ebo);
    Object.getOwnPropertyNames(this.vao).forEach(vao => {
      context.vaoExt.deleteVertexArrayOES(vao);
    });
    Object.getOwnPropertySymbols(this.vao).forEach(vao => {
      context.vaoExt.deleteVertexArrayOES(vao);
    });
    this.vao = {};
  }
}
