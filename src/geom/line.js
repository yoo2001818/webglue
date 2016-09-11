import { LINES } from '../renderer/geometry';

export default function line() {
  return {
    attributes: {
      aPosition: [[0, 0, 0], [1, 0, 0]]
    },
    mode: LINES
  };
}
