#version 100
precision lowp float;

attribute vec2 aTexCoord;
attribute vec3 aNormal;
attribute vec3 aPosition;

varying lowp vec3 vPosition;
varying lowp vec3 vNormal;
varying lowp vec2 vTexCoord;

uniform mat4 uProjection;
uniform lowp mat4 uView;
uniform mat4 uModel;
uniform mat3 uNormal;

void main() {
  vec4 fragPos = uModel * vec4(aPosition, 1.0);
  gl_Position = uProjection * uView * fragPos;
  vPosition = fragPos.xyz;

  vTexCoord = vec2(aTexCoord.x, 1.0 - aTexCoord.y);
  vNormal = uNormal * aNormal;
  // vColor = vec4(vec3(aTexCoord, 0.0) + uTint.xyz * uTint.w, 1.0);
}
