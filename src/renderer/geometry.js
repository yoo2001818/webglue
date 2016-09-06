import parseAttributes from '../util/parseAttributes';
import parseIndices from '../util/parseIndices';

export const POINTS = 0;
export const LINES = 1;
export const LINE_LOOP = 2;
export const LINE_STRIP = 3;
export const TRIANGLES = 4;
export const TRIANGLE_STRIP = 5;
export const TRIANGLE_FAN = 6;

export default class Geometry {
  constructor(renderer, options) {
    this.renderer = renderer;
    // Raw options given by the user
    this.attributes = parseAttributes(options.attributes);
    this.indices = parseIndices(options.indices);
    this.instanced = options.instanced;
    // gl.POINTS is 0
    this.mode = options.mode == null ? renderer.gl.TRIANGLES : options.mode;
    // Geometry buffer objects.
    this.vbo = null;
    this.ebo = null;
    this.eboType = null;
    this.attributePos = null;
    this.instancedPos = null;
    this.vertexCount = 0;
    this.primCount = 0;
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
    this.instancedPos = [];
    this.standard = true;
    // TODO Some use separate VBO per each attribute. if that's better,
    // we should use it.
    let vertexCount = -1;
    let primCount = -1;
    let pos = 0;
    for (let key in this.attributes) {
      let entry = this.attributes[key];
      let typeId = 0;
      let size = 0;
      let instDiv = 0;
      if (this.instanced != null) instDiv = this.instanced[key] || 0;
      if (entry.data == null) {
        continue;
      }
      if (instDiv !== 0) {
        if (primCount === -1) {
          primCount = entry.data.length / entry.axis * instDiv;
        } else if (entry.data.length !== primCount * entry.axis / instDiv) {
          throw new Error('Instanced primitive data size mismatch');
        }
        // Do not upload it to the buffer if instancing is not supported
        if (this.renderer.instanced == null) {
          this.instancedPos.push({
            name: key,
            axis: entry.axis,
            data: entry.data,
            instanced: instDiv
          });
          continue;
        }
      } else {
        if (vertexCount === -1) {
          vertexCount = entry.data.length / entry.axis;
        } else if (entry.data.length !== entry.axis * vertexCount) {
          throw new Error('Vertex data size mismatch');
        }
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
        data: entry.data,
        instanced: instDiv || 0
      });
      if (this.renderer.attributes.indexOf(key) === -1) {
        this.standard = false;
      }
      pos += entry.data.length * size;
    }
    // Instancing is enabled if not -1
    this.primCount = primCount;
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
  useVAO() {
    const gl = this.renderer.gl;
    let shader = this.renderer.shaders.current;
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
          return true;
        }
      } else {
        // Non-standard geometry
        if (!this.vao.has(shader)) {
          let vao = this.renderer.vao.createVertexArrayOES();
          this.renderer.vao.bindVertexArrayOES(vao);
          this.vao.set(shader, vao);
          // Continue.....
        } else {
          let vao = this.vao.get(shader);
          this.renderer.vao.bindVertexArrayOES(vao);
          // Use EBO
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
          return true;
        }
      }
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    return false;
  }
  use(useVAO = true) {
    const gl = this.renderer.gl;
    const instancedExt = this.renderer.instanced;
    if (this.vbo === null) this.upload();
    if (this.standard && this.renderer.geometries.current === this) {
      // This doesn't have to be 'used' again in this case
      return;
    }
    if (useVAO && this.useVAO()) return;
    let shader = this.renderer.shaders.current;
    let shaderAttribs = shader.attributes;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    // Read each attribute, and set pointer to it
    for (let i = 0; i < this.attributePos.length; ++i) {
      let attribute = this.attributePos[i];
      let attribPos = shaderAttribs[attribute.name];
      if (attribPos == null) continue;
      gl.enableVertexAttribArray(attribPos);
      gl.vertexAttribPointer(attribPos, attribute.axis, attribute.type,
        false, attribute.size, attribute.pos);
      if (instancedExt) {
        // It's not memorized on VAO?
        instancedExt.vertexAttribDivisorANGLE(attribPos,
          attribute.instanced || 0);
      }
    }
  }
  draw() {
    const gl = this.renderer.gl;
    if (this.primCount !== -1) {
      const instancedExt = this.renderer.instanced;
      if (instancedExt) {
        if (this.ebo !== null) {
          instancedExt.drawElementsInstancedANGLE(this.mode,
            this.indices.length, this.eboType, 0, this.primCount);
        } else {
          instancedExt.drawArraysInstancedANGLE(this.mode, 0, this.vertexCount,
            this.primCount);
        }
      } else {
        // Instancing fallback.
        // We'll have to do this the really hard way.....
        let shader = this.renderer.shaders.current;
        let shaderAttribs = shader.attributes;
        for (let i = 0; i < this.primCount; ++i) {
          this.instancedPos.forEach(v => {
            let attribPos = shaderAttribs[v.name];
            if (attribPos == null) return;
            gl.disableVertexAttribArray(attribPos);
            let pos = (i / v.instanced | 0) * v.axis;
            switch (v.axis) {
            case 1:
              gl.vertexAttrib1f(attribPos, v.data[pos]);
              break;
            case 2:
              gl.vertexAttrib2f(attribPos, v.data[pos], v.data[pos + 1]);
              break;
            case 3:
              gl.vertexAttrib3f(attribPos, v.data[pos], v.data[pos + 1],
                v.data[pos + 2]);
              break;
            case 4:
              gl.vertexAttrib4f(attribPos, v.data[pos], v.data[pos + 1],
                v.data[pos + 2], v.data[pos + 3]);
              break;
            }
          });
          if (this.ebo !== null) {
            gl.drawElements(this.mode, this.indices.length, this.eboType, 0);
          } else {
            gl.drawArrays(this.mode, 0, this.vertexCount);
          }
        }
      }
    } else {
      if (this.ebo !== null) {
        gl.drawElements(this.mode, this.indices.length, this.eboType, 0);
      } else {
        gl.drawArrays(this.mode, 0, this.vertexCount);
      }
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
