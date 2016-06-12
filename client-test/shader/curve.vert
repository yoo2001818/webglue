#version 100

attribute vec2 aPosition;

varying lowp vec2 vTexCoord;

uniform mat4 uProjectionView;
uniform mat4 uModel;

void main(void) {
  gl_Position = uProjectionView * uModel * vec4(aPosition, 0.0, 1.0);
  vTexCoord = aPosition * 0.5 + 0.5;
}
