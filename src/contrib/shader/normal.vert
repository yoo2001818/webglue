#version 100

attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 uProjectionView;
uniform mat4 uView;
uniform mat4 uViewInv;
uniform mat4 uModel;
uniform mat3 uModelInvTransp;
uniform vec3 uViewPos;

varying lowp vec3 vColor;

void main(void) {
  gl_Position = uProjectionView * uModel * vec4(aPosition, 1.0);
  lowp vec3 normalDir = normalize(
    (uView * vec4(uModelInvTransp * aNormal, 0.0)).xyz);
  vColor = normalDir * 0.5 + vec3(0.5, 0.5, 0.5);
}
