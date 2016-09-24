#version 100

attribute float aPosition;
attribute vec2 aStart;
attribute vec2 aEnd;

varying lowp vec2 vTexCoord;

void main() {
  gl_Position = vec4(mix(aStart, aEnd, aPosition), -1.0, 1.0);
  vTexCoord = vec2((mix(aStart, aEnd, aPosition) + 1.0) / 2.0);
}
