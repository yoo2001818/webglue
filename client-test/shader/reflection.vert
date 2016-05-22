#version 100

attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uProjectionView;
uniform mat4 uModel;
uniform mat3 uModelInvTransp;
uniform lowp vec3 uViewPos;

varying lowp vec3 vPosition;
varying lowp vec3 vNormal;

void main(void) {
  gl_Position = uProjectionView * uModel * vec4(aPosition, 1.0);
  vPosition = (uModel * vec4(aPosition, 1.0)).xyz;
  vNormal = normalize(uModelInvTransp * aNormal);
}
