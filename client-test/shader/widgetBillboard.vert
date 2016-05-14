#version 100

attribute vec3 aPosition;
attribute vec3 aColor;

varying lowp vec3 vColor;

uniform mat4 uProjectionView;
uniform mat4 uView;
uniform mat4 uModel;

void main(void) {
  lowp vec4 center = uProjectionView * uModel * vec4(0.0, 0.0, 0.0, 1.0);
  lowp float w = center.w;
  w *= 0.2;

  lowp mat4 billboard = mat4(
    uView[0].x, uView[1].x, uView[2].x, 0,
    uView[0].y, uView[1].y, uView[2].y, 0,
    uView[0].z, uView[1].z, uView[2].z, 0,
    uModel[3]
  );

  gl_Position = uProjectionView * billboard * vec4(aPosition * w, 1.0);
  vColor = aColor;
}
