#version 100

attribute vec2 aPosition;

uniform mat4 uProjectionView;
uniform mat4 uModel;
uniform lowp float uRadius;

void main(void) {
  gl_Position = uProjectionView * uModel * vec4(aPosition, 0.0, 1.0);
  gl_PointSize = uRadius;
}
