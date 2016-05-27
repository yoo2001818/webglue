#version 100

uniform sampler2D uTexture;
uniform lowp mat4 uProjection;

varying lowp vec3 vColor;
varying lowp vec2 vTexCoord;

void main(void) {
  lowp float value = texture2D(uTexture, vTexCoord).r;
  value = pow(value, 50.0);
  gl_FragColor = vec4(value, value, value, 1.0);
}
