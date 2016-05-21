#version 100

varying lowp float vDepth;

void main(void) {
  lowp float intensity = vDepth;
  gl_FragColor = vec4(intensity, intensity, intensity, 1.0);
}
