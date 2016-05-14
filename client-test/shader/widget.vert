#version 100

attribute vec3 aPosition;
attribute vec3 aColor;

varying lowp vec3 vColor;

uniform mat4 uProjectionView;
uniform mat4 uModel;

void main(void) {
  lowp vec4 center = uProjectionView * uModel * vec4(0.0, 0.0, 0.0, 1.0);
  lowp float w = center.w;
  w *= 0.2;

  gl_Position = uProjectionView * uModel * vec4(aPosition * w, 1.0);
  gl_Position.z = -1.0 * gl_Position.w;
  vColor = aColor;
}
