#version 100

varying lowp vec2 vTexCoord;

uniform sampler2D uTexture;
uniform lowp vec2 uTextureOffset;

void main() {
  lowp vec2 tex = vTexCoord;
  lowp float x = uTextureOffset.x;
  lowp float y = uTextureOffset.y;
  lowp vec3 hori = vec3(0.0, 0.0, 0.0);
  hori -= texture2D(uTexture, vec2(tex.x - x, tex.y - y)).xyz;
  hori -= texture2D(uTexture, vec2(tex.x - x, tex.y)).xyz * 2.0;
  hori -= texture2D(uTexture, vec2(tex.x - x, tex.y + y)).xyz;
  hori += texture2D(uTexture, vec2(tex.x + x, tex.y - y)).xyz;
  hori += texture2D(uTexture, vec2(tex.x + x, tex.y)).xyz * 2.0;
  hori += texture2D(uTexture, vec2(tex.x + x, tex.y + y)).xyz;
  lowp vec3 vert = vec3(0.0, 0.0, 0.0);
  vert -= texture2D(uTexture, vec2(tex.x - x, tex.y - y)).xyz;
  vert -= texture2D(uTexture, vec2(tex.x, tex.y - y)).xyz * 2.0;
  vert -= texture2D(uTexture, vec2(tex.x + x, tex.y - y)).xyz;
  vert += texture2D(uTexture, vec2(tex.x - x, tex.y + y)).xyz;
  vert += texture2D(uTexture, vec2(tex.x, tex.y + y)).xyz * 2.0;
  vert += texture2D(uTexture, vec2(tex.x + x, tex.y + y)).xyz;
  gl_FragColor = vec4(sqrt(hori * hori + vert * vert), 1.0);
}
