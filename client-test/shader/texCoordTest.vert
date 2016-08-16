#version 100

attribute vec2 aTexCoord;
varying lowp vec4 vColor;

void main() {
  gl_Position = vec4(aTexCoord * 2.0 - 1.0, 0.0, 2.0);
  vColor = vec4(aTexCoord, 0.0, 1.0);
}
