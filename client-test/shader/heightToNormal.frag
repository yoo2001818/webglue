#version 100
precision lowp float;

varying lowp vec2 vTexCoord;

uniform sampler2D uTexture;
uniform lowp vec2 uTextureOffset;
uniform lowp float uScale;

void main() {
  lowp vec2 tex = vTexCoord;
  lowp vec3 offset = vec3(1.0, 0.0, -1.0);
  float s11 = texture2D(uTexture, tex).x;
  float s01 = texture2D(uTexture, vec2(tex + offset.zy * uTextureOffset)).x;
  float s21 = texture2D(uTexture, vec2(tex + offset.xy * uTextureOffset)).x;
  float s10 = texture2D(uTexture, vec2(tex + offset.yz * uTextureOffset)).x;
  float s12 = texture2D(uTexture, vec2(tex + offset.yx * uTextureOffset)).x;

  vec3 va = normalize(vec3(uTextureOffset.x * 2.0, 0.0, (s21 - s01) * uScale));
  vec3 vb = normalize(vec3(0.0, uTextureOffset.y * 2.0, (s12 - s10) * uScale));

  vec3 normal = normalize(cross(va, vb));

  gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);
}
