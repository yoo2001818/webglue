#version 100
#extension GL_OES_standard_derivatives : enable

lowp vec3 encodeFloatToRGB(lowp float v) {
  lowp vec3 enc = vec3(1.0, 255.0, 65025.0) * v;
  enc = fract(enc);
  enc -= enc.yzz * vec3(1.0 / 255.0, 1.0 / 255.0, 0.0);
  return enc;
}

lowp vec2 encodeFloatToRG(lowp float v) {
  lowp vec2 enc = vec2(1.0, 255.0) * v;
  enc = fract(enc);
  enc -= enc.yy * vec2(1.0 / 255.0, 0.0);
  return enc;
}

void main(void) {
  lowp float intensity = gl_FragCoord.z / gl_FragCoord.w;
  lowp float dx = dFdx(intensity);
  lowp float dy = dFdy(intensity);
  lowp float moment = intensity * intensity + 0.25 * (dx * dx + dy * dy);
  gl_FragColor = vec4(encodeFloatToRG(intensity), encodeFloatToRG(moment));
}
