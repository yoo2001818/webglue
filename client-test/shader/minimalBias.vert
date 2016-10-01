#version 100
precision lowp float;
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uProjection;
uniform lowp mat4 uView;
uniform mat4 uModel;
uniform mat3 uNormal;
uniform vec2 uBias;

void main() {
  vec3 pos = (uModel * vec4(aPosition * (1.0 + uBias.x), 1.0)).xyz;
  pos += uNormal * (aNormal * uBias.y);
  gl_Position = uProjection * uView * vec4(pos, 1.0);
}
