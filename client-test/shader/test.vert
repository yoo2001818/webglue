attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 uTransform;

varying lowp vec3 vColor;

void main(void) {
  gl_Position = uTransform * vec4(aPosition, 1.0);
  vColor = aNormal * 0.5 + 0.5;
}
