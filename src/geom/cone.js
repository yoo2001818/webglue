export default function cone(polygons) {
  // A cone needs a base and sides, and it's possible to make them
  // using base + 1 vertices. However, since OpenGL requires making seperate
  // vertices per different data (like normals), we need:
  // N vertices for the base, N * 3 vertices for sides.
  // That's 4 * N vertices.... I wonder if there is a way to use only N
  // vertices?
  let texCoords = new Float32Array(4 * polygons * 2);
  let vertices = new Float32Array(4 * polygons * 3);
  let normals = new Float32Array(4 * polygons * 3);
  let indices = new Uint16Array((polygons * 2 - 2) * 3);
  for (let i = 0; i < polygons; ++i) {
    // Cos / sin is useful for this.. I think?
    let angle = i / polygons * Math.PI * 2;
    let angleNext = (i + 1) / polygons * Math.PI * 2;
    let angleUV = i / polygons * Math.PI * 4 / 3 + Math.PI / 2;
    let angleNextUV = (i + 1) / polygons * Math.PI * 4 / 3 + Math.PI / 2;
    // Base
    vertices[i * 3] = Math.cos(angle);
    vertices[i * 3 + 1] = -1;
    vertices[i * 3 + 2] = Math.sin(angle);
    texCoords[i * 2] = Math.cos(angle) * 0.25 + 0.25;
    texCoords[i * 2 + 1] = Math.sin(angle) * 0.25 + 0.25;
    normals[i * 3] = 0;
    normals[i * 3 + 1] = -1;
    normals[i * 3 + 2] = 0;
    // Side left (from front)
    vertices[(polygons * 1 + i) * 3] = Math.cos(angle);
    vertices[(polygons * 1 + i) * 3 + 1] = -1;
    vertices[(polygons * 1 + i) * 3 + 2] = Math.sin(angle);
    texCoords[(polygons * 1 + i) * 2] = Math.cos(angleUV) * 0.5 + 0.5;
    texCoords[(polygons * 1 + i) * 2 + 1] = Math.sin(angleUV) * 0.5 + 0.5;
    let normalDist = Math.sqrt(5/4);
    normals[(polygons * 1 + i) * 3] = Math.cos(angle) * normalDist;
    normals[(polygons * 1 + i) * 3 + 1] = 1/2 * normalDist;
    normals[(polygons * 1 + i) * 3 + 2] = Math.sin(angle) * normalDist;
    // Side right (from front)
    vertices[(polygons * 2 + i) * 3] = Math.cos(angleNext);
    vertices[(polygons * 2 + i) * 3 + 1] = -1;
    vertices[(polygons * 2 + i) * 3 + 2] = Math.sin(angleNext);
    texCoords[(polygons * 2 + i) * 2] = Math.cos(angleNextUV) * 0.5 + 0.5;
    texCoords[(polygons * 2 + i) * 2 + 1] = Math.sin(angleNextUV) * 0.5 + 0.5;
    normals[(polygons * 2 + i) * 3] = Math.cos(angleNext) * normalDist;
    normals[(polygons * 2 + i) * 3 + 1] = 1/2 * normalDist;
    normals[(polygons * 2 + i) * 3 + 2] = Math.sin(angleNext) * normalDist;
    // Side top
    vertices[(polygons * 3 + i) * 3] = 0;
    vertices[(polygons * 3 + i) * 3 + 1] = 1;
    vertices[(polygons * 3 + i) * 3 + 2] = 0;
    // Always center
    texCoords[(polygons * 3 + i) * 2] = 0.5;
    texCoords[(polygons * 3 + i) * 2 + 1] = 0.5;
    normals[(polygons * 3 + i) * 3] = 0;
    normals[(polygons * 3 + i) * 3 + 1] = 1;
    normals[(polygons * 3 + i) * 3 + 2] = 0;
  }
  for (let i = 0; i < polygons - 2; ++i) {
    // Create base
    indices[i * 3] = 0;
    indices[i * 3 + 1] = i + 1;
    indices[i * 3 + 2] = i + 2;
  }
  for (let i = 0; i < polygons; ++i) {
    // Create side
    indices[(polygons - 2 + i) * 3 + 1] = polygons + i;
    indices[(polygons - 2 + i) * 3] = polygons * 2 + i;
    indices[(polygons - 2 + i) * 3 + 2] = polygons * 3 + i;
  }
  return {
    attributes: {
      aPosition: {axis: 3, data: vertices},
      aTexCoord: {axis: 2, data: texCoords},
      aNormal: {axis: 3, data: normals}
    },
    indices
  };
  /*
  if (hardNormals) this.calculateNormals();
  this.calculateTangents();
  */
}
