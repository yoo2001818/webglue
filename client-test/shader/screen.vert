#version 100

attribute vec2 aPosition;

varying lowp vec4 vColor;

void main() {
  gl_Position = vec4(aPosition, -1.0, 1.0);
  vColor = vec4((aPosition + 1.0) / 2.0, 0.0, 1.0);
}
