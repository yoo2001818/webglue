#version 100

varying lowp vec2 vTexCoord;

uniform sampler2D uTexture;

void main() {
  gl_FragColor = vec4(vec3(1.0, 1.0, 1.0) - texture2D(uTexture, vTexCoord).xyz, 1.0);
}
