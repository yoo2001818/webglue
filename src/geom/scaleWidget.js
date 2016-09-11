import box from './box';
import line from './line';
import transform from './transform';
import combine from './combine';
export default function scaleWidget() {
  // Create single 'arrow' first
  let arrow = combine([transform(box(), {
    aPosition: [
      0, 0, 1/16, 0,
      1/16, 0, 0, 0,
      0, 1/16, 0, 0,
      15/16, 0, 0, 1
    ]
  }), line()]);
  return combine([transform(arrow, {
    aColor: [1, 0, 0]
  }), transform(arrow, {
    aColor: [0, 1, 0],
    aPosition: [
      0, 1, 0, 0,
      0, 0, 1, 0,
      1, 0, 0, 0,
      0, 0, 0, 1
    ]
  }), transform(arrow, {
    aColor: [0, 0, 1],
    aPosition: [
      0, 0, 1, 0,
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 0, 1
    ]
  })]);
}
