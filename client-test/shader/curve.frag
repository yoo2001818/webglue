#version 100

varying lowp vec2 vTexCoord;

lowp float f(lowp vec2 coord) {
  lowp float x = coord.x;
  lowp float y = coord.y;
  return x*x*x*x - x*x*y + y*y*y;
}

void main() {
  lowp vec2 coord = (vTexCoord * 2.0 - 1.0);
  lowp float d = f(coord);
  #extension GL_OES_standard_derivatives : enable
  // lowp vec2 delta = 1.0 / uTextureSize * 2.0;
  lowp vec2 delta = dFdx(coord) + dFdy(coord);
  lowp float intensity = 0.0;
  if (d == 0.0) intensity = 1.0;
  if (f(coord + (delta * vec2(1.0, 0.0))) * d < 0.0) intensity += 0.5;
  if (f(coord + (delta * vec2(-1.0, 0.0))) * d < 0.0) intensity += 0.5;
  if (f(coord + (delta * vec2(0.0, 1.0))) * d < 0.0) intensity += 0.5;
  if (f(coord + (delta * vec2(0.0, -1.0))) * d < 0.0) intensity += 0.5;
  // intensity /= 2.0;
  // if (d > 0.0) intensity = 1.0;
  gl_FragColor = vec4(intensity, intensity, intensity, 1.0);
}
