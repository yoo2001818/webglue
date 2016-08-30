export default function uvSphere(segments, rings) {
  // A UV Sphere consists of many regular N-polygons, which serves as
  // a 'ring'. Its radius gracefully goes small, and eventually reach 0
  // at the top. A sphere is defined as x^2 + y^2 + z^2 = 1. Which converts
  // to 1 - z^2 = x^2 + y^2. We can derive that a ring's radius is
  // sqrt(1 - z^2) from that equation.
  // The sphere has ring * (segment - 2) + 2 vertices. Since radius 0 means
  // a single point, we can remove 2 rings from top and bottom.
  // However, OpenGL requires another vertices for different normals, etc,
  // we must use different vertices for each faces.
  // A UV sphere can be seperated to 3 parts - Roof, Pillar, Floor.
  // Roof consists of N triangles (N = segments), so it'd be trivial -
  // it needs 3 * N vertices.
  // Pillar, however, uses quads. However, we can share the vertices if
  // it has same normal map, texture coords, etc.
  // Pillar consists of N * (M - 3) quads (M = rings), so it uses
  // 4 * N * (M - 3) vertices.
  // Floor is exactly same as the roof, it needs 3 * N vertices.
  // Adding all, it needs N * (6 + 4 * (M - 3)) vertices total, and
  // N * (2 + 2 * (M - 3)) triangles total.
  let verticesTotal = segments * (6 + 4 * (rings - 3));
  let facesTotal = segments * (2 + 2 * (rings - 3));
  let texCoords = new Float32Array(verticesTotal * 2);
  let vertices = new Float32Array(verticesTotal * 3);
  let indices = new Uint16Array(facesTotal * 3);
  // Roof
  for (let i = 0; i < segments; ++i) {
    let theta = 1 / (rings - 1) * Math.PI;
    let y = Math.cos(theta);
    let radius = Math.sin(theta);
    let angle = i / segments * Math.PI * 2;
    let angleNext = (i + 1) / segments * Math.PI * 2;
    // Roof left
    vertices[i * 9] = Math.cos(angle) * radius;
    vertices[i * 9 + 1] = y;
    vertices[i * 9 + 2] = Math.sin(angle) * radius;
    // Roof top
    vertices[i * 9 + 3] = 0;
    vertices[i * 9 + 4] = 1;
    vertices[i * 9 + 5] = 0;
    // Roof right
    vertices[i * 9 + 6] = Math.cos(angleNext) * radius;
    vertices[i * 9 + 7] = y;
    vertices[i * 9 + 8] = Math.sin(angleNext) * radius;
    // Connect it
    indices[i * 3] = i * 3;
    indices[i * 3 + 1] = i * 3 + 1;
    indices[i * 3 + 2] = i * 3 + 2;
    // Texture coords
    texCoords[i * 6] = 1 - i / segments;
    texCoords[i * 6 + 1] = 1 - 1 / (rings - 1);
    texCoords[i * 6 + 2] = 1 - (i + 0.5) / segments;
    texCoords[i * 6 + 3] = 1;
    texCoords[i * 6 + 4] = 1 - (i + 1) / segments;
    texCoords[i * 6 + 5] = 1 - 1 / (rings - 1);
  }
  // Pillar
  for (let j = 0; j < rings - 3; ++j) {
    let theta = (j + 1) / (rings - 1) * Math.PI;
    let y = Math.cos(theta);
    let radius = Math.sin(theta);
    let thetaNext = (j + 2) / (rings - 1) * Math.PI;
    let yNext = Math.cos(thetaNext);
    let radiusNext = Math.sin(thetaNext);
    for (let i = 0; i < segments; ++i) {
      let startPos = segments * (3 + 4 * j) + i * 4;
      let startIndices = segments * (3 + 6 * j) + i * 6;
      let angle = i / segments * Math.PI * 2;
      let angleNext = (i + 1) / segments * Math.PI * 2;
      // Roof left top
      vertices[startPos * 3] = Math.cos(angle) * radius;
      vertices[startPos * 3 + 1] = y;
      vertices[startPos * 3 + 2] = Math.sin(angle) * radius;
      // Roof right top
      vertices[startPos * 3 + 3] = Math.cos(angleNext) * radius;
      vertices[startPos * 3 + 4] = y;
      vertices[startPos * 3 + 5] = Math.sin(angleNext) * radius;
      // Roof right bottom
      vertices[startPos * 3 + 6] = Math.cos(angleNext) * radiusNext;
      vertices[startPos * 3 + 7] = yNext;
      vertices[startPos * 3 + 8] = Math.sin(angleNext) * radiusNext;
      // Roof left bottom
      vertices[startPos * 3 + 9] = Math.cos(angle) * radiusNext;
      vertices[startPos * 3 + 10] = yNext;
      vertices[startPos * 3 + 11] = Math.sin(angle) * radiusNext;
      // Connect it, kinda gross though
      indices[startIndices] = startPos + 2;
      indices[startIndices + 1] = startPos;
      indices[startIndices + 2] = startPos + 1;
      indices[startIndices + 3] = startPos + 3;
      indices[startIndices + 4] = startPos;
      indices[startIndices + 5] = startPos + 2;
      // Texture coords mapping
      texCoords[startPos * 2] = 1 - i / segments;
      texCoords[startPos * 2 + 1] = 1 - (j + 1) / (rings - 1);
      texCoords[startPos * 2 + 2] = 1 - (i + 1) / segments;
      texCoords[startPos * 2 + 3] = 1 - (j + 1) / (rings - 1);
      texCoords[startPos * 2 + 4] = 1 - (i + 1) / segments;
      texCoords[startPos * 2 + 5] = 1 - (j + 2) / (rings - 1);
      texCoords[startPos * 2 + 6] = 1 - i / segments;
      texCoords[startPos * 2 + 7] = 1 - (j + 2) / (rings - 1);
    }
  }
  // Floor
  for (let i = 0; i < segments; ++i) {
    let startPos = segments * (3 + 4 * (rings - 3)) + i * 3;
    let startIndices = segments * (3 + 6 * (rings - 3)) + i * 3;
    let theta = (rings - 2) / (rings - 1) * Math.PI;
    let y = Math.cos(theta);
    let radius = Math.sin(theta);
    let angle = i / segments * Math.PI * 2;
    let angleNext = (i + 1) / segments * Math.PI * 2;
    // Floor left
    vertices[startPos * 3] = Math.cos(angle) * radius;
    vertices[startPos * 3 + 1] = y;
    vertices[startPos * 3 + 2] = Math.sin(angle) * radius;
    // Floor top
    vertices[startPos * 3 + 3] = 0;
    vertices[startPos * 3 + 4] = -1;
    vertices[startPos * 3 + 5] = 0;
    // Floor right
    vertices[startPos * 3 + 6] = Math.cos(angleNext) * radius;
    vertices[startPos * 3 + 7] = y;
    vertices[startPos * 3 + 8] = Math.sin(angleNext) * radius;
    // Connect it
    indices[startIndices] = startPos + 1;
    indices[startIndices + 1] = startPos;
    indices[startIndices + 2] = startPos + 2;
    // Texture coords
    texCoords[startPos * 2] = 1 - i / segments;
    texCoords[startPos * 2 + 1] = 1 - (rings - 2) / (rings - 1);
    texCoords[startPos * 2 + 2] = 1 - (i + 0.5) / segments;
    texCoords[startPos * 2 + 3] = 0;
    texCoords[startPos * 2 + 4] = 1 - (i + 1) / segments;
    texCoords[startPos * 2 + 5] = 1 - (rings - 2) / (rings - 1);
  }
  return {
    attributes: {
      aPosition: {axis: 3, data: vertices},
      aTexCoord: {axis: 2, data: texCoords},
      // Instead of calculating normals by calculating indices, we can
      // just put vertices data to the normals to calculate smooth
      // normals. (This only applies to sphere though)
      aNormal: {axis: 3, data: vertices}
    },
    indices
  };
}
