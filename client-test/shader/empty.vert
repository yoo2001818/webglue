#version 100

attribute vec3 aPosition;

uniform mat4 uProjectionView;
uniform mat4 uModel;

void main(void) {
  gl_Position = uProjectionView * uModel * vec4(aPosition, 1.0);
}
