#version 100

varying lowp vec2 vTexCoord;

uniform sampler2D uTexture;

lowp float decodeRGToFloat(lowp vec2 v) {
  return dot(v, vec2(1.0, 1.0 / 255.0));
}

void main() {
  lowp vec4 value = texture2D(uTexture, vTexCoord);
  lowp float depth = pow(decodeRGToFloat(value.rg), 10.0);
  lowp float moment = decodeRGToFloat(value.rg);
  gl_FragColor = vec4(depth, depth, moment, 1.0);
}
