import parseUniform from '../util/parseUniform';
import traverseNode from '../util/traverseNode';

const BIT_POS = {
  blend: 1,
  cull: 2,
  depth: 4,
  dither: 8,
  polygonOffset: 16,
  scissor: 32,
  stencil: 64,
  colorMask: 128,
  depthMask: 256
};

export default class StateManager {
  constructor(renderer) {
    this.doReset = false;
    this.renderer = renderer;
    this.state = 0;
    this.currentNode = null;
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
    this.set(options || {}, true);
  }
  setEnabled(key, pos, value) {
    const gl = this.renderer.gl;
    if (value == null && !this.doReset) return;
    // If value is not 'false', it's enabled.
    let enabled = value !== false && value != null;
    if (((this.state & pos) !== 0) === enabled) return;
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
    if (options.color) {
      let arr = options.color;
      gl.blendColor(arr[0], arr[1], arr[2], arr[3]);
    }
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
    if (options == null && !this.doReset) return;
    if (!options) {
      if ((this.state & BIT_POS.colorMask) !== 0) {
        gl.colorMask(true, true, true, true);
        this.state &= ~BIT_POS.colorMask;
      }
    } else {
      gl.colorMask(!options[0], !options[1], !options[2], !options[3]);
      this.state |= BIT_POS.colorMask;
    }
  }
  setDepthMask(value) {
    const gl = this.renderer.gl;
    if (value == null && !this.doReset) return;
    // If value is not 'false', it's enabled.
    let enabled = value !== false && value != null;
    if (((this.state & BIT_POS.depthMask) !== 0) === enabled) return;
    // Set the bit according to the bit set.
    if (enabled) {
      this.state |= BIT_POS.depthMask;
      gl.depthMask(false);
    } else {
      this.state &= ~BIT_POS.depthMask;
      gl.depthMask(true);
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
    if (typeof options === 'number') return gl.depthFunc(options);
    if (options.func != null) gl.depthFunc(options.func);
    if (options.mask != null) gl.depthMask(options.mask);
    if (options.range) gl.depthRange(options.range[0], options.range[1]);
  }
  setStencil(options) {
    const gl = this.renderer.gl;
    this.setEnabled(gl.STENCIL_TEST, BIT_POS.stencil, options);
    if (!options) return;
    if (options.mask != null) {
      if (typeof options.mask === 'number') {
        gl.stencilMask(options.mask);
      } else {
        gl.stencilMaskSeparate(gl.FRONT, options.mask[0]);
        gl.stencilMaskSeparate(gl.BACK, options.mask[1]);
      }
    }
    if (options.func != null) {
      if (!Array.isArray(options.func[0])) {
        gl.stencilFunc(options.func[0], options.func[1], options.func[2]);
      } else {
        gl.stencilFuncSeparate(gl.FRONT, options.func[0][0],
          options.func[0][1], options.func[0][2]);
        gl.stencilFuncSeparate(gl.BACK, options.func[1][0],
          options.func[1][1], options.func[1][2]);
      }
    }
    if (options.op != null) {
      if (!Array.isArray(options.op[0])) {
        gl.stencilOp(options.op[0], options.op[1], options.op[2]);
      } else {
        gl.stencilOpSeparate(gl.FRONT, options.op[0][0],
          options.op[0][1], options.op[0][2]);
        gl.stencilOpSeparate(gl.BACK, options.op[1][0],
          options.op[1][1], options.op[1][2]);
      }
    }
  }
  setViewport(value) {
    if (value == null && !this.doReset) return;
    // If value is not 'false', it's enabled.
    let enabled = value !== false && value != null;
    if (enabled) {
      const gl = this.renderer.gl;
      gl.viewport(value[0], value[1], value[2], value[3]);
      this.renderer.width = value[2];
      this.renderer.height = value[3];
    } else {
      // Revert to original viewport
      this.renderer.setViewport();
    }
  }
  setScissor(options) {
    const gl = this.renderer.gl;
    this.setEnabled(gl.SCISSOR_TEST, BIT_POS.scissor, options);
    if (!options) return;
    gl.scissor(options[0], options[1], options[2], options[3]);
  }
  setPolygonOffset(options) {
    const gl = this.renderer.gl;
    this.setEnabled(gl.POLYGON_OFFSET_FILL, BIT_POS.polygonOffset, options);
    if (!options) return;
    gl.polygonOffset(options[0], options[1]);
  }
  clear(options) {
    const gl = this.renderer.gl;
    let flag = 0;
    if (options.clearColor) {
      let arr = parseUniform(gl, options.clearColor, gl.FLOAT_VEC4);
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
  setNode(node) {
    let dirty = false;
    let options = {};
    traverseNode(this.currentNode, node, v => {
      dirty = true;
      for (let key in v.data.options) {
        let parent = v.parent;
        if (parent != null) {
          let value = parent.getOption(key);
          options[key] = value != null ? value : false;
        }
      }
    }, v => {
      dirty = true;
      for (let key in v.data.options) {
        options[key] = v.data.options[key];
      }
    });
    if (dirty) this.set(options, this.currentNode == null);
    this.currentNode = node;
  }
  set(options, reset = false) {
    this.doReset = reset;
    const gl = this.renderer.gl;
    this.setBlend(options.blend);
    this.setColorMask(options.colorMask);
    this.setDepthMask(options.depthMask);
    // this.clear(options);
    this.setCull(options.cull);
    this.setDepth(options.depth);
    this.setEnabled(gl.DITHER, BIT_POS.dither, options.dither);
    this.setStencil(options.stencil);
    this.setViewport(options.viewport);
    this.setScissor(options.scissor);
    this.setPolygonOffset(options.polygonOffset);
  }
}
