#version 100

attribute vec3 aPosition;

varying lowp vec3 vColor;
varying lowp vec3 vRawPosition;

uniform mat4 uProjectionView;
uniform mat4 uView;
uniform vec3 uViewPos;
uniform mat4 uModel;

uniform lowp vec3 uColor;

void main(void) {
  lowp vec3 modelPos = (uModel * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  lowp vec3 up = (uModel * vec4(1.0, 0.0, 0.0, 0.0)).xyz;
  up = normalize(up);
  lowp vec3 dir = modelPos - uViewPos;
  dir = normalize(dir);
  lowp vec3 y = cross(up, dir);
  y = normalize(y);
  lowp vec3 z = cross(up, y);
  y = normalize(y);
  lowp mat4 mat = mat4(
    vec4(up, 0.0),
    vec4(y, 0.0),
    vec4(z, 0.0),
    vec4(modelPos, 1.0)
  );
  gl_Position = uProjectionView * mat * vec4(aPosition, 1.0);
  vRawPosition = (uModel * vec4(aPosition, 0.0)).xyz;
  vColor = uColor;
}
