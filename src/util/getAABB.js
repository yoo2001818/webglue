import { parseAttribute } from './parseAttributes';
// Gets the AABB for selected geometry.
export default function getAABB(geom, attribName = 'aPosition') {
  let attribute = parseAttribute(geom.attributes[attribName]);
  // We don't have to check indices as long as all attributes are being used.
  let { axis, data } = attribute;
  // Create AABB - it uses single Float32Array for both min / max values.
  let aabb = new Float32Array(axis * 2);
  for (let i = 0; i < axis; ++i) {
    aabb[i] = Infinity;
    aabb[axis + i] = -Infinity;
  }
  // Then test each vertex. :S
  for (let i = 0; i < data.length; i += axis) {
    for (let j = 0; j < axis; ++j) {
      let current = data[i + j];
      if (aabb[j] > current) aabb[j] = current;
      if (aabb[axis + j] < current) aabb[axis + j] = current;
    }
  }
  // All done!
  return aabb;
}
