#version 100
// #pragma webglue: feature(USE_NORMAL_MAP, uNormalMap)
#if defined(USE_NORMAL_MAP)
  #define USE_TANGENT_SPACE
#endif

precision lowp float;

lowp vec3 normal;

varying lowp vec3 vPosition;
varying lowp vec3 vNormal;
varying lowp vec2 vTexCoord;

#ifdef USE_TANGENT_SPACE
  varying lowp vec4 vTangent;
  lowp mat3 tangent;
  lowp mat3 tangentInv;
#endif

uniform vec2 uRange;

uniform mat4 uView;
uniform mat4 uModel;
uniform mat3 uNormal;
uniform sampler2D uNormalMap;

lowp vec2 encodeFloatToRG(lowp float v) {
  lowp vec2 enc = vec2(1.0, 255.0) * v;
  enc = fract(enc);
  enc -= enc.yy * vec2(1.0 / 255.0, 0.0);
  return enc;
}

void main(void) {
  #ifdef USE_TANGENT_SPACE
    // Normal vector.
    vec3 N = normalize(vNormal);
    // Tangent vector.
    vec3 T = normalize(vec3(uNormal * vTangent.xyz));
    T = normalize(T - dot(T, N) * N);
    // Bi-tangent vector.
    vec3 B = cross(T, N) * vTangent.w;
    // Transpose the matrix by hand
    tangent = mat3(
      vec3(T.x, B.x, N.x),
      vec3(T.y, B.y, N.y),
      vec3(T.z, B.z, N.z)
    );
    tangentInv = mat3(T, B, N);
  #else
    normal = normalize((uView * vec4(vNormal, 0.0)).xyz);
  #endif

  #ifdef USE_TANGENT_SPACE
    #ifdef USE_NORMAL_MAP
      normal = normalize(texture2D(uNormalMap, vTexCoord).xyz * 2.0 - 1.0);
      normal.y = -normal.y;
    #else
      normal = vec3(0.0, 0.0, 1.0);
    #endif
    normal = normalize((uView * vec4(tangentInv * normal, 0.0)).xyz);
  #endif

  lowp float depth = (gl_FragCoord.z / gl_FragCoord.w - uRange.x) / uRange.y;
  gl_FragColor = vec4(normal.xy * 0.5 + 0.5, encodeFloatToRG(depth));


}
