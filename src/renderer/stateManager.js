const BIT_POS = {
  blend: 1,
  cull: 2,
  depth: 4,
  dither: 8,
  polygonOffset: 16,
  scissor: 32,
  stencil: 64,
  colorMask: 128
};

export default class StateManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.state = 0;
    /*this.state = {
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
    };*/
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
  setEnabled(key, pos, value) {
    const gl = this.renderer.gl;
    if (value == null) return;
    // If value is not 'false', it's enabled.
    let enabled = value !== false;
    if ((this.state & pos !== 0) === enabled) return;
    // Set the bit according to the bit set.
    if (enabled) {
      this.state |= pos;
      gl.enable(key);
    } else {
      this.state &= ~pos;
      gl.disable(key);
    }
  }
  setBlend(options) {
    const gl = this.renderer.gl;
    this.setEnabled(gl.BLEND, BIT_POS.blend, options);
    if (!options) return;
    // Will it be safe?
    if (options.color) gl.blendColor.apply(gl, options.color);
    if (options.equation != null) {
      if (typeof options.equation === 'number') {
        gl.blendEquation(options.equation);
      } else {
        gl.blendEquationSeparate(options.equation.rgb, options.equation.alpha);
      }
    }
    if (options.func) {
      if (Array.isArray(options.func)) {
        gl.blendFunc(options.func[0], options.func[1]);
      } else {
        gl.blendFuncSeparate(options.func.rgb[0], options.func.rgb[1],
          options.func.alpha[0], options.func.alpha[1]);
      }
    }
  }
  setColorMask(options) {
    const gl = this.renderer.gl;
    if (options == null) return;
    if (options === false) {
      if ((this.state & BIT_POS.colorMask) !== 0) {
        gl.colorMask(true, true, true, true);
        this.state &= ~BIT_POS.colorMask;
      }
    } else if (options) {
      gl.colorMask(options[0], options[1], options[2], options[3]);
      this.state |= BIT_POS.colorMask;
    }
  }
  setCull(options) {
    const gl = this.renderer.gl;
    this.setEnabled(gl.CULL_FACE, BIT_POS.cull, options);
    if (!options) return;
    if (typeof options === 'number') {
      // Assume CCW - it's basically a standard.
      gl.frontFace(gl.CCW);
      gl.cullFace(options);
    } else {
      gl.frontFace(options.front);
      gl.cullFace(options.face);
    }
  }
  setDepth(options) {
    const gl = this.renderer.gl;
    this.setEnabled(gl.DEPTH_TEST, BIT_POS.depth, options);
    if (!options) return;
    if (options.func != null) gl.depthFunc(options.func);
    if (options.mask != null) gl.depthMask(options.mask);
    if (options.range) gl.depthRange(options.range[0], options.range[1]);
  }
  clear(options) {
    const gl = this.renderer.gl;
    let flag = 0;
    if (options.clearColor) {
      let arr = options.clearColor;
      // Whyyyyyyy
      gl.clearColor(arr[0], arr[1], arr[2], arr[3]);
      flag |= gl.COLOR_BUFFER_BIT;
    }
    if (options.clearDepth) {
      gl.clearDepth(options.clearDepth);
      flag |= gl.DEPTH_BUFFER_BIT;
    }
    if (options.clearStencil) {
      gl.clearStencil(options.clearStencil);
      flag |= gl.STENCIL_BUFFER_BIT;
    }
    if (flag !== 0) gl.clear(flag);
  }
  set(options) {
    const gl = this.renderer.gl;
    this.setBlend(options.blend);
    this.setColorMask(options.colorMask);
    this.clear(options);
    this.setCull(options.cull);
    this.setDepth(options.depth);
    this.setEnabled(gl.DITHER, BIT_POS.dither, options.dither);
    // TODO Polygon offset fill
    // TODO Scissor test
    // TODO Stencil test
  }
}
