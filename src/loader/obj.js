import calcTangents from '../geom/channel/calcTangents';
import calcNormals from '../geom/channel/calcNormals';
import calcSmoothNormals from '../geom/channel/calcSmoothNormals';
import parseIndices from '../util/parseIndices';

// Loads OBJ file to Geometry object. Currently does not support materials
// and etc.
export default function loadOBJ(data, separate = false, noObject = false) {
  // Parser machine state
  let objName = 'OBJ_' + (Math.random() * 1000 | 0);
  let objMaterial = null;
  let vertices = [];
  let normals = [];
  let texCoords = [];
  let vertexIndices = [];
  let normalIndices = [];
  let texCoordIndices = [];
  let normalSpecified = false;
  let normalSmooth = false;

  let attributes;
  let polyList = [];
  let geometries = noObject ? [] : {};

  function addFaceIndex(point) {
    vertexIndices.push(point.vertex);
    texCoordIndices.push(point.texCoord);
    normalIndices.push(point.normal);
  }

  function finalizePolyList() {
    if (vertexIndices.length === 0) return;
    let geometry = {
      metadata: {
        material: objMaterial,
        normalSpecified,
        normalSmooth,
      },
      indices: {
        aPosition: parseIndices(vertexIndices),
        aNormal: parseIndices(normalIndices),
        aTexCoord: parseIndices(texCoordIndices)
      }
    };
    polyList.push(geometry);
    // Empty current indices buffer.
    vertexIndices = [];
    normalIndices = [];
    texCoordIndices = [];
  }

  function finalizeGeometry() {
    finalizePolyList();
    // Add geometry to output geometries list.
    if (separate) {
      if (noObject) {
        geometries = geometries.concat(polyList);
      } else {
        geometries[objName] = polyList.length === 1 ? polyList[0] : polyList;
      }
    } else {
      geometries = polyList[0];
    }
    polyList = [];
    normalSpecified = false;
    normalSmooth = false;
  }

  function calculateGeometry(geometry) {
    geometry.attributes = attributes;
    if (!geometry.metadata.normalSpecified) {
      if (geometry.metadata.normalSmooth) {
        geometry = calcSmoothNormals(geometry);
      } else {
        geometry = calcNormals(geometry);
      }
    }
    geometry = calcTangents(geometry);
    return geometry;
  }

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
      let points = args.map(arg => {
        let [vertex, texCoord, normal] = arg.split('/');
        return {
          vertex: vertex - 1,
          texCoord: texCoord == null ? 0 : texCoord - 1,
          normal: normal == null ? 0 : normal - 1
        };
      });
      for (let i = 1; i < points.length - 1; ++i) {
        addFaceIndex(points[0]);
        addFaceIndex(points[i]);
        addFaceIndex(points[i + 1]);
      }
      break;
    }
    case 'o': {
      // Finalize current buffer if separation is enabled and buffer is not
      // empty.
      if (separate && vertexIndices.length > 0) {
        finalizeGeometry();
      }
      // User defined object name
      objName = args.join(' ');
      break;
    }
    case 'usemtl': {
      if (separate && vertexIndices.length > 0) {
        finalizePolyList();
      }
      // Material name.
      objMaterial = args.join(' ');
      break;
    }
    case 'g': {
      // Group name, however webglue doesn't support it.
      break;
    }
    case 's': {
      if (args[0] === 'off' || args[0] === '0') {
        normalSmooth = false;
      } else {
        normalSmooth = true;
      }
      break;
    }
    }
  }
  // End of file - Build geometry object.
  if (vertexIndices.length > 0) finalizeGeometry();
  // Then, process all geometries - Calculate normals and tangents.
  attributes = {
    aPosition: { data: new Float32Array(vertices), axis: 3 },
    aNormal: { data: new Float32Array(normals), axis: 3 },
    aTexCoord: { data: new Float32Array(texCoords), axis: 2 }
  };

  if (separate) {
    if (noObject) {
      geometries = geometries.map(v => calculateGeometry(v));
    } else {
      for (let key in geometries) {
        if (Array.isArray(geometries[key])) {
          geometries[key] = geometries[key].map(v => calculateGeometry(v));
        } else {
          geometries[key] = calculateGeometry(geometries[key]);
        }
      }
    }
  } else {
    geometries = calculateGeometry(geometries);
  }

  // All done! return the geometry object.
  return geometries;
}
