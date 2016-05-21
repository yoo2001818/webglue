#version 100

attribute vec3 aPosition;

uniform mat4 uProjectionView;
uniform mat4 uProjection;
uniform mat4 uModel;

varying lowp float vDepth;

void main(void) {
  gl_Position = uProjectionView * uModel * vec4(aPosition, 1.0);
  if (gl_Position.w != 1.0) {
    // Calculate far plane
    lowp float far = uProjection[3].z / (uProjection[2].z + 1.0);
    vDepth = gl_Position.z * 50.0 / far;
  } else {
    vDepth = gl_Position.z * 0.5 + 0.5;
  }
}
