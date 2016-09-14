import createIndicesArray from '../../util/createIndicesArray';
import parseAttributes from '../../util/parseAttributes';

export default function channelOld(input) {
  let attributes = parseAttributes(input.attributes);
  let indices = input.indices;
  let indicesSize = -1;
  let vertexCount = -1;
  let outputAttribs = {};
  let outputIndices;
  // First, verify the indices size and populate the attrib arrays.
  for (let key in indices) {
    // The attribute must be present
    if (attributes[key] == null) {
      throw new Error('Attribute ' + key + ' is not defined');
    }
    let indicesObj = indices[key];
    if (indicesObj == null) continue;
    // Save indices size if not initialized yet.
    if (indicesSize === -1) {
      indicesSize = indicesObj.length;
      // Since it doesn't do any optimization yet, we can assume that vertex
      // count and indices size are same.
      vertexCount = indicesObj.length;
    }
    // Verify the indices size.
    if (indicesObj.length !== indicesSize) {
      throw new Error('Indices size does not match');
    }
    // Populate the attribute array.
    // TODO Support more than Float32Array?
    let axis = attributes[key].axis;
    outputAttribs[key] = {
      axis, data: new Float32Array(vertexCount * axis)
    };
  }
  // Then, populate the indices array.
  outputIndices = createIndicesArray(vertexCount, indicesSize);
  // Iterate through each indices and put the attribute data.
  for (let key in indices) {
    let attribute = outputAttribs[key];
    if (attribute == null) continue;
    let buffer = attribute.data;
    let axis = attribute.axis;
    let originalBuffer = attributes[key].data;
    let indicesBuffer = indices[key];
    for (let i = 0; i < indicesSize; ++i) {
      let originalPos = indicesBuffer[i];
      let original = originalBuffer.slice(axis * originalPos,
        axis * originalPos + axis);
      buffer.set(original, axis * i);
    }
  }
  // Put the indices data.
  for (let i = 0; i < indicesSize; ++i) {
    outputIndices[i] = i;
  }
  return Object.assign({}, input, {
    attributes: outputAttribs,
    indices: outputIndices
  });
}
