#version 100

attribute vec3 aPosition;

uniform mat4 uProjectionView;
uniform mat4 uProjection;
uniform mat4 uModel;

varying lowp vec2 vDepth;

void main(void) {
  gl_Position = uProjectionView * uModel * vec4(aPosition, 1.0);
  vDepth = gl_Position.zw;
}
