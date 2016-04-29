attribute vec2 aPosition;

uniform mat4 uProjectionView;
uniform mat4 uModel;
uniform float uCrossSize;

void main(void) {
  vec4 pos = uProjectionView * uModel * vec4(aPosition, 0.0, 1.0);
  gl_Position = vec4(pos.xy, -1.0, pos.w);
  gl_PointSize = uCrossSize;
}
