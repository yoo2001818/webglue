#version 100

uniform samplerCube uSkybox;

varying lowp vec3 vFragPos;

void main(void) {
  gl_FragColor = textureCube(uSkybox, vFragPos);
}
