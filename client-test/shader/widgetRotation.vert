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

  lowp vec4 translation = uView * uModel * vec4(aPosition * w, 0.0);
  lowp vec4 pos = center + vec4(translation.xy, 0.0, 0.0);
  gl_Position = uProjection * pos;
  vPosition = (center + translation).xyz;
  vColor = aColor;
}
