import parseAttributes from '../util/parseAttributes';
import parseIndices from '../util/parseIndices';

export default class Geometry {
  constructor(renderer, options) {
    this.renderer = renderer;
    // Raw options given by the user
    this.attributes = parseAttributes(options.attributes);
    this.indices = parseIndices(options.indices);
    this.mode = options.mode || renderer.gl.TRIANGLES;
    // Geometry buffer objects.
    this.vbo = null;
    this.ebo = null;
    this.eboType = null;
    this.attributePos = null;
    this.vertexCount = 0;
    this.vao = null;

    this.standard = false;
  }
  upload() {
    if (this.vbo !== null) return;
    const gl = this.renderer.gl;
    // Create VBO...
    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    // Then bind the data to VBO.
    this.attributePos = [];
    this.standard = true;
    // TODO Some use separate VBO per each attribute. if that's better,
    // we should use it.
    let vertexCount = -1;
    let pos = 0;
    for (let key in this.attributes) {
      let entry = this.attributes[key];
      let typeId = 0;
      let size = 0;
      if (entry.data == null) {
        continue;
      }
      if (vertexCount === -1) {
        vertexCount = entry.data.length / entry.axis;
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
      this.attributePos.push({
        name: key,
        axis: entry.axis,
        type: typeId,
        size: size * entry.axis,
        pos: pos,
        data: entry.data
      });
      if (this.renderer.attributes.indexOf(key) === -1) {
        this.standard = false;
      }
      pos += vertexCount * size * entry.axis;
    }
    this.vertexCount = vertexCount;
    // Populate VAO variable (initialization will be done at use time though)
    if (this.standard) {
      this.vao = null;
    } else {
      // TODO ES5 compatibility
      this.vao = new WeakMap();
    }
    // Set the buffer size needed by geometry
    // TODO Maybe it can be dynamically edited?
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
    // Upload each attribute, one at a time
    for (let i = 0; i < this.attributePos.length; ++i) {
      let attribute = this.attributePos[i];
      gl.bufferSubData(gl.ARRAY_BUFFER, attribute.pos, attribute.data);
    }
    // Done!
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    // Upload indices if requested to do so
    if (this.indices != null) {
      if (this.indices instanceof Uint8Array) {
        this.eboType = gl.UNSIGNED_BYTE;
        this.eboSize = 1;
      } else if (this.indices instanceof Uint16Array) {
        this.eboType = gl.UNSIGNED_SHORT;
        this.eboSize = 2;
      } else if (this.indices instanceof Uint32Array) {
        // TODO OES_element_index_uint extension must be enabled before doing
        // this
        /* if (context.uintExt == null) {
          throw new Error('Uint32Array indices is not supported by the device');
        } */
        this.eboType = gl.UNSIGNED_INT;
        this.eboSize = 4;
      } else {
        throw new Error('Unsupported indices array type');
      }
      if (this.ebo == null) this.ebo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices,
        gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
  }
  use() {
    const gl = this.renderer.gl;
    if (this.vbo === null) this.upload();
    if (this.standard && this.renderer.geometries.current === this) {
      // This doesn't have to be 'used' again in this case
      return;
    }
    // TODO VAO logic must be changed if we're going to use instancing.
    // Use VAO if supported by the device.
    if (this.renderer.vao) {
      if (this.standard) {
        if (this.vao == null) {
          this.vao = this.renderer.vao.createVertexArrayOES();
          this.renderer.vao.bindVertexArrayOES(this.vao);
          // Continue.....
        } else {
          this.renderer.vao.bindVertexArrayOES(this.vao);
          // Use EBO
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
          return;
        }
      } else {
        // TODO Non-standard geometry
      }
    }
    let shader = this.renderer.shaders.current;
    let shaderAttribs = shader.attributes;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    // Read each attribute, and set pointer to it
    for (let i = 0; i < this.attributePos.length; ++i) {
      let attribute = this.attributePos[i];
      let attribPos = shaderAttribs[attribute.name];
      if (attribPos == null) continue;
      gl.enableVertexAttribArray(attribPos);
      gl.vertexAttribPointer(attribPos, attribute.axis, attribute.type,
        false, attribute.size, attribute.pos);
    }
  }
  draw() {
    const gl = this.renderer.gl;
    if (this.ebo !== null) {
      gl.drawElements(this.mode, this.indices.length, this.eboType, 0);
    } else {
      gl.drawArrays(this.mode, 0, this.vertexCount);
    }
  }
  dispose() {
    const gl = this.renderer.gl;
    if (this.vbo === null) return;
    // Throw away vbo, ebo, vao
    gl.deleteBuffer(this.vbo);
    gl.deleteBuffer(this.ebo);
    if (this.vao && this.standard) {
      this.renderer.vao.deleteVertexArrayOES(this.vao);
      this.vao = null;
    }
    this.vbo = null;
    this.ebo = null;
  }
}
