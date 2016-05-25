#version 100

attribute vec2 aPosition;

varying vec2 vTexCoord;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vTexCoord = (aPosition + vec2(1.0, 1.0)) * 0.5;
}
