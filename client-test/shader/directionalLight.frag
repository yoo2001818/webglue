#version 100

uniform lowp vec3 uColor;

uniform lowp float uRadius;
uniform lowp float uFill;
uniform lowp float uLine;
uniform lowp float uWidth;
uniform lowp float uCrossStart;

void main() {
  lowp vec2 center = (gl_PointCoord - vec2(0.5, 0.5)) * 2.0;
  lowp float dist = length(center);
  bool doOut = false;
  if (abs(dist - uLine) <= uWidth &&
    mod(degrees(atan(center.y, center.x))/15.0, 2.0) > 1.0
  ) {
    gl_FragColor = vec4(uColor, 1.0);
    doOut = true;
  }
  if (dist > uCrossStart && dist < 1.0 &&
    mod(degrees(atan(center.y, center.x)), 45.0) < 3.0
  ) {
    gl_FragColor = vec4(uColor, 1.0);
    doOut = true;
  }
  if (dist <= uFill) {
    gl_FragColor = vec4(uColor, 1.0);
    doOut = true;
  }
  if (!doOut) discard;
}
