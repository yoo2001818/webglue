attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 uProjectionView;
uniform mat4 uModel;

varying lowp vec2 vTexCoord;
varying lowp vec3 vColor;

void main(void) {
  gl_Position = uProjectionView * uModel * vec4(aPosition, 1.0);
  vColor = vec3(aTexCoord.xy, 0.0);
  vTexCoord = vec2(aTexCoord.x, 1.0 - aTexCoord.y);
}
