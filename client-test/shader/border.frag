#version 100

precision lowp float;

varying lowp vec2 vTexCoord;

uniform sampler2D uTexture;
uniform sampler2D uNormalTexture;
uniform sampler2D uDepthTexture;
uniform lowp vec2 uTextureOffset;

uniform lowp mat4 uProjection;

lowp vec4 topColor;

lowp float getDepth(sampler2D sampler, lowp vec2 pos) {
  lowp float value = texture2D(sampler, pos).x;

  if (uProjection[3].w != 1.0) {
    lowp float far = uProjection[3].z / (uProjection[2].z + 1.0);
    lowp float near = uProjection[3].z / (uProjection[2].z - 1.0);

    lowp float n = 2.0 * value - 1.0;
    value = 2.0 * near * far / (far + near - n * (far - near));
  }
  if (topColor.w > value) {
    topColor = texture2D(uTexture, pos);
    topColor.w = value;
  }
  return value * 0.01;
}

lowp float sobelDepth(sampler2D sampler) {
  lowp vec2 tex = vTexCoord;
  lowp float x = uTextureOffset.x;
  lowp float y = uTextureOffset.y;
  lowp float hori = 0.0;
  hori -= getDepth(sampler, vec2(tex.x - x * 3.0, tex.y - y)) * 3.0;
  hori -= getDepth(sampler, vec2(tex.x - x * 3.0, tex.y)) * 10.0;
  hori -= getDepth(sampler, vec2(tex.x - x * 3.0, tex.y + y)) * 3.0;
  hori -= getDepth(sampler, vec2(tex.x - x, tex.y - y)) * 3.0;
  hori -= getDepth(sampler, vec2(tex.x - x, tex.y)) * 10.0;
  hori -= getDepth(sampler, vec2(tex.x - x, tex.y + y)) * 3.0;
  hori += getDepth(sampler, vec2(tex.x + x, tex.y - y)) * 3.0;
  hori += getDepth(sampler, vec2(tex.x + x, tex.y)) * 10.0;
  hori += getDepth(sampler, vec2(tex.x + x, tex.y + y)) * 3.0;
  hori += getDepth(sampler, vec2(tex.x + x * 3.0, tex.y - y)) * 3.0;
  hori += getDepth(sampler, vec2(tex.x + x * 3.0, tex.y)) * 10.0;
  hori += getDepth(sampler, vec2(tex.x + x * 3.0, tex.y + y)) * 3.0;
  lowp float vert = 0.0;
  vert -= getDepth(sampler, vec2(tex.x - x, tex.y - y * 3.0)) * 3.0;
  vert -= getDepth(sampler, vec2(tex.x, tex.y - y * 3.0)) * 10.0;
  vert -= getDepth(sampler, vec2(tex.x + x, tex.y - y * 3.0)) * 3.0;
  vert -= getDepth(sampler, vec2(tex.x - x, tex.y - y)) * 3.0;
  vert -= getDepth(sampler, vec2(tex.x, tex.y - y)) * 10.0;
  vert -= getDepth(sampler, vec2(tex.x + x, tex.y - y)) * 3.0;
  vert += getDepth(sampler, vec2(tex.x - x, tex.y + y)) * 3.0;
  vert += getDepth(sampler, vec2(tex.x, tex.y + y)) * 10.0;
  vert += getDepth(sampler, vec2(tex.x + x, tex.y + y)) * 3.0;
  vert += getDepth(sampler, vec2(tex.x - x, tex.y + y * 3.0)) * 3.0;
  vert += getDepth(sampler, vec2(tex.x, tex.y + y * 3.0)) * 10.0;
  vert += getDepth(sampler, vec2(tex.x + x, tex.y + y * 3.0)) * 3.0;
  return sqrt(hori * hori + vert * vert);
}

lowp float sobelNormal(sampler2D sampler) {
  lowp vec2 tex = vTexCoord;
  lowp float x = uTextureOffset.x;
  lowp float y = uTextureOffset.y;
  lowp vec3 hori = vec3(0.0, 0.0, 0.0);
  hori -= texture2D(sampler, vec2(tex.x - x, tex.y - y)).xyz;
  hori -= texture2D(sampler, vec2(tex.x - x, tex.y)).xyz * 2.0;
  hori -= texture2D(sampler, vec2(tex.x - x, tex.y + y)).xyz;
  hori += texture2D(sampler, vec2(tex.x + x, tex.y - y)).xyz;
  hori += texture2D(sampler, vec2(tex.x + x, tex.y)).xyz * 2.0;
  hori += texture2D(sampler, vec2(tex.x + x, tex.y + y)).xyz;
  lowp vec3 vert = vec3(0.0, 0.0, 0.0);
  vert -= texture2D(sampler, vec2(tex.x - x, tex.y - y)).xyz;
  vert -= texture2D(sampler, vec2(tex.x, tex.y - y)).xyz * 2.0;
  vert -= texture2D(sampler, vec2(tex.x + x, tex.y - y)).xyz;
  vert += texture2D(sampler, vec2(tex.x - x, tex.y + y)).xyz;
  vert += texture2D(sampler, vec2(tex.x, tex.y + y)).xyz * 2.0;
  vert += texture2D(sampler, vec2(tex.x + x, tex.y + y)).xyz;
  lowp vec3 result = sqrt(hori * hori + vert * vert);
  return length(result);
}

// http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  topColor.w = 10000000.0;
  lowp float sobelDiff =
  pow(clamp(sobelDepth(uDepthTexture), 0.0, 1.0) * 10.0, 3.0) +
  pow(sobelNormal(uNormalTexture) * 0.6, 3.0);

  if (sobelDiff > 0.8) {
    vec3 hsv = rgb2hsv(topColor.xyz);
    hsv.r += 0.05;
    hsv.g += 0.08;
    hsv.b -= 0.3;
    gl_FragColor = vec4(hsv2rgb(hsv), 1.0);
    return;
  }
  gl_FragColor = texture2D(uTexture, vTexCoord) * (1.0 - sobelDiff);
  gl_FragColor.w = 1.0;
  // gl_FragColor = vec4(sobelDiff, sobelDiff, sobelDiff, 1.0);
}
