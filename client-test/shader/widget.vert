#version 100

attribute vec3 aPosition;
attribute vec3 aColor;

varying lowp vec3 vColor;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat4 uProjectionView;

void main() {
  lowp float w;
  lowp vec4 center = uProjectionView * uModel * vec4(0.0, 0.0, 0.0, 1.0);
  if (uProjection[3].w == 1.0) {
    // Orthographic projection...
    w = 1.0 / uProjection[1].y * 0.3;
  } else {
    // Prespective projection...
    w = center.w;
    w *= 0.2;
  }
  gl_Position = uProjectionView * uModel * vec4(aPosition * w, 1.0);
  gl_Position.z = -1.0 * gl_Position.w;
  vColor = aColor;
}
