export default function parseUniform(gl, value, type) {
  if (typeof value === 'string' && type === gl.FLOAT_VEC3) {
    return new Float32Array([
      parseInt(value.slice(1, 3), 16) / 255,
      parseInt(value.slice(3, 5), 16) / 255,
      parseInt(value.slice(5, 7), 16) / 255
    ]);
  }
  if (typeof value === 'string' && type === gl.FLOAT_VEC4) {
    if (value.length > 7) {
      // ARGB
      return new Float32Array([
        parseInt(value.slice(3, 5), 16) / 255,
        parseInt(value.slice(5, 7), 16) / 255,
        parseInt(value.slice(7, 9), 16) / 255,
        parseInt(value.slice(1, 3), 16) / 255
      ]);
    } else {
      // RGB
      return new Float32Array([
        parseInt(value.slice(1, 3), 16) / 255,
        parseInt(value.slice(3, 5), 16) / 255,
        parseInt(value.slice(5, 7), 16) / 255,
        1
      ]);
    }
  }
  if (Array.isArray(value)) {
    switch (type) {
    case gl.FLOAT_VEC2:
    case gl.FLOAT_VEC3:
    case gl.FLOAT_VEC4:
    case gl.FLOAT_MAT2:
    case gl.FLOAT_MAT3:
    case gl.FLOAT_MAT4:
      return new Float32Array(value);
    case gl.INT_VEC2:
    case gl.BOOL_VEC2:
    case gl.INT_VEC3:
    case gl.BOOL_VEC3:
    case gl.INT_VEC4:
    case gl.BOOL_VEC4:
      return new Int32Array(value);
    }
  }
  if (value === false) return getDefault(gl, type);
  return value;
}

// TODO Cache byte arrays
export function getDefault(gl, type) {
  switch (type) {
  case gl.FLOAT_VEC2:
    return new Float32Array([0, 0]);
  case gl.FLOAT_VEC3:
    return new Float32Array([0, 0, 0]);
  case gl.FLOAT_VEC4:
    return new Float32Array([0, 0, 0, 0]);
  case gl.INT_VEC2:
  case gl.BOOL_VEC2:
    return new Int32Array([0, 0]);
  case gl.INT_VEC3:
  case gl.BOOL_VEC3:
    return new Int32Array([0, 0, 0]);
  case gl.INT_VEC4:
  case gl.BOOL_VEC4:
    return new Int32Array([0, 0, 0, 0]);
  case gl.BOOL:
  case gl.BYTE:
  case gl.UNSIGNED_BYTE:
  case gl.SHORT:
  case gl.UNSIGNED_SHORT:
  case gl.INT:
  case gl.UNSIGNED_INT:
  case gl.FLOAT:
    return 0;
  case gl.FLOAT_MAT2:
    return new Int32Array([1, 0, 0, 1]);
  case gl.FLOAT_MAT3:
    return new Float32Array([
      1, 0, 0, 0, 1, 0, 0, 0, 1
    ]);
  case gl.FLOAT_MAT4:
    return new Float32Array([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1
    ]);
  case gl.SAMPLER_2D:
  case gl.SAMPLER_CUBE:
    return false;
  }
}
