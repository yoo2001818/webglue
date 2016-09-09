#version 100
precision lowp float;

attribute vec2 aTexCoord;
attribute vec3 aNormal;
attribute vec3 aPosition;

attribute vec3 aInstPos;

varying lowp vec3 vPosition;
varying lowp vec3 vNormal;
varying lowp vec2 vTexCoord;

uniform mat4 uProjectionView;
uniform mat4 uModel;
uniform mat3 uNormal;

void main() {
  vec4 fragPos = uModel * vec4(aPosition, 1.0) + vec4(aInstPos, 0.0);
  gl_Position = uProjectionView * fragPos;
  vPosition = fragPos.xyz;

  vTexCoord = vec2(aTexCoord.x, aTexCoord.y);
  vNormal = uNormal * aNormal;
  // vColor = vec4(vec3(aTexCoord, 0.0) + uTint.xyz * uTint.w, 1.0);
}
