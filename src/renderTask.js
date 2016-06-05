// Represents each render task - rendering the scene to framebuffer or
// renderbuffer or screen.
export default class RenderTask {
  constructor(scene, mode = 'default', target, defaultMaterial, options) {
    // The render scene - Specifies the scene to be rendered.
    this.scene = scene;
    // The camera to be used. If null, scene's camera will be used instead.
    this.camera = null;
    // The render options - option values used in rendering.
    this.options = options;
    // The render mode - Materials return the shader and uniform variables
    // according to this mode. As a result, rendered scene will change along
    // the mode.
    this.mode = mode;
    // If material returns null, the default material will be used.
    // Default material shouldn't return null though.
    // If default material returns null, it won't be rendered.
    this.defaultMaterial = defaultMaterial;
    // The target framebuffer. If null, it'll be rendered to the screen.
    this.target = target;
  }
}
