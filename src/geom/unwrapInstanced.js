import parseAttributes from '../util/parseAttributes';
import parseIndices from '../util/parseIndices';
import createIndicesArray from '../util/createIndicesArray';
// import { LINE_LOOP, LINE_STRIP, TRIANGLE_STRIP, TRIANGLE_FAN } from
//  '../renderer/geometry';

export default function unwrapInstanced(input) {
  let instanced = input.instanced;
  let attributes = parseAttributes(input.attributes);
  let indices = parseIndices(input.indices);
  if (instanced == null) return input;
  let outAttributes = {};
  let outIndices = null;
  // TODO Check mode
  // Check vertex count and prim count
  let vertexCount = -1;
  let primCount = -1;
  for (let key in attributes) {
    let attribute = attributes[key];
    let instDiv = instanced[key] || 0;
    if (instDiv !== 0) {
      if (primCount === -1) {
        primCount = attribute.data.length / attribute.axis * instDiv;
      } else if (attribute.data.length !==
          primCount * attribute.axis / instDiv
      ) {
        throw new Error('Instanced primitive data size mismatch');
      }
    } else {
      if (vertexCount === -1) {
        vertexCount = attribute.data.length / attribute.axis;
      } else if (vertexCount !== attribute.data.length / attribute.axis) {
        throw new Error('Vertex count mismatch');
      }
    }
  }
  if (primCount <= 1) {
    // Return input with 'instanced' value removed
    return Object.assign({}, input, { instanced: undefined });
  }
  // Populate attributes
  for (let key in attributes) {
    let attribute = attributes[key];
    let instDiv = 0;
    if (instanced != null) instDiv = instanced[key] || 0;
    if (instDiv !== 0) {
      // Instanced attribute
      // Support other than Float32Array
      let out = new Float32Array(vertexCount * attribute.axis * primCount);
      // Copy the data
      for (let i = 0; i < primCount; ++i) {
        let outOffset = vertexCount * attribute.axis * i;
        let offset = i / instDiv | 0;
        let primData = attribute.data.subarray(offset * attribute.axis,
          (offset + 1) * attribute.axis);
        for (let j = 0; j < vertexCount; ++j) {
          out.set(primData, outOffset + j * attribute.axis);
        }
      }
      outAttributes[key] = {
        axis: attribute.axis, data: out
      };
    } else {
      // Support other than Float32Array
      let out = new Float32Array(vertexCount * attribute.axis * primCount);
      // Copy the data....
      for (let i = 0; i < primCount; ++i) {
        out.set(attribute.data, vertexCount * attribute.axis * i);
      }
      outAttributes[key] = {
        axis: attribute.axis, data: out
      };
    }
  }
  // Populate indices
  if (indices) {
    outIndices = createIndicesArray(vertexCount * primCount,
      indices.length * primCount);
    for (let i = 0; i < primCount; ++i) {
      let offset = i * indices.length;
      // Since we have to increment value, we can't just copy it
      for (let j = 0; j < indices.length; ++j) {
        outIndices[offset + j] = indices[j] + vertexCount * i;
      }
    }
  }
  // All done! export the value
  return {
    attributes: outAttributes,
    indices: outIndices,
    mode: input.mode
  };
}
