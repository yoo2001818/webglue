export default class StateManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.state = {
      blend: {
        enabled: false,
        color: new Float32Array([1, 1, 1, 1]),
        equation: {
          rgb: renderer.gl.FUNC_ADD,
          alpha: renderer.gl.FUNC_ADD
        },
        func: {
          rgb: [renderer.gl.ONE, renderer.gl.ZERO],
          alpha: [renderer.gl.ONE, renderer.gl.ZERO]
        }
      },
      clearColor: new Float32Array([0, 0, 0, 0]),
      clearDepth: 1,
      clearStencil: 0,
      colorMask: [true, true, true, true],
      // TODO merge into one?
      cull: {
        enabled: false,
        face: renderer.gl.FRONT,
        front: renderer.gl.CW
      },
      depth: {
        enabled: false,
        func: renderer.gl.LESS,
        mask: true,
        range: new Float32Array(0, 1)
      },
      dither: false,
      polygonOffset: {
        enabled: false,
        factor: 0,
        units: 0
      },
      scissor: false,
      stencil: {
        enabled: false,
        front: {
          func: {
            func: renderer.gl.ALWAYS,
            ref: 0,
            mask: ~0
          },
          mask: ~0,
          op: {
            fail: renderer.gl.KEEP,
            zfail: renderer.gl.KEEP,
            zpass: renderer.gl.KEEP
          }
        },
        back: {
          func: {
            func: renderer.gl.ALWAYS,
            ref: 0,
            mask: ~0
          },
          mask: ~0,
          op: {
            fail: renderer.gl.KEEP,
            zfail: renderer.gl.KEEP,
            zpass: renderer.gl.KEEP
          }
        }
      }
    };
  }
  reset(options) {
    // Resets the state (Basically, disables everything unless specified.)
    this.set(Object.assign({
      blend: false,
      cull: false,
      depth: false,
      dither: false,
      polygonOffset: false,
      scissor: false,
      stencil: false
    }, options));
  }
  set(options) {

  }
}
