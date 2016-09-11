import parseAttributes from '../util/parseAttributes';
import getVerticesCount from '../util/getVerticesCount';
import { vec2, vec3, vec4 } from 'gl-matrix';

function getTransformer(axis, transform) {
  // If function, just use it
  if (typeof transform === 'function') return transform;
  // Otherwise, try to find matching transformer
  if (Array.isArray(transform) || transform instanceof Float32Array) {
    if (axis === 2 && transform.length === 4) {
      return v => vec2.transformMat2(v, v, transform);
    } else if (axis === 2 && transform.length === 6) {
      return v => vec2.transformMat2d(v, v, transform);
    } else if (axis === 2 && transform.length === 9) {
      return v => vec2.transformMat3(v, v, transform);
    } else if (axis === 3 && transform.length === 9) {
      return v => vec3.transformMat3(v, v, transform);
    } else if (axis === 3 && transform.length === 16) {
      return v => vec3.transformMat4(v, v, transform);
    } else if (axis === 4 && transform.length === 16) {
      return v => vec4.transformMat4(v, v, transform);
    } else if (axis === transform.length) {
      return v => v.set(transform);
    } else {
      throw new Error('Unknown axis / transformer pair');
    }
  } else {
    throw new Error('Unknown transformer type');
  }
}

export default function transform(input, transforms) {
  if (Array.isArray(input)) return input.map(v => transform(v, transforms));
  // Create exact copy of the input, with some data modified.
  let attributes = parseAttributes(input.attributes);
  let verticesCount = -1;
  for (let key in transforms) {
    let attribute;
    if (attributes[key] == null) {
      if (verticesCount === -1) {
        verticesCount = getVerticesCount(input.attributes);
      }
      // Special case - if attribute doesn't exists and transformer's size
      // equals or is smaller than 4, create one.
      // TODO This can cause a confliction with 2x2 transform matrix
      if ((Array.isArray(transforms[key])
        || transforms[key] instanceof Float32Array) &&
        transforms[key].length <= 4
      ) {
        attribute = attributes[key] = {
          axis: transforms[key].length,
          data: new Float32Array(verticesCount * transforms[key].length)
        };
      } else {
        continue;
      }
    } else {
      attribute = attributes[key];
    }
    // Since geometry functions should be immutable, we must create a clone
    // to work with
    let data = attribute.data.slice();
    let axis = attribute.axis;
    let transform = getTransformer(axis, transforms[key]);
    // Infinite loop protection, though it can't protect NaN
    if (axis <= 0) throw new Error('Axis must be larger than 0');
    for (let i = 0; i < attribute.data.length; i += axis) {
      let value = data.subarray(i, i + axis);
      // Now, change the value (We can do it safely because we're working with
      // the clone)
      transform(value, i);
    }
    // Tada! Overwrite the attributes.
    attributes[key] = { axis, data };
  }
  return Object.assign({}, input, { attributes });
}
