// import createIndicesArray from '../../util/createIndicesArray';
import parseAttributes from '../../util/parseAttributes';
import parseIndices from '../../util/parseIndices';

export default function channel(input) {
  let attributes = parseAttributes(input.attributes);
  let indicesArr = [];
  let indicesSize = -1;

  let indicesCache = {};
  let vertexCount = 0;

  let outputAttribs = {};
  let outputIndices = [];
  // First, verify the indices size and populate the attrib arrays.
  for (let key in input.indices) {
    let attribObj = attributes[key];
    // The attribute must be present
    if (attribObj == null) {
      throw new Error('Attribute ' + key + ' is not defined');
    }
    let indicesObj = parseIndices(input.indices[key]);
    if (indicesObj == null) continue;
    outputAttribs[key] = [];
    indicesArr.push({
      indices: indicesObj,
      data: attribObj.data,
      axis: attribObj.axis,
      outData: outputAttribs[key]
    });
    // Save indices size if not initialized yet.
    if (indicesSize === -1) {
      indicesSize = indicesObj.length;
    }
    // Verify the indices size.
    if (indicesObj.length !== indicesSize) {
      throw new Error('Indices size does not match');
    }
  }
  // Populate indices array while generating attributes data.
  for (let i = 0; i < indicesSize; ++i) {
    // Validate cache
    let key = indicesArr.map(({indices}) => indices[i]).join('/');
    let index = indicesCache[key];
    if (index == null) {
      indicesArr.forEach(({ indices, axis, data, outData }) => {
        let offset = indices[i] * axis;
        outData.push(data.slice(offset, offset + axis));
      });
      index = indicesCache[key] = vertexCount;
      vertexCount ++;
    }
    outputIndices.push(index);
  }
  return Object.assign({}, input, {
    attributes: parseAttributes(outputAttribs),
    indices: parseIndices(outputIndices)
  });
}
