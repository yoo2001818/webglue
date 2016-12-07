#version 100
#pragma webglue: feature(USE_NORMAL_MAP, uNormalMap)
#pragma webglue: feature(USE_HEIGHT_MAP, uHeightMap)
#pragma webglue: frustumCull
#if defined(USE_NORMAL_MAP) || defined(USE_HEIGHT_MAP)
  #define USE_TANGENT_SPACE
#endif

precision lowp float;

attribute vec2 aTexCoord;
attribute vec3 aNormal;
attribute vec3 aPosition;
attribute vec4 aTangent;

attribute vec3 aInstPos;

varying lowp vec3 vPosition;
varying lowp vec2 vTexCoord;
varying lowp vec3 vViewPos;

#ifdef USE_TANGENT_SPACE
  varying lowp vec4 vTangent;
#endif
varying lowp vec3 vNormal;

uniform mat4 uProjectionView;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat3 uNormal;

vec3 getViewPosWorld() {
  return -mat3(
    uView[0].x, uView[1].x, uView[2].x,
    uView[0].y, uView[1].y, uView[2].y,
    uView[0].z, uView[1].z, uView[2].z
    ) * uView[3].xyz;
}

void main() {
  vec4 fragPos = uModel * vec4(aPosition, 1.0) + vec4(aInstPos, 0.0);
  gl_Position = uProjectionView * fragPos;
  vTexCoord = aTexCoord;
  #ifdef USE_TANGENT_SPACE
    vTangent = aTangent;
  #endif
  vPosition = fragPos.xyz;
  vNormal = uNormal * aNormal;
  vViewPos = getViewPosWorld();
}
