#version 100

attribute vec2 aTexCoord;
varying lowp vec4 vColor;

uniform float uScale;
uniform vec4 uTint;

void main() {
  gl_Position = vec4((aTexCoord * 2.0 - 1.0) * uScale, 0.0, 1.0);
  vColor = vec4(vec3(aTexCoord, 0.0) + uTint.xyz * uTint.w, 1.0);
}
