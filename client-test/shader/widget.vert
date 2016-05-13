#version 100

attribute vec3 aPosition;
attribute vec3 aColor;

varying lowp vec3 vColor;

uniform mat4 uProjectionView;
uniform mat4 uModel;

void main(void) {
  gl_Position = uProjectionView * uModel * vec4(aPosition, 1.0);
  vColor = aColor;
}
