import Geometry from './geometry';

export default class CombinedGeometry extends Geometry {
  constructor(renderer, geometries) {
    super(renderer, {});
    this.geometries = geometries;

    this.standard = false;
    this.uploaded = false;
    this.ebo = null;
    this.eboType = null;
    this.mode = null;
    this.instancedPos = null;

    this.vertexCount = -1;
    this.primCount = -1;
    this.vao = null;
  }
  upload() {
    // TODO Check geometry update
    this.uploaded = true;
    // Upload each geometry
    this.geometries.forEach(v => v.upload());
    // Check vertex count and prim count (This must match)
    this.vertexCount = this.geometries.reduce((count, geometry) => {
      if (geometry.vertexCount === -1) return count;
      if (count === -1) return geometry.vertexCount;
      if (count !== geometry.vertexCount) {
        throw new Error('Vertex count does not match between geometries');
      }
      return count;
    }, -1);
    this.primCount = this.geometries.reduce((count, geometry) => {
      if (geometry.primCount === -1) return count;
      if (count === -1) return geometry.primCount;
      if (count !== geometry.primCount) {
        throw new Error('Primitive count does not match between geometries');
      }
      return count;
    }, -1);
    // Who shall supply the ebo? the rightmost object will.
    this.indices = this.geometries.reduce((p, g) => g.indices || p, null);
    this.usage = this.geometries.reduce((p, g) => g.usage || p, null);
    this.indicesUsage = this.geometries.reduce((p, g) => g.indicesUsage
      || p, null);
    this.ebo = this.geometries.reduce((p, g) => g.ebo || p, null);
    this.eboType = this.geometries.reduce((p, g) => g.eboType || p, null);
    this.mode = this.geometries.reduce((p, g) => g.mode || p, null);
    this.instancedPos = this.geometries.reduce((p, g) =>
      p.concat(g.instancedPos), []);
    // Is this standard object?
    this.standard = this.geometries.every(geometry => geometry.standard);
    if (this.standard) {
      this.vao = null;
    } else {
      this.vao = new WeakMap();
    }
  }
  use() {
    if (!this.uploaded) this.upload();
    if (this.standard && this.renderer.geometries.current === this) {
      // This doesn't have to be 'used' again in this case
      return;
    }
    this.useVAO();
    // 'Use' each geometry objects
    this.geometries.forEach(v => v.use(false));
  }
}
