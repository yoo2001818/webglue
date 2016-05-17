import ChannelGeometry from 'webglue/channelGeometry';

// A box geometry used to test ChannelGeometry.
export default class ChannelBoxGeometry extends ChannelGeometry {
  getChannelAttributes() {
    return ATTRIBUTES;
  }
  getChannelIndices() {
    return INDICES;
  }
}

const ATTRIBUTES = {
  aPosition: {
    axis: 3,
    data: new Float32Array([
      -1, -1, 1,
      1, -1, 1,
      1, 1, 1,
      -1, 1, 1,

      1, -1, -1,
      -1, -1, -1,
      -1, 1, -1,
      1, 1, -1
    ])
  },
  aNormal: {
    axis: 3,
    data: new Float32Array([
      0, 0, 1,
      0, 0, -1,
      1, 0, 0,
      -1, 0, 0,
      0, 1, 0,
      0, -1, 0
    ])
  },
  aTexCoord: {
    axis: 2,
    data: new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      1, 1
    ])
  },
  aTangent: {
    axis: 3,
    data: new Float32Array([
      0, 1, 0,
      0, -1, 0,
      0, 0, 1,
      0, 0, -1,
      1, 0, 0,
      -1, 0, 0
    ])
  }
};

const INDICES = {
  aPosition: [
    0, 1, 2, 2, 3, 0,
    4, 5, 6, 6, 7, 4,
    1, 4, 7, 7, 2, 1,
    3, 6, 5, 5, 0, 3,
    3, 2, 7, 7, 6, 3,
    5, 4, 1, 1, 0, 5
  ],
  aNormal: [
    0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1,
    2, 2, 2, 2, 2, 2,
    3, 3, 3, 3, 3, 3,
    4, 4, 4, 4, 4, 4,
    5, 5, 5, 5, 5, 5
  ],
  aTangent: [
    0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1,
    2, 2, 2, 2, 2, 2,
    3, 3, 3, 3, 3, 3,
    4, 4, 4, 4, 4, 4,
    5, 5, 5, 5, 5, 5
  ],
  aTexCoord: [
    0, 1, 3, 3, 2, 0,
    0, 1, 3, 3, 2, 0,
    0, 1, 3, 3, 2, 0,
    0, 1, 3, 3, 2, 0,
    0, 1, 3, 3, 2, 0,
    0, 1, 3, 3, 2, 0
  ]
};
