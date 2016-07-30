#version 100

attribute vec3 aPosition;
attribute vec3 aColor;

varying lowp vec3 vColor;
varying lowp vec3 vPosition;

uniform lowp mat4 uProjectionView;
uniform lowp mat4 uProjection;
uniform lowp mat4 uView;
uniform lowp mat4 uModel;

void main(void) {
  lowp float w;
  if (uProjection[3].w == 1.0) {
    // Orthographic projection...
    w = 1.0 / uProjection[1].y * 0.3;
  } else {
    // Prespective projection...
    lowp vec4 center = uProjectionView * uModel * vec4(0.0, 0.0, 0.0, 1.0);
    w = center.w;
    w *= 0.2;
  }

  lowp vec4 pos = uView * uModel * vec4(aPosition * w, 1.0);
  gl_Position = uProjection * pos;
  gl_Position.z = -1.0 * gl_Position.w;
  vPosition = pos.xyz;
  vColor = aColor;
}
