#version 100

attribute vec3 aPosition;

varying lowp vec3 vColor;

uniform mat4 uProjectionView;
uniform mat4 uModel;

uniform lowp vec3 uColor;

void main(void) {
  gl_Position = uProjectionView * uModel * vec4(aPosition, 1.0);
  vColor = uColor;
}
