#version 100

attribute vec3 aPosition;

uniform mat4 uProjection;
uniform mat4 uView;
// uniform mat4 uModel;

varying lowp vec3 vFragPos;

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
}
