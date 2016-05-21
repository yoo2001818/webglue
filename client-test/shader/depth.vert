#version 100

attribute vec3 aPosition;

uniform mat4 uProjectionView;
uniform mat4 uView;
uniform mat4 uViewInv;
uniform mat4 uModel;
uniform mat3 uModelInvTransp;
uniform vec3 uViewPos;

varying lowp float vDepth;

void main(void) {
  gl_Position = uProjectionView * uModel * vec4(aPosition, 1.0);
  vDepth = gl_Position.z / gl_Position.w;
}
