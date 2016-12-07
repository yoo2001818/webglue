import parseAttributes from '../util/parseAttributes';
import parseIndices from '../util/parseIndices';
import getAABB from '../util/getAABB';

export const POINTS = 0;
export const LINES = 1;
export const LINE_LOOP = 2;
export const LINE_STRIP = 3;
export const TRIANGLES = 4;
export const TRIANGLE_STRIP = 5;
export const TRIANGLE_FAN = 6;

function getDataSize(gl, data) {
  if (data instanceof Float32Array) {
    return { type: gl.FLOAT, size: 4 };
  } else if (data instanceof Float64Array) {
    // Not supported by WebGL at all
    throw new Error('Float64Array is not supported by WebGL');
  } else if (data instanceof Int8Array) {
    return { type: gl.BYTE, size: 1 };
  } else if (data instanceof Int16Array) {
    return { type: gl.SHORT, size: 2 };
  } else if (data instanceof Int32Array) {
    return { type: gl.INT, size: 4 };
  } else if (data instanceof Uint8Array) {
    return { type: gl.UNSIGNED_BYTE, size: 1 };
  } else if (data instanceof Uint16Array) {
    return { type: gl.UNSIGNED_SHORT, size: 2 };
  } else if (data instanceof Uint32Array) {
    return { type: gl.UNSIGNED_INT, size: 4 };
  } else {
    // Nope
    throw new Error('Unknown vertex data type');
  }
}

function fillMetadata(gl, entry) {
  let typeId, size;
  if (entry.data == null) {
    if (entry.buffer == null) return entry;
    if (entry.buffer.buffer == null) {
      entry.buffer.upload();
    }
    if (entry.buffer.data) {
      // Obtain buffer size and type from data type
      let sizeInfo = getDataSize(gl, entry.buffer.data);
      typeId = sizeInfo.type;
      size = sizeInfo.size;
      entry.data = entry.buffer.data.subarray(
        (entry.offset || 0) / size
      );
    }
  } else {
    // Obtain buffer size and type from data type
    let sizeInfo = getDataSize(gl, entry.data);
    typeId = sizeInfo.type;
    size = sizeInfo.size;
  }
  if (entry.type == null) entry.type = typeId;
  if (entry.typeSize == null) entry.typeSize = size;
  if (entry.stride == null) entry.stride = entry.typeSize * entry.axis;
  if (entry.offset == null) entry.offset = 0;
  return entry;
}

export default class Geometry {
  constructor(renderer, options) {
    this.renderer = renderer;
    this.options = options;
    // Geometry buffer objects.
    this.vbo = null;
    this.ebo = null;
    this.eboType = null;
    this.vao = null;

    this.aabb = null;

    this.attributeList = null;
    this.instancedList = null;

    this.standard = false;

    if (typeof this.options.then === 'function') {
      // Welcome to Promise
      this.loaded = false;
      this.options.then(options => {
        this.options = options;
        this.loaded = true;
        this.upload();
      });
    } else {
      this.loaded = true;
      this.upload();
    }
  }
  getAABB() {
    // This assumes that the geometry has been uploaded
    if (!this.loaded) return false;
    // TODO Support changing attribute name
    if (this.aabb != null) return this.aabb;
    this.aabb = getAABB(this, 'aPosition');
    return this.aabb;
  }
  update(options) {
    const gl = this.renderer.gl;
    let output = this.options;
    this.aabb = null;
    // Legacy code compatibility
    if (options.instanced) {
      Object.assign(output.instanced, options.instanced);
    }
    if (options.metadata != null) output.metadata = options.metadata;
    if (options.mode != null) output.mode = options.mode;
    if (options.count != null) {
      output.count = options.count;
      if (options.count !== -1) this.count = options.count;
    }
    if (options.primCount != null) {
      output.primCount = options.primCount;
      if (options.primCount !== -1) this.primCount = options.primCount;
    }
    if (options.usage != null) output.usage = options.usage;
    if (options.indicesUsage != null) {
      output.indicesUsage = options.indicesUsage;
    }
    if (this.vbo == null) {
      if (options.indices) {
        this.indices = parseIndices(options.indices);
      }
      if (options.attributes) {
        Object.assign(output.attributes, parseAttributes(options.attributes));
      }
      this.attributes = null;
      this.indices = null;
      return this.upload();
    }
    if (options.indices) {
      this.indices = parseIndices(options.indices);
      this.uploadIndices();
    }
    if (options.attributes) {
      let count = output.count == null ? -1 : output.count;
      let primCount = output.primCount == null ? -1 : output.primCount;
      let uploadAttributes = [];
      // Determine if we need to update whole VBO / or we can overwrite on
      // some of them
      let vaoValid = true;
      let attributes = parseAttributes(options.attributes);
      for (let key in attributes) {
        let entry = attributes[key];
        let original = this.attributes[key];
        if ((entry == null || entry === false) && original != null) {
          // Remove the entry from attribute
          vaoValid = false;
          delete this.attributes[key];
          this.attributeList.splice(this.attributeList.indexOf(original));
          continue;
        }
        if (original == null) {
          original = {};
          this.attributes[key] = original;
          this.attributeList.push(original);
        }
        // Legacy code compatibility
        if (output.instanced && output.instanced[key] != null) {
          entry.instanced = this.options.instanced[key];
        }
        fillMetadata(gl, entry);
        if (entry.instanced != null && entry.instanced !== 0) {
          let attributeCount = Math.ceil(entry.data.length / entry.stride *
            entry.typeSize * entry.instanced);
          if (primCount === -1 || primCount > attributeCount) {
            primCount = attributeCount;
          }
          // Instancing is unsupported? TODO Add proper routine for this
          if (this.renderer.instanced == null) {
            Object.assign(output.attributes,
              parseAttributes(options.attributes));
            this.attributes = null;
            this.indices = null;
            return this.upload();
          }
        } else {
          let attributeCount = Math.ceil(entry.data.length / entry.stride *
            entry.typeSize);
          if (count === -1 || count > attributeCount) {
            count = attributeCount;
          }
        }
        if (entry.buffer == null || entry.buffer === this) {
          // Check if the size EXACTLY matches
          if (entry.data.length !== original.data.length) {
            // Failed!
            Object.assign(output.attributes,
              parseAttributes(options.attributes));
            this.attributes = null;
            this.indices = null;
            return this.upload();
          }
          entry.offset = original.offset;
          uploadAttributes.push(entry);
        }
        if (this.renderer.attributes.indexOf(key) === -1) {
          this.standard = false;
        }
        // TODO Add routine to check VAO validity
        vaoValid = false;
        Object.assign(original, entry);
      }
      if (count !== -1) this.count = count;
      if (primCount !== -1) this.primCount = primCount;
      if (!vaoValid) this.clearVAO();
      // Write to VBO
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
      // Upload each attribute, one at a time
      for (let i = 0; i < uploadAttributes.length; ++i) {
        let attribute = uploadAttributes[i];
        gl.bufferSubData(gl.ARRAY_BUFFER, attribute.offset, attribute.data);
      }
      // Done!
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      // return this.upload(false);
    }
  }
  upload(uploadIndices = true) {
    if (!this.loaded) return;
    const gl = this.renderer.gl;
    let options = this.options;
    // Raw options given by the user
    if (this.attributes == null) {
      this.attributes = parseAttributes(options.attributes);
    }
    if (this.indices == null) {
      this.indices = parseIndices(options.indices);
    }
    // Update metadata
    this.metadata = options.metadata;
    // gl.POINTS is 0
    this.mode = options.mode == null ? gl.TRIANGLES : options.mode;
    this.usage = options.usage == null ? gl.STATIC_DRAW : options.usage;
    if (this.indices && this.indices.usage != null) {
      this.indicesUsage = this.indices.usage;
    } else if (options.indicesUsage != null) {
      this.indicesUsage = options.indicesUsage;
    } else {
      this.indicesUsage = this.usage;
    }
    this.count = options.count == null ? -1 : options.count;
    this.primCount = options.primCount == null ? -1 : options.primCount;

    // Create VBO...
    if (this.vbo == null) this.vbo = gl.createBuffer();
    this.standard = true;

    this.attributeList = [];
    this.instancedList = [];

    let uploadAttributes = [];

    let vboPos = 0;
    for (let key in this.attributes) {
      let entry = this.attributes[key];
      if (entry == null) continue;
      // Legacy code compatibility
      if (this.options.instanced && this.options.instanced[key] != null) {
        entry.instanced = this.options.instanced[key];
      }
      fillMetadata(gl, entry);
      entry.name = key;
      if (entry.instanced != null && entry.instanced !== 0) {
        let attributeCount = Math.ceil(entry.data.length / entry.stride *
          entry.typeSize * entry.instanced);
        if (this.primCount === -1 || this.primCount > attributeCount) {
          this.primCount = attributeCount;
        }
        // Do not upload it to the buffer if instancing is not supported
        // TODO This breaks compatibility since it doesn't get uploaded on VBO
        if (this.renderer.instanced == null) {
          this.instancedList.push({
            name: key,
            axis: entry.axis,
            data: entry.data,
            instanced: entry.instanced
          });
          continue;
        }
      } else {
        let attributeCount = Math.ceil(entry.data.length / entry.stride *
          entry.typeSize);
        if (this.count === -1 || this.count > attributeCount) {
          this.count = attributeCount;
        }
      }
      if (entry.buffer == null || entry.buffer === this) {
        entry.buffer = this;
        entry.offset = vboPos;
        vboPos += entry.data.length * entry.typeSize;
        uploadAttributes.push(entry);
      }
      this.attributeList.push(entry);
      let attribPos = this.renderer.attributes.indexOf(key);
      if (attribPos === -1) {
        this.standard = false;
      } else {
        entry.attribPos = attribPos;
      }
    }
    // TODO Use single VAO if possible (Which isn't possible due to
    // strange error; will investigate)
    this.standard = false;
    // Populate VAO variable (initialization will be done at use time though)
    this.clearVAO();
    // Write to VBO
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    // Set the buffer size needed by geometry
    // TODO Maybe it can be dynamically edited?
    gl.bufferData(gl.ARRAY_BUFFER, vboPos, this.usage);
    // Upload each attribute, one at a time
    for (let i = 0; i < uploadAttributes.length; ++i) {
      let attribute = uploadAttributes[i];
      gl.bufferSubData(gl.ARRAY_BUFFER, attribute.offset, attribute.data);
    }
    // Done!
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    // Upload indices if requested to do so
    if (uploadIndices && this.indices != null) this.uploadIndices();
  }
  uploadIndices() {
    const gl = this.renderer.gl;
    if (this.indices == null) return;
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
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, this.indicesUsage);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }
  clearVAO() {
    if (this.standard) {
      if (this.vao) {
        this.renderer.vao.deleteVertexArrayOES(this.vao);
        this.vao = null;
      }
    } else {
      // TODO ES5 compatibility
      if (this.vao) {
        this.vao.forEach(value => {
          this.renderer.vao.deleteVertexArrayOES(value);
        });
      }
      this.vao = new Map();
    }
  }
  useVAO() {
    let shader = this.renderer.shaders.current;
    // TODO VAO logic must be changed if we're going to use instancing.
    // Use VAO if supported by the device.
    if (this.renderer.vao) {
      if (this.standard) {
        if (this.vao == null) {
          this.vao = this.renderer.vao.createVertexArrayOES();
          this.renderer.vao.bindVertexArrayOES(this.vao);
          // Continue.....
          // TODO This might make a problem in some browsers?
          this.vao.valid = true;
        } else {
          this.renderer.vao.bindVertexArrayOES(this.vao);
          if (this.vao.valid) return true;
        }
      } else {
        // Non-standard geometry
        if (!this.vao.has(shader)) {
          let vao = this.renderer.vao.createVertexArrayOES();
          this.renderer.vao.bindVertexArrayOES(vao);
          this.vao.set(shader, vao);
          // TODO This might make a problem in some browsers?
          vao.valid = true;
          // Continue.....
        } else {
          let vao = this.vao.get(shader);
          this.renderer.vao.bindVertexArrayOES(vao);
          if (vao.valid) return true;
        }
      }
    }
    return false;
  }
  use(useVAO = true) {
    if (!this.loaded) return;
    const gl = this.renderer.gl;
    const instancedExt = this.renderer.instanced;
    if (this.vbo === null) this.upload();
    /* if (this.standard && this.renderer.geometries.current === this) {
      // This doesn't have to be 'used' again in this case
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
      return;
    } */
    if (useVAO) {
      if (this.useVAO()) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        return;
      }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    }
    let shader = this.renderer.shaders.current;
    let shaderAttribs = shader.attributes;
    let currentBuffer = null;
    // Read each attribute, and set pointer to it
    for (let i = 0; i < this.attributeList.length; ++i) {
      let attribute = this.attributeList[i];
      let attribPos = shaderAttribs[attribute.name];
      /*
      if (attribPos == null && attribute.attribPos != null) {
        attribPos = attribute.attribPos;
      }
      */
      if (attribPos == null) continue;
      if (attribute.buffer !== currentBuffer) {
        if (attribute.buffer.vbo) {
          gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer.vbo);
        } else if (attribute.buffer.upload) {
          attribute.buffer.upload();
          gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer.vbo);
        } else {
          gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer);
        }
        currentBuffer = attribute.buffer;
      }
      gl.enableVertexAttribArray(attribPos);
      gl.vertexAttribPointer(attribPos, attribute.axis, attribute.type,
        false, attribute.stride, attribute.offset);
      if (instancedExt) {
        // It's not memorized on VAO?
        instancedExt.vertexAttribDivisorANGLE(attribPos,
          attribute.instanced || 0);
      }
    }
  }
  draw() {
    if (!this.loaded) return;
    const gl = this.renderer.gl;
    if (this.primCount !== -1) {
      const instancedExt = this.renderer.instanced;
      if (instancedExt) {
        if (this.ebo !== null) {
          instancedExt.drawElementsInstancedANGLE(this.mode,
            this.indices.length, this.eboType, 0, this.primCount);
        } else {
          instancedExt.drawArraysInstancedANGLE(this.mode, 0, this.count,
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
            gl.drawArrays(this.mode, 0, this.count);
          }
        }
      }
    } else {
      if (this.ebo !== null) {
        gl.drawElements(this.mode, this.indices.length, this.eboType, 0);
      } else {
        gl.drawArrays(this.mode, 0, this.count);
      }
    }
  }
  dispose() {
    const gl = this.renderer.gl;
    if (this.vbo === null) return;
    // Throw away vbo, ebo, vao
    gl.deleteBuffer(this.vbo);
    gl.deleteBuffer(this.ebo);
    if (this.vao) this.clearVAO();
    this.vbo = null;
    this.ebo = null;
  }
}
