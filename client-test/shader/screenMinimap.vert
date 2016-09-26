#version 100

attribute float aPosition;
attribute vec3 aStart;
attribute vec3 aEnd;

uniform lowp mat4 uView;

varying lowp vec2 vTexCoord;

vec3 getViewPosWorld() {
  return -mat3(
    uView[0].x, uView[1].x, uView[2].x,
    uView[0].y, uView[1].y, uView[2].y,
    uView[0].z, uView[1].z, uView[2].z
    ) * uView[3].xyz;
}

void main() {
  vec3 viewCenter = getViewPosWorld();
  vec3 pos = (mix(aStart, aEnd, aPosition) - viewCenter) / 300.0;
  gl_Position = vec4(0.5 + pos.xz * vec2(0.5, -0.5), -1.0, 1.0);
  vTexCoord = vec2((pos.xz + 1.0) / 2.0);
}
