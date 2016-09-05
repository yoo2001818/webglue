#version 100

attribute vec2 aPosition;

varying lowp vec3 vColor;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;

uniform lowp vec3 uColor;
uniform lowp vec3 uHoriColor;
uniform lowp vec3 uVertColor;

void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 0.0, 1.0);
  if (aPosition.y == 0.0) {
    vColor = uHoriColor;
  } else if (aPosition.x == 0.0) {
    vColor = uVertColor;
  } else {
    vColor = uColor;
  }
}
