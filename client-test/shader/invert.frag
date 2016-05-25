#version 100

varying lowp vec2 vTexCoord;

uniform sampler2D vTexture;

void main() {
  gl_FragColor = texture2D(vTexture, vTexCoord);
}
