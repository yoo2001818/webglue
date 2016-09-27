#version 100

varying lowp vec2 vTexCoord;

uniform sampler2D uTexture;
uniform lowp vec2 uTextureOffset;

void main() {
  lowp vec2 tex = vTexCoord;
  lowp vec3 data = vec3(0.0, 0.0, 0.0);
  for (int x = - 1; x <= 1; ++x) {
    for (int y = - 1; y <= 1; ++y) {
      data += texture2D(uTexture, vTexCoord + uTextureOffset * vec2(x, y)).xyz;
    }
  }
  gl_FragColor = vec4(data / 9.0, 1.0);
}
