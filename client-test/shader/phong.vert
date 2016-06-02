#version 100

#define POINT_SHADOW_LIGHT_SIZE 2

attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec3 aTangent;
attribute vec2 aTexCoord;

uniform lowp vec3 uViewPos;
uniform mat4 uProjectionView;
uniform mat4 uModel;
uniform mat3 uModelInvTransp;

varying lowp vec2 vTexCoord;
varying lowp vec3 vPosition;

struct PointShadowLight {
  lowp vec3 position;

  lowp vec3 color;
  lowp vec4 intensity;

  lowp mat4 shadowMatrix;
};

#if POINT_SHADOW_LIGHT_SIZE > 0
  varying lowp vec4 vPointShadowLightPos[POINT_SHADOW_LIGHT_SIZE];
  uniform PointShadowLight uPointShadowLight[POINT_SHADOW_LIGHT_SIZE];
#endif

#if defined(USE_NORMAL_MAP) || defined(USE_HEIGHT_MAP)
  // Use tangent-space normal. This is more expensive than world-space one.
  varying lowp mat3 vTangent;
  // We can calculate view position on the fragment shader though.
  varying lowp vec3 vTangentViewPos;
  varying lowp vec3 vTangentFragPos;
#else
  // Use world-space normal
  varying lowp vec3 vFragPos;
  varying lowp vec3 vNormal;
#endif

void main(void) {
  vec4 fragPos = uModel * vec4(aPosition, 1.0);
  gl_Position = uProjectionView * fragPos;
  // OpenGL's Y axis is inverted... not sure why though.
  vTexCoord = vec2(aTexCoord.x, 1.0 - aTexCoord.y);
  #if defined(USE_NORMAL_MAP) || defined(USE_HEIGHT_MAP)
    // Tangent vector.
    lowp vec3 T = normalize(vec3(uModelInvTransp * aTangent));
    // Normal vector.
    lowp vec3 N = normalize(uModelInvTransp * aNormal);
    // Bi-tangent vector.
    lowp vec3 B = cross(T, N);
    // Transpose the matrix by hand
    lowp mat3 tangent = mat3(
      vec3(T.x, B.x, N.x),
      vec3(T.y, B.y, N.y),
      vec3(T.z, B.z, N.z)
    );
    vTangent = tangent;
    vTangentViewPos = tangent * uViewPos;
    vTangentFragPos = tangent * aNormal.xyz;
  #else
    vFragPos = fragPos.xyz;
    vNormal = normalize(uModelInvTransp * aNormal);
  #endif
  vPosition = (uModel * vec4(aPosition, 1.0)).xyz;
  #if POINT_SHADOW_LIGHT_SIZE > 0
    for (int i = 0; i < POINT_SHADOW_LIGHT_SIZE; ++i) {
      vPointShadowLightPos[i] =
        uPointShadowLight[i].shadowMatrix * vec4(vPosition, 1.0);
    }
  #endif
}
