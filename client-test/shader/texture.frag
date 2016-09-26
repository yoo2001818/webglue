#version 100

varying lowp vec2 vTexCoord;

uniform sampler2D uTexture;

void main() {
  lowp vec2 tex = vTexCoord;
  gl_FragColor = vec4(texture2D(uTexture, tex).xyz, 1.0);
}
