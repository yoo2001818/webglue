#version 100

attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform lowp vec3 uViewPos;
uniform mat4 uProjectionView;
uniform mat4 uModel;
uniform mat3 uModelInvTransp;

varying lowp vec2 vTexCoord;
varying lowp vec3 vFragPos;
varying lowp vec3 vNormal;

void main(void) {
  vec4 fragPos = uModel * vec4(aPosition, 1.0);
  gl_Position = uProjectionView * fragPos;
  // OpenGL's Y axis is inverted... not sure why though.
  vTexCoord = vec2(aTexCoord.x, 1.0 - aTexCoord.y);
  vFragPos = fragPos.xyz;
  vNormal = uModelInvTransp * normalize(aNormal);
}
