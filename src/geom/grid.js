import { LINES } from '../renderer/geometry';

// Generates 2D grid geometry
export default function grid(width = 17, height = 17, gap = 1) {
  let vertices = new Float32Array(4 * (width + height));
  let minX = -(width - 1) / 2 * gap;
  let minY = -(height - 1) / 2 * gap;
  let maxX = (width - 1) / 2 * gap;
  let maxY = (height - 1) / 2 * gap;
  let pos = 0;
  for (let y = 0; y < height; ++y) {
    let offsetY = (y - (height - 1) / 2) * gap;
    vertices[pos++] = minX;
    vertices[pos++] = offsetY;
    vertices[pos++] = maxX;
    vertices[pos++] = offsetY;
  }
  for (let x = 0; x < width; ++x) {
    let offsetX = (x - (width - 1) / 2) * gap;
    vertices[pos++] = offsetX;
    vertices[pos++] = minY;
    vertices[pos++] = offsetX;
    vertices[pos++] = maxY;
  }
  return {
    attributes: {
      aPosition: { axis: 2, data: vertices }
    },
    mode: LINES
  };
}
