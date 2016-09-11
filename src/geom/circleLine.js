import { LINES } from '../renderer/geometry';

export default function circleLine(points, radius = 1) {
  let vertices = new Float32Array(points * 3);
  let indices = new Uint8Array(points * 2);
  for (let i = 0; i < points; ++i) {
    vertices[i * 3] = Math.cos(i / points * Math.PI * 2) * radius;
    vertices[i * 3 + 1] = Math.sin(i / points * Math.PI * 2) * radius;
    vertices[i * 3 + 2] = 0;
    indices[i * 2] = i;
    indices[i * 2 + 1] = i + 1;
  }
  indices[points * 2 - 1] = 0;
  return {
    attributes: { aPosition: { data: vertices, axis: 3 } },
    indices,
    mode: LINES
  };
}
