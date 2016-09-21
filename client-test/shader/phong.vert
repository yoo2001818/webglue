#version 100
precision lowp float;

attribute vec2 aTexCoord;
attribute vec3 aNormal;
attribute vec3 aPosition;

attribute vec3 aInstPos;

varying lowp vec3 vPosition;
varying lowp vec3 vNormal;
varying lowp vec2 vTexCoord;
varying lowp vec3 vViewPos;

uniform mat4 uProjectionView;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat3 uNormal;

void main() {
  vec4 fragPos = uModel * vec4(aPosition, 1.0) + vec4(aInstPos, 0.0);
  gl_Position = uProjectionView * fragPos;
  vPosition = fragPos.xyz;

  vTexCoord = vec2(aTexCoord.x, aTexCoord.y);
  vNormal = uNormal * aNormal;
  vViewPos = -mat3(
    uView[0].x, uView[1].x, uView[2].x,
    uView[0].y, uView[1].y, uView[2].y,
    uView[0].z, uView[1].z, uView[2].z
    ) * uView[3].xyz;
  // vColor = vec4(vec3(aTexCoord, 0.0) + uTint.xyz * uTint.w, 1.0);
}
