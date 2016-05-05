#version 100

uniform lowp vec3 uColor;

uniform lowp float uRadius;
uniform lowp float uFill;
uniform lowp float uLine1;
uniform lowp float uLine2;
uniform lowp float uWidth;

void main() {
  lowp vec2 center = (gl_PointCoord - vec2(0.5, 0.5)) * 2.0;
  lowp float dist = length(center);
  bool doOut = false;
  if (abs(dist - uLine1) <= uWidth &&
    mod(degrees(atan(center.y, center.x))/15.0, 2.0) > 1.0
  ) {
    gl_FragColor = vec4(uColor, 1.0);
    doOut = true;
  }
  if (abs(dist - uLine2) <= uWidth &&
    mod(degrees(atan(center.y, center.x))/15.0, 2.0) > 1.0
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
