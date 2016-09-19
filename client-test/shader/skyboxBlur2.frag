#version 100
precision lowp float;

uniform samplerCube uSkybox;

varying lowp vec3 vFragPos;

void main(void) {
  vec4 sum = vec4(0.0);
  vec3 pos = normalize(vFragPos);
  float pitch = asin(pos.y) + 0.5;
  float yaw = atan(pos.x, pos.z);
  for (float x = -4.0; x <= 4.0; x += 1.0) {
    for (float y = -4.0; y <= 4.0; y += 1.0) {
      float curYaw = yaw + x / 100.0;
      float curPitch = pitch + y / 200.0;
      vec3 outPos = vec3(
        sin(curYaw) * cos(curPitch),
        sin(curPitch),
        cos(curYaw) * cos(curPitch)
      );
      sum += textureCube(uSkybox, normalize(outPos));
    }
  }
  gl_FragColor = vec4(sum.xyz / sum.w, 1.0);
}
