#version 100

attribute vec3 aPosition;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;

varying lowp vec3 vFragPos;

void main(void) {
  mat4 viewMat = uView;
  // Get rid of translation
  viewMat[0].w = 0.0;
  viewMat[1].w = 0.0;
  viewMat[2].w = 0.0;
  viewMat[3] = vec4(0.0, 0.0, 0.0, 1.0);
  // Model matrix shouldn't do any translation..
  gl_Position = (uProjection * viewMat * uModel * vec4(aPosition, 1.0)).xyww;
  vFragPos = aPosition;
}
