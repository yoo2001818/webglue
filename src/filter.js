import quadGeom from './geom/quad';

const VERTEX_SHADER = `
#version 100
attribute vec2 aPosition;
varying lowp vec2 vTexCoord;

void main() {
  gl_Position = vec4(aPosition, -1.0, 1.0);
  vTexCoord = vec2((aPosition + 1.0) / 2.0);
}
`;

export default class Filter {
  constructor(renderer, fragment, defaultOpts) {
    this.renderer = renderer;
    this.defaultOpts = defaultOpts;
    this.shader = renderer.shaders.create(VERTEX_SHADER, fragment);
    if (renderer._filterData == null) {
      renderer._filterData = {
        quad: renderer.geometries.create(quadGeom()),
        framebuffer: renderer.framebuffers.create({})
      };
    }
  }
  get(input, output, options) {
    let filterData = this.renderer._filterData;
    return {
      framebuffer: {
        framebuffer: filterData.framebuffer, color: output
      },
      geometry: filterData.quad,
      shader: this.shader,
      uniforms: Object.assign({
        uTexture: input
      }, this.defaultOpts, options)
    };
  }
}
