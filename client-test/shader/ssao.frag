#version 100
precision lowp float;

#define SAMPLE_COUNT 16
#define PATTERN_SIZE 4.0

varying lowp vec2 vTexCoord;

uniform lowp vec2 uRange;

uniform lowp mat4 uInverseProjection;
uniform lowp mat4 uProjection;
uniform lowp float uRadius;

uniform sampler2D uTexture;
uniform lowp vec2 uTextureOffset;

float rand(vec2 co){
  return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
}

vec3 getSample(int i) {
  vec2 coord = mod(floor(gl_FragCoord.xy), PATTERN_SIZE);
  float y = (coord.x + coord.y * PATTERN_SIZE + 0.5) /
    (PATTERN_SIZE * PATTERN_SIZE);
  float x = float(i) / float(SAMPLE_COUNT);
  vec3 sampler = vec3(
    rand(vec2(x, y + 1.0)) * 2.0 - 1.0,
    rand(vec2(x, y - 1.0)) * 2.0 - 1.0,
    rand(vec2(x, y))
  );
  sampler = normalize(sampler);
  sampler *= mix(0.1, 1.0, x * x);
  return sampler;
}

vec3 getNoise() {
  vec2 coord = mod(floor(gl_FragCoord.xy), PATTERN_SIZE);
  return normalize(vec3(
    rand(vec2(coord.x + 1.0, coord.y)) * 2.0 - 1.0,
    rand(vec2(coord.x - 1.0, coord.y)) * 2.0 - 1.0,
    0.0
  ));
}

vec3 getUV(vec3 pos) {
  vec4 ndc = uProjection * vec4(pos, 1.0);
  return ndc.xyz / ndc.w * 0.5 + 0.5;
}

vec3 decodeNormal(vec2 xy) {
  // 1 = x*x + y*y + z*z.
  // z = sqrt(1 - x*x - y*y)
  xy = xy * 2.0 - 1.0;
  return vec3(xy, sqrt(1.0 - dot(xy, xy)));
}

float decodeDepth(vec2 v) {
  return dot(v, vec2(1.0, 1.0 / 255.0)) * uRange.y + uRange.x;
}

void main() {
  vec3 viewRay = normalize((uInverseProjection *
    vec4(vTexCoord * 2.0 - 1.0, -1.0, 1.0)).xyz);
  vec4 fragData = texture2D(uTexture, vTexCoord);
  vec3 normal = decodeNormal(fragData.rg);
  float depth = decodeDepth(fragData.ba);
  vec3 viewPos = depth * viewRay;
  // Calculate TBN
  vec3 randomVec = getNoise();
  vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
  vec3 biTangent = cross(normal, tangent);
  mat3 TBN = mat3(tangent, biTangent, normal);

  float occulsion = 0.0;
  for (int i = 0; i < SAMPLE_COUNT; ++i) {
    vec3 sampleDir = TBN * (getSample(i) * uRadius);
    vec3 sampleVec = sampleDir + viewPos;
    vec3 sampleCoord = getUV(sampleVec);
    vec3 sampleRay = normalize((uInverseProjection *
      vec4(sampleCoord.xy * 2.0 - 1.0, -1.0, 1.0)).xyz);

    vec4 sampleData = texture2D(uTexture, sampleCoord.xy);
    // vec3 sampleNormal = decodeNormal(sampleData.rg);
    float sampleDepth = decodeDepth(sampleData.ba);
    vec3 samplePos = sampleRay * sampleDepth;

    float rangeCheck = smoothstep(0.0, 1.0, uRadius / abs(samplePos.z - viewPos.z));
    occulsion += (sampleVec.z <= samplePos.z ? 1.0 : 0.0) * rangeCheck;
  }
  occulsion = pow(1.0 - (occulsion / float(SAMPLE_COUNT)), 1.50);
  gl_FragColor = vec4(vec3(occulsion), 1.0);
}
