import Geometry from './geometry';

export default class Geometry2D extends Geometry {
  constructor(name) {
    super(name);
    this.vertices = null;
  }
  getVertexCount() {
    return this.vertices.length / 2 | 0;
  }
  upload(gl) {
    if (this.vertices === null) throw new Error('Vertices array is null');
    // Easy! We don't have to use bufferSubData since there is always one
    // attribute in Geometry2D.
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
  }
  use(gl, attributes) {
    if (attributes.aPosition !== -1) {
      // :/
      gl.enableVertexAttribArray(attributes.aPosition);
      gl.vertexAttribPointer(attributes.aPosition, 2, gl.FLOAT, false, 8, 0);
    }
  }
}
