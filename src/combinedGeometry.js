import Geometry3D from './geometry3D';

import { vec3 } from 'gl-matrix';

function joinArray(orig, dest) {
  for (let i = 0; i < dest.length; ++i) {
    orig.push(dest[i]);
  }
}
export default class CombinedGeometry extends Geometry3D {
  constructor(name) {
    super(name);
    this.vertices = [];
    this.normals = [];
    this.texCoords = [];
    this.tangents = [];
    this.indices = [];
    this.type = [];
  }
  combine(geometry, matrix) {
    // TODO Currently it's impossible to combine two combinedGeometry together
    // ...But why would anyone do that?
    this.type.push({
      first: this.indices.length,
      count: geometry.indices.length,
      type: geometry.type
    });

    let verticesCount = this.vertices.length / 3 | 0;
    // Push indices... obviously.
    for (let i = 0; i < geometry.indices.length; ++i) {
      this.indices.push(geometry.indices[i] + verticesCount);
    }
    // Apply matrix operations to the geometry
    for (let i = 0; i < geometry.getVertexCount(); ++i) {
      let vertex = vec3.create();
      vec3.transformMat4(vertex, geometry.vertices.slice(i*3, i*3 + 3), matrix);
      this.vertices.push(vertex[0], vertex[1], vertex[2]);
    }
    console.log(this.indices);
    console.log(this.indices.length, geometry.indices.length);
    console.log(this.vertices);
    console.log(this.vertices.length / 3);
    joinArray(this.normals, geometry.normals);
    joinArray(this.texCoords, geometry.texCoords);
    joinArray(this.tangents, geometry.tangents);
  }
  apply() {
    // Convert the array to typed array.
    this.vertices = new Float32Array(this.vertices);
    this.normals = new Float32Array(this.normals);
    this.texCoords = new Float32Array(this.texCoords);
    this.tangents = new Float32Array(this.tangents);
    this.indices = new Uint16Array(this.indices);
  }
}
