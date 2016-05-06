#version 100

varying lowp vec3 vPosition;
varying lowp vec3 vColor;

uniform lowp float uDotted;

void main(void) {
  lowp float len = vPosition.x + vPosition.y + vPosition.z;
  if (abs(mod(len, uDotted)) < uDotted / 2.0) discard;
  gl_FragColor = vec4(vColor, 1.0);
}
