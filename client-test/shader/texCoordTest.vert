#version 100

attribute vec2 aTexCoord;
attribute vec3 aPosition;

varying lowp vec4 vColor;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;

uniform vec4 uTint;

void main() {
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
  vColor = vec4(vec3(aTexCoord, 0.0) + uTint.xyz * uTint.w, 1.0);
}
