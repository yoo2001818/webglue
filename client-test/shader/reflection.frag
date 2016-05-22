#version 100

uniform lowp vec3 uViewPos;
uniform samplerCube uTexture;

varying lowp vec3 vPosition;
varying lowp vec3 vNormal;

void main(void) {
  lowp vec3 inVec = normalize(vPosition - uViewPos);
  lowp vec3 outVec = reflect(inVec, normalize(vNormal));
  gl_FragColor = textureCube(uTexture, outVec);
}
