let tmpVec2 = new Float32Array(2);
let tmpVec3 = new Float32Array(3);
let tmpVec4 = new Float32Array(4);
let tmpMat2 = new Float32Array(4);
let tmpMat3 = new Float32Array(9);
let tmpMat4 = new Float32Array(16);

export default function parseUniform(gl, value, type) {
  if (typeof value === 'string' && type === gl.FLOAT_VEC3) {
    tmpVec3[0] = parseInt(value.slice(1, 3), 16) / 255;
    tmpVec3[1] = parseInt(value.slice(3, 5), 16) / 255;
    tmpVec3[2] = parseInt(value.slice(5, 7), 16) / 255;
    return tmpVec3;
  }
  if (typeof value === 'string' && type === gl.FLOAT_VEC4) {
    if (value.length > 7) {
      // ARGB
      tmpVec4[0] = parseInt(value.slice(3, 5), 16) / 255;
      tmpVec4[1] = parseInt(value.slice(5, 7), 16) / 255;
      tmpVec4[2] = parseInt(value.slice(7, 9), 16) / 255;
      tmpVec4[3] = parseInt(value.slice(1, 3), 16) / 255;
      return tmpVec4;
    } else {
      // RGB
      tmpVec4[0] = parseInt(value.slice(1, 3), 16) / 255;
      tmpVec4[1] = parseInt(value.slice(3, 5), 16) / 255;
      tmpVec4[2] = parseInt(value.slice(5, 7), 16) / 255;
      tmpVec4[3] = 1;
      return tmpVec4;
    }
  }
  let i;
  if (Array.isArray(value)) {
    switch (type) {
    case gl.FLOAT_VEC2:
      tmpVec2[0] = value[0];
      tmpVec2[1] = value[1];
      return tmpVec2;
    case gl.FLOAT_VEC3:
      tmpVec3[0] = value[0];
      tmpVec3[1] = value[1];
      tmpVec3[2] = value[2];
      return tmpVec3;
    case gl.FLOAT_VEC4:
      tmpVec4[0] = value[0];
      tmpVec4[1] = value[1];
      tmpVec4[2] = value[2];
      tmpVec4[3] = value[3];
      return tmpVec4;
    case gl.FLOAT_MAT2:
      for (i = 0; i < 4; ++i) tmpMat2[i] = value[i];
      return tmpMat2;
    case gl.FLOAT_MAT3:
      for (i = 0; i < 9; ++i) tmpMat3[i] = value[i];
      return tmpMat3;
    case gl.FLOAT_MAT4:
      for (i = 0; i < 16; ++i) tmpMat4[i] = value[i];
      return tmpMat4;
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

let defaultVec2 = new Float32Array(2);
let defaultVec3 = new Float32Array(3);
let defaultVec4 = new Float32Array(4);
let defaultMat2 = new Float32Array([1, 0, 0, 1]);
let defaultMat3 = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
let defaultMat4 = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
  0, 0, 0, 1]);

export function getDefault(gl, type) {
  switch (type) {
  case gl.FLOAT_VEC2:
    return defaultVec2;
  case gl.FLOAT_VEC3:
    return defaultVec3;
  case gl.FLOAT_VEC4:
    return defaultVec4;
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
    return defaultMat2;
  case gl.FLOAT_MAT3:
    return defaultMat3;
  case gl.FLOAT_MAT4:
    return defaultMat4;
  case gl.SAMPLER_2D:
  case gl.SAMPLER_CUBE:
    return false;
  }
}
