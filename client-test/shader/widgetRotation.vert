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
  lowp vec4 center = uView * uModel * vec4(0.0, 0.0, 0.0, 1.0);
  lowp vec4 projectionCenter = uProjection * center;
  lowp float w = projectionCenter.w;
  w *= 0.2;

  lowp vec4 pos = uView * uModel * vec4(aPosition * w, 1.0);
  gl_Position = uProjection * pos;
  gl_Position.z = -1.0 * gl_Position.w;
  vPosition = pos.xyz;
  vColor = aColor;
}
