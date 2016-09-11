import circleLine from './circleLine';
import transform from './transform';
import combine from './combine';
export default function rotateWidget() {
  let circleGeom = circleLine(32);
  return combine([transform(circleGeom, {
    aColor: [0, 0, 1, 0]
  }), transform(circleGeom, {
    aColor: [1, 0, 0, 0],
    aPosition: [
      0, 1, 0, 0,
      0, 0, 1, 0,
      1, 0, 0, 0,
      0, 0, 0, 1
    ]
  }), transform(circleGeom, {
    aColor: [0, 1, 0, 0],
    aPosition: [
      0, 0, 1, 0,
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 0, 1
    ]
  }), transform(circleGeom, {
    aColor: [0, 0, 0, 1]
  })]);
}
