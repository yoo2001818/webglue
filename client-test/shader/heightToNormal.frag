#version 100
precision lowp float;

varying lowp vec2 vTexCoord;

uniform sampler2D uTexture;
uniform lowp vec2 uTextureOffset;
uniform lowp float uScale;

void main() {
  lowp vec2 tex = vTexCoord;
  lowp vec3 offset = vec3(1.0, 0.0, -1.0);
  // Since we can't use higher detail (8bit RGB limitation), we have to
  // use blur for heightmaps.
  float s11 = texture2D(uTexture, tex).x;
  float s00 = texture2D(uTexture, vec2(tex + offset.zz * uTextureOffset)).x;
  float s22 = texture2D(uTexture, vec2(tex + offset.xx * uTextureOffset)).x;
  float s20 = texture2D(uTexture, vec2(tex + offset.xz * uTextureOffset)).x;
  float s02 = texture2D(uTexture, vec2(tex + offset.zx * uTextureOffset)).x;

  vec3 va = normalize(vec3(uTextureOffset.x * 2.0, 0.0,
    ((s20 - s00) + (s22 - s02)) * uScale));
  vec3 vb = normalize(vec3(0.0, uTextureOffset.y * 2.0,
    ((s02 - s00) + (s22 - s20)) * uScale));

  vec3 normal = normalize(cross(va, vb));

  gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);
}
