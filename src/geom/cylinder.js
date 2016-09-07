export default function cylinder(polygons) {
  // A cylinder needs two bases and sides, and it's possible to make them
  // using base * 2 vertices. However, since OpenGL requires making seperate
  // vertices per different data (like normals), we need:
  // N * 2 vertices for the two bases, N * 4 vertices for sides.
  let texCoords = new Float32Array(6 * polygons * 2);
  let vertices = new Float32Array(6 * polygons * 3);
  let normals = new Float32Array(6 * polygons * 3);
  let indices = new Uint16Array(12 * polygons - 12);
  for (let i = 0; i < polygons; ++i) {
    // Cos / sin is useful for this.. I think?
    let angle = i / polygons * Math.PI * 2;
    let angleNext = (i + 1) / polygons * Math.PI * 2;
    let angleUV = i / polygons;
    let angleNextUV = (i + 1) / polygons;
    // Base
    vertices[i * 3] = Math.cos(angle);
    vertices[i * 3 + 1] = -1;
    vertices[i * 3 + 2] = Math.sin(angle);
    texCoords[i * 2] = Math.cos(angle) * 0.25 + 0.25;
    texCoords[i * 2 + 1] = Math.sin(angle) * 0.25 + 0.25;
    normals[i * 3] = 0;
    normals[i * 3 + 1] = -1;
    normals[i * 3 + 2] = 0;
    // Base (Top)
    vertices[(polygons + i) * 3] = Math.cos(angle);
    vertices[(polygons + i) * 3 + 1] = 1;
    vertices[(polygons + i) * 3 + 2] = Math.sin(angle);
    texCoords[(polygons + i) * 2] = Math.cos(angle) * 0.25 + 0.25;
    texCoords[(polygons + i) * 2 + 1] = Math.sin(angle) * 0.25 + 0.75;
    normals[(polygons + i) * 3] = 0;
    normals[(polygons + i) * 3 + 1] = 1;
    normals[(polygons + i) * 3 + 2] = 0;
    // Side left bottom
    vertices[(polygons * 2 + i) * 3] = Math.cos(angle);
    vertices[(polygons * 2 + i) * 3 + 1] = -1;
    vertices[(polygons * 2 + i) * 3 + 2] = Math.sin(angle);
    texCoords[(polygons * 2 + i) * 2] = 0.5;
    texCoords[(polygons * 2 + i) * 2 + 1] = angleUV;
    normals[(polygons * 2 + i) * 3] = Math.cos(angle);
    normals[(polygons * 2 + i) * 3 + 1] = 0;
    normals[(polygons * 2 + i) * 3 + 2] = Math.sin(angle);
    // Side left top
    vertices[(polygons * 3 + i) * 3] = Math.cos(angle);
    vertices[(polygons * 3 + i) * 3 + 1] = 1;
    vertices[(polygons * 3 + i) * 3 + 2] = Math.sin(angle);
    texCoords[(polygons * 3 + i) * 2] = 1;
    texCoords[(polygons * 3 + i) * 2 + 1] = angleUV;
    normals[(polygons * 3 + i) * 3] = Math.cos(angle);
    normals[(polygons * 3 + i) * 3 + 1] = 0;
    normals[(polygons * 3 + i) * 3 + 2] = Math.sin(angle);
    // Side right bottom
    vertices[(polygons * 4 + i) * 3] = Math.cos(angleNext);
    vertices[(polygons * 4 + i) * 3 + 1] = -1;
    vertices[(polygons * 4 + i) * 3 + 2] = Math.sin(angleNext);
    texCoords[(polygons * 4 + i) * 2] = 0.5;
    texCoords[(polygons * 4 + i) * 2 + 1] = angleNextUV;
    normals[(polygons * 4 + i) * 3] = Math.cos(angleNext);
    normals[(polygons * 4 + i) * 3 + 1] = 0;
    normals[(polygons * 4 + i) * 3 + 2] = Math.sin(angleNext);
    // Side right top
    vertices[(polygons * 5 + i) * 3] = Math.cos(angleNext);
    vertices[(polygons * 5 + i) * 3 + 1] = 1;
    vertices[(polygons * 5 + i) * 3 + 2] = Math.sin(angleNext);
    texCoords[(polygons * 5 + i) * 2] = 1;
    texCoords[(polygons * 5 + i) * 2 + 1] = angleNextUV;
    normals[(polygons * 5 + i) * 3] = Math.cos(angleNext);
    normals[(polygons * 5 + i) * 3 + 1] = 0;
    normals[(polygons * 5 + i) * 3 + 2] = Math.sin(angleNext);
  }
  for (let i = 0; i < polygons - 2; ++i) {
    // Create base
    indices[i * 3] = 0;
    indices[i * 3 + 1] = i + 1;
    indices[i * 3 + 2] = i + 2;
    indices[(polygons - 2 + i) * 3] = polygons;
    indices[(polygons - 2 + i) * 3 + 1] = polygons + i + 2;
    indices[(polygons - 2 + i) * 3 + 2] = polygons + i + 1;
  }
  for (let i = 0; i < polygons; ++i) {
    // Create side
    indices[((polygons - 2) * 2 + i * 2) * 3] = polygons * 2 + i;
    indices[((polygons - 2) * 2 + i * 2) * 3 + 1] = polygons * 3 + i;
    indices[((polygons - 2) * 2 + i * 2) * 3 + 2] = polygons * 5 + i;
    indices[((polygons - 2) * 2 + i * 2) * 3 + 3] = polygons * 2 + i;
    indices[((polygons - 2) * 2 + i * 2) * 3 + 4] = polygons * 5 + i;
    indices[((polygons - 2) * 2 + i * 2) * 3 + 5] = polygons * 4 + i;
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
  /*
  if (hardNormals) this.calculateNormals();
  this.calculateTangents();
  */
}
