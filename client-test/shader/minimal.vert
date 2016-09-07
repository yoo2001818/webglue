#version 100
precision lowp float;
attribute vec3 aPosition;

uniform mat4 uProjection;
uniform lowp mat4 uView;
uniform mat4 uModel;

void main() {
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}
