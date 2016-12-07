import PreprocessShader from './preprocessShader';
import Shader from './shader';
import traverseNode from '../util/traverseNode';
import checkFrustum from '../util/checkFrustum';
export default class ShaderManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.shaders = [];
    this.current = null;
    this.handler = null;
    // Preprocess shader's governor list
    this.governors = {
      max: {
        checker: (shader, current) => shader >= current,
        allocator: current => current
      },
      equal: {
        checker: (shader, current) => shader === current,
        allocator: current => current
      },
      maxLength: {
        checker: (shader, current) =>
          shader >= (current == null ? 0 : current.length),
        allocator: current => current == null ? 0 : current.length
      }
    };
    this.checkFrustum = checkFrustum;
  }
  create(vert, frag, noPreprocess = false) {
    let shader;
    if (noPreprocess) {
      shader = new Shader(this.renderer, vert, frag);
    } else {
      shader = new PreprocessShader(this.renderer, vert, frag);
    }
    this.shaders.push(shader);
    return shader;
  }
  useNode(node) {
    let shader = node.shader;
    if (shader == null || shader === false) return false;
    // First, we pre-calculate uniforms before doing anything else.
    // However, this is only for 'pre-process' shader, so we skip if
    // invaliators are not defined.
    if (shader.invalidators && (shader.useCounts || shader.useFeatures)) {
      traverseNode(shader.currentNode, node, v => {
        shader.ascendNode(v);
      }, v => {
        shader.descendNode(v);
      }, () => {
        shader.currentUniforms = {};
      });
      shader.currentNode = node;
      shader = shader.getShader();
    }
    if (this.handler != null) {
      shader = this.handler(shader, node, this.renderer);
    }
    if (shader == null || shader === false) return false;
    shader = shader.use(undefined, this.current);
    this.current = shader;
    // Traverse to the uniforms
    traverseNode(shader.currentNode, node, () => {}, v => {
      if (v.data.uniforms != null) shader.setUniforms(v.data.uniforms);
    });
    shader.currentNode = node;
  }
  use(shader, uniforms) {
    let returned = shader.getShader(uniforms, this.current);
    if (this.handler != null) {
      returned = this.handler(returned, uniforms, this.renderer);
    }
    this.current = returned.use(uniforms, this.current);
  }
  reset() {
    this.current = null;
    this.shaders.forEach(shader => shader.dispose());
  }
}
