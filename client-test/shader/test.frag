#version 100

uniform sampler2D uTexture;

varying lowp vec3 vColor;
varying lowp vec2 vTexCoord;

void main(void) {
  gl_FragColor = vec4(vColor * texture2D(uTexture, vTexCoord).xyz, 1.0);
}
