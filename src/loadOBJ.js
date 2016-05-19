import ChannelGeometry3D from './channelGeometry3D';

// Loads OBJ file to Geometry object. Currently does not support materials
// and etc.
export default function loadOBJ(data) {
  // Parser machine state
  let objName = 'OBJ_' + (Math.random() * 1000 | 0);
  let vertices = [];
  let normals = [];
  let texCoords = [];
  let vertexIndices = [];
  let normalIndices = [];
  let texCoordIndices = [];
  let normalSpecified = false;
  // Parser logic starts here.
  let lines = data.split('\n');
  for (let i = 0; i < lines.length; ++i) {
    let line = lines[i].trim();
    // If the line starts with #, this line is a comment - skip the line.
    if (line[0] === '#') continue;
    // Parse the command and the rest.
    let [command, ...args] = line.split(' ');
    switch (command) {
    // call and csh are not implemented because of security problems
    // (it's not possible to implement it in JS anyway)
    case 'v': {
      // Vertex coordinates.
      // weight is not required, so it won't be implemented.
      let [x, y, z] = args.map(parseFloat);
      vertices.push(x, y, z);
      break;
    }
    case 'vn': {
      // Normal vector.
      let [i, j, k] = args.map(parseFloat);
      normals.push(i, j, k);
      normalSpecified = true;
      break;
    }
    case 'vt': {
      // Texture coordinates.
      // W is not required since WebGL only supports 2D textures.
      let [u, v] = args.map(parseFloat);
      if (v == null) v = 0.0;
      texCoords.push(u, v);
      break;
    }
    case 'p': {
      // Specifies a point element, however, it is not supported.
      break;
    }
    case 'l': {
      // Specifies a line element. not supported.
      break;
    }
    case 'f': {
      // Face element. Since arbitary amount of polygons is possible,
      // We have to triangulate the polygon if more than 3 vertices are given.
      // TODO Triangulate polygons
      let points = args.map(arg => {
        let [vertex, texCoord, normal] = arg.split('/');
        return {
          vertex: vertex || 0, texCoord: texCoord || 0, normal: normal || 0
        };
      });
      // Assume only 3 vertices have been received.
      if (points.length !== 3) break;
      points.forEach(point => {
        vertexIndices.push(point.vertex);
        texCoordIndices.push(point.texCoord);
        normalIndices.push(point.normal);
      });
      break;
    }
    case 'o': {
      // User defined object name
      objName = args.join(' ');
      break;
    }
    case 'g': {
      // Group name, however webglue doesn't support it.
      break;
    }
    }
  }
  // End of file - Build geometry object.
  let geometry = new ChannelGeometry3D(Symbol(objName));

  geometry.vertices = new Float32Array(vertices);
  geometry.normals = new Float32Array(normals);
  geometry.texCoords = new Float32Array(texCoords);

  geometry.vertexIndices = new Uint16Array(vertexIndices);
  geometry.normalIndices = new Uint16Array(normalIndices);
  geometry.texCoordIndices = new Uint16Array(texCoordIndices);
  // Calculate normal vectors, if not specified.
  if (!normalSpecified) {
    geometry.calculateNormals();
  }
  // Calculate tangent vectors.
  geometry.calculateTangents();
  // All done! return the geometry object.
  return geometry;
}
