import Geometry from './geometry';

// ChannelGeometry allows to specify each attribute index separately in a
// vertex. (Indices must specify the vertex index per attribute.)
// This works like similar to RGBA channels in images - thus called
// 'ChannelGeometry'.

// TODO I'm not sure if this is a good name - If anyone have better idea about
// the class name, feel free to create pull request / issue.
export default class ChannelGeometry extends Geometry {
  constructor(name) {
    super(name);
    this.valid = false;
  }
  calculateVertices() {
    // TODO This does not optimize the number of vertices at all! We have to
    // use hashmap or else to cache the indices...
    // Of course, not optimizing means it can be implemented pretty easily.
    let channelAttribs = this.getChannelAttributes();
    let channelIndices = this.getChannelIndices();
    let attribs = {};
    let indicesSize = -1;
    let vertexCount = -1;
    let indices;
    // First, verify the indices size and populate the attrib arrays.
    for (let key in channelIndices) {
      // The attribute must be present
      if (channelAttribs[key] == null) {
        throw new Error('Attribute ' + key + ' is not defined');
      }
      let channelIndicesObj = channelIndices[key];
      if (channelIndicesObj == null) continue;
      // Save indices size if not initialized yet.
      if (indicesSize === -1) {
        indicesSize = channelIndicesObj.length;
        // Since it doesn't do any optimization yet, we can assume that vertex
        // count and indices size are same.
        vertexCount = channelIndicesObj.length;
      }
      // Verify the indices size.
      if (channelIndicesObj.length !== indicesSize) {
        throw new Error('Indices size does not match');
      }
      // Populate the attribute array.
      // TODO Support more than Float32Array?
      let axis = channelAttribs[key].axis;
      attribs[key] = {
        axis, data: new Float32Array(vertexCount * axis)
      };
    }
    // Then, populate the indices array.
    // TODO This will overflow if there are more than 65536 vertices.
    // Also, use Uint8Array if possible.
    indices = new Uint16Array(indicesSize);
    // Iterate through each indices and put the attribute data.
    for (let key in channelIndices) {
      let attribute = attribs[key];
      if (attribute == null) continue;
      let buffer = attribute.data;
      let axis = attribute.axis;
      let originalBuffer = channelAttribs[key].data;
      let indicesBuffer = channelIndices[key];
      for (let i = 0; i < indicesSize; ++i) {
        let originalPos = indicesBuffer[i];
        let original = originalBuffer.slice(axis * originalPos,
          axis * originalPos + axis);
        buffer.set(original, axis * i);
      }
    }
    // Put the indices data.
    for (let i = 0; i < indicesSize; ++i) {
      indices[i] = i;
    }
    // There we go! It's done.
    this.indices = indices;
    this.attribs = attribs;
    this.vertexCount = vertexCount;
  }
  validate() {
    if (!this.valid) {
      this.calculateVertices();
      this.valid = true;
    }
  }
  invalidate() {
    this.valid = false;
  }
  getAttributes() {
    this.validate();
    return this.attribs;
  }
  getIndices() {
    this.validate();
    return this.indices;
  }
  getVertexCount() {
    this.validate();
    return this.vertexCount;
  }
  // This is what child classes should override; child classes should not
  // override above methods!
  // TODO Child classes should be able to use name 'getAttributes',
  // 'getIndices', etc. In order to implement that, we must alter the method
  // as a property (thus overriding prototype), or use composition over
  // inheritence.
  getChannelAttributes() {
    return {};
  }
  getChannelIndices() {
    return {};
  }
}
