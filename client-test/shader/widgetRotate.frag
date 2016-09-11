#version 100

varying lowp vec4 vColor;
varying lowp vec3 vPosition;

uniform lowp mat4 uView;
uniform lowp mat4 uModel;

void main(void) {
  if (vColor.w < 0.9) {
    lowp vec4 center = uView * uModel * vec4(0.0, 0.0, 0.0, 1.0);
    if (center.z > vPosition.z) discard;
  }
  gl_FragColor = vec4(vColor.xyz, 1.0);
}
