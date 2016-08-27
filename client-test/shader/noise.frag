#version 100
precision lowp float;

varying lowp vec2 vTexCoord;
uniform float uStep;

float rand(vec2 co){
  return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
  vec2 coord = vTexCoord + vec2(mod(uStep, 97.0), mod(uStep, 60.0));
  gl_FragColor = vec4(
    rand(coord),
    rand(coord + vec2(1.0, 0.0)),
    rand(coord + vec2(0.0, 1.0)),
    1.0);
}
