#version 100

attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec4 aTangent;

uniform mat4 uProjection;
uniform mat4 uView;
// uniform mat4 uModel;

varying lowp vec3 vFragPos;
varying lowp vec3 vTangent;
varying lowp vec3 vBiTangent;

void main(void) {
  mat4 viewMat = uView;
  // Get rid of translation
  viewMat[0].w = 0.0;
  viewMat[1].w = 0.0;
  viewMat[2].w = 0.0;
  viewMat[3] = vec4(0.0, 0.0, 0.0, 1.0);
  // Model matrix shouldn't do any translation..
  gl_Position = (uProjection * viewMat * vec4(aPosition, 1.0)).xyww;
  if (uProjection[3].w == 1.0) {
    // Orthographic projection...
    float size = max(1.0 / uProjection[1].y, 1.0 / uProjection[0].x);
    gl_Position.x *= size;
    gl_Position.y *= size;
  }
  vFragPos = -aPosition;
  // Normal vector.
  lowp vec3 N = normalize(aNormal);
  // Tangent vector.
  lowp vec3 T = normalize(aTangent.xyz);
  T = normalize(T - dot(T, N) * N);
  // Bi-tangent vector.
  lowp vec3 B = cross(T, N) * aTangent.w;
  vTangent = T;
  vBiTangent = B;
}
