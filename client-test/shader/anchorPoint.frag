#version 100

uniform lowp vec3 uCross;

uniform lowp vec3 uBorder2;
uniform lowp vec3 uBorder1;
uniform lowp float uBorderThreshold;

uniform lowp float uRadius;
uniform lowp float uBorderWidth;
uniform lowp float uCrossWidth;
uniform lowp float uCrossStart;

void main() {
  lowp vec2 center = (gl_PointCoord - vec2(0.5, 0.5)) * 2.0;
  lowp float dist = length(center);
  bool doOut = false;
  if (abs(dist - uRadius) <= uBorderWidth) {
    if (mod(degrees(atan(center.y, center.x))/30.0, 2.0) > 1.0) {
      gl_FragColor = vec4(uBorder1, 1.0);
    } else {
      gl_FragColor = vec4(uBorder2, 1.0);
    }
    doOut = true;
  }
  if (dist > uCrossStart &&
    (abs(center.x) <= uCrossWidth || abs(center.y) <= uCrossWidth)
  ) {
    gl_FragColor = vec4(uCross, 1.0);
    doOut = true;
  }
  if (!doOut) discard;
}
