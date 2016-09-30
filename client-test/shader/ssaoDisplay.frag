#version 100

varying lowp vec2 vTexCoord;

uniform sampler2D uTexture;
uniform lowp vec2 uTextureOffset;

void main() {
  lowp vec2 tex = vTexCoord;
  lowp vec3 data = vec3(0.0, 0.0, 0.0);
  data += 1.0 * texture2D(uTexture, tex + uTextureOffset * vec2(-1, -1)).xyz;
  data += 2.0 * texture2D(uTexture, tex + uTextureOffset * vec2(0, -1)).xyz;
  data += 1.0 * texture2D(uTexture, tex + uTextureOffset * vec2(1, -1)).xyz;
  data += 2.0 * texture2D(uTexture, tex + uTextureOffset * vec2(-1, 0)).xyz;
  data += 4.0 * texture2D(uTexture, tex + uTextureOffset * vec2(0, 0)).xyz;
  data += 2.0 * texture2D(uTexture, tex + uTextureOffset * vec2(1, 0)).xyz;
  data += 1.0 * texture2D(uTexture, tex + uTextureOffset * vec2(-1, 1)).xyz;
  data += 2.0 * texture2D(uTexture, tex + uTextureOffset * vec2(0, 1)).xyz;
  data += 1.0 * texture2D(uTexture, tex + uTextureOffset * vec2(1, 1)).xyz;
  gl_FragColor = vec4(data / 16.0, 1.0);
}
