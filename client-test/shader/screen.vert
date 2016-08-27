#version 100

attribute vec2 aPosition;

varying lowp vec2 vTexCoord;

void main() {
  gl_Position = vec4(aPosition, -1.0, 1.0);
  vTexCoord = vec2((aPosition + 1.0) / 2.0);
}
