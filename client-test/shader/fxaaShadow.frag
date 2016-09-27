#version 100

precision lowp float;

/**
Basic FXAA implementation based on the code on geeks3d.com with the
modification that the texture2DLod stuff was removed since it's
unsupported by WebGL.

--
From (1):
https://github.com/mattdesl/glsl-fxaa

From (2):
https://github.com/mitsuhiko/webgl-meincraft

Copyright (c) 2011 by Armin Ronacher.

Some rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.

    * Redistributions in binary form must reproduce the above
      copyright notice, this list of conditions and the following
      disclaimer in the documentation and/or other materials provided
      with the distribution.

    * The names of the contributors may not be used to endorse or
      promote products derived from this software without specific
      prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

#ifndef FXAA_REDUCE_MIN
    #define FXAA_REDUCE_MIN   (1.0/ 128.0)
#endif
#ifndef FXAA_REDUCE_MUL
    #define FXAA_REDUCE_MUL   (1.0 / 8.0)
#endif
#ifndef FXAA_SPAN_MAX
    #define FXAA_SPAN_MAX     8.0
#endif

lowp vec2 encodeFloatToRG(lowp float v) {
  lowp vec2 enc = vec2(1.0, 255.0) * v;
  enc = fract(enc);
  enc -= enc.yy * vec2(1.0 / 255.0, 0.0);
  return enc;
}

lowp float decodeRGToFloat(lowp vec2 v) {
  return dot(v, vec2(1.0, 1.0 / 255.0));
}

vec2 shadowTex2D(sampler2D tex, vec2 fragCoord) {
  vec4 value = texture2D(tex, fragCoord);
  return vec2(decodeRGToFloat(value.rg), decodeRGToFloat(value.ba));
}

//optimized version for mobile, where dependent
//texture reads can be a bottleneck
vec2 fxaa(sampler2D tex, vec2 fragCoord, vec2 resolution) {
    vec2 rgbNW = shadowTex2D(tex, fragCoord + vec2(-1.0, -1.0) * resolution).xy;
    vec2 rgbNE = shadowTex2D(tex, fragCoord + vec2(1.0, -1.0) * resolution).xy;
    vec2 rgbSW = shadowTex2D(tex, fragCoord + vec2(-1.0, 1.0) * resolution).xy;
    vec2 rgbSE = shadowTex2D(tex, fragCoord + vec2(1.0, 1.0) * resolution).xy;
    vec2 texColor = shadowTex2D(tex, fragCoord);
    vec2 rgbM  = texColor;
    vec2 luma = vec2(0.3, 0.3);
    float lumaNW = dot(rgbNW, luma);
    float lumaNE = dot(rgbNE, luma);
    float lumaSW = dot(rgbSW, luma);
    float lumaSE = dot(rgbSE, luma);
    float lumaM  = dot(rgbM,  luma);
    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

    mediump vec2 dir;
    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));

    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *
                          (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);

    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
    dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),
              max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),
              dir * rcpDirMin)) * resolution;

    vec2 rgbA = 0.5 * (
        shadowTex2D(tex, fragCoord + dir * (1.0 / 3.0 - 0.5)) +
        shadowTex2D(tex, fragCoord + dir * (2.0 / 3.0 - 0.5)));
    vec2 rgbB = rgbA * 0.5 + 0.25 * (
        shadowTex2D(tex, fragCoord + dir * -0.5) +
        shadowTex2D(tex, fragCoord + dir * 0.5));

    float lumaB = dot(rgbB, luma);
    if ((lumaB < lumaMin) || (lumaB > lumaMax))
        return rgbA;
    else
        return rgbB;
}

varying lowp vec2 vTexCoord;

uniform sampler2D uTexture;
uniform lowp vec2 uTextureOffset;

void main() {
  vec2 values = fxaa(uTexture, vTexCoord, uTextureOffset);
  gl_FragColor = vec4(encodeFloatToRG(values.x), encodeFloatToRG(values.y));
}
