#version 100

attribute vec2 aTexCoord;
varying lowp vec4 vColor;

void main() {
  vColor = vec4(aTexCoord, 0.0, 1.0);
}
