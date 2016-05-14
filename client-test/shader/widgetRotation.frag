#version 100

varying lowp vec3 vColor;
varying lowp vec3 vPosition;

uniform lowp mat4 uView;
uniform lowp mat4 uModel;

void main(void) {
  lowp vec4 center = uView * uModel * vec4(0.0, 0.0, 0.0, 1.0);
  if (center.z > vPosition.z) discard;
  gl_FragColor = vec4(vColor, 1.0);
}
