#version 100

attribute vec2 aPosition;

varying lowp vec2 vTexCoord;

uniform vec2 uScreenSize;
uniform vec2 uTextureSize;

void main(void) {
  gl_Position = vec4(mix(1.0 - 2.0 * (uTextureSize / uScreenSize), vec2(1.0, 1.0),
    (aPosition * 0.5 + 0.5)), 0.0, 1.0);
  gl_Position.z = -1.0;
  vTexCoord = aPosition * 0.5 + 0.5;
}
