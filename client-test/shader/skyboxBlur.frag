#version 100
precision lowp float;

uniform samplerCube uSkybox;

varying lowp vec3 vFragPos;
varying lowp vec3 vTangent;
varying lowp vec3 vBiTangent;

void main(void) {
  vec4 sum = vec4(0.0);
  vec3 pos = normalize(vFragPos);
  for (float x = -4.0; x <= 4.0; x += 1.0) {
    for (float y = -4.0; y <= 4.0; y += 1.0) {
      sum += textureCube(uSkybox, normalize(pos + (x * vTangent + y * vBiTangent) / 80.0));
    }
  }
  gl_FragColor = vec4(sum.xyz / sum.w, 1.0);
}
