#version 100

attribute vec3 aPosition;
attribute vec4 aColor;

varying lowp vec4 vColor;
varying lowp vec3 vPosition;

uniform lowp mat4 uModel;
uniform lowp mat4 uView;
uniform mat4 uProjection;
uniform mat4 uProjectionView;

void main() {
  lowp float w;
  lowp vec4 center = uProjectionView * uModel * vec4(0.0, 0.0, 0.0, 1.0);
  if (uProjection[3].w == 1.0) {
    // Orthographic projection...
    w = 1.0 / uProjection[1].y * 0.3;
  } else {
    // Prespective projection...
    w = center.w;
    w *= 0.2;
  }

  if (aColor.w > 0.9) {
    lowp mat4 billboard = mat4(
      uView[0].x, uView[1].x, uView[2].x, 0,
      uView[0].y, uView[1].y, uView[2].y, 0,
      uView[0].z, uView[1].z, uView[2].z, 0,
      uModel[3]
    );

    gl_Position = uProjectionView * billboard * vec4(aPosition * w, 1.0);
  } else {
    gl_Position = uProjectionView * uModel * vec4(aPosition * w, 1.0);
    vPosition = (uView * uModel * vec4(aPosition * w, 1.0)).xyz;
  }
  gl_Position.z = -1.0 * gl_Position.w;
  vColor = aColor;
}
