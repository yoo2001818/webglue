import RenderContext from 'webglue/webgl/renderContext';

function getDocumentSize() {
  const { clientWidth: width, clientHeight: height } = document.documentElement;
  return {
    width: width | 0,
    height: height | 0
  };
}


export default class CanvasRenderContext extends RenderContext {
  constructor(fillScreen = true, canvas) {
    // Create canvas if it does not exists
    let canvasObj = canvas;
    if (canvasObj == null) {
      canvasObj = document.createElement('canvas');
      document.body.appendChild(canvasObj);
    }
    // Set the size
    if (fillScreen) {
      let docSize = getDocumentSize();
      canvasObj.width = docSize.width;
      canvasObj.height = docSize.height;
    }
    // Create WebGL context
    let gl;
    try {
      gl = canvasObj.getContext('webgl', { antialias: false }) ||
        canvasObj.getContext('experimental-webgl');
    } catch (e) {
      console.log(e);
    }
    if (!gl) {
      alert('This browser does not support WebGL.');
      throw new Error('WebGL unsupported');
    }
    // Init
    super(gl);
    this.fillScreen = fillScreen;
    this.canvas = canvasObj;
    this.aspectChanged = true;

    if (fillScreen) {
      window.addEventListener('resize', this.handleResize.bind(this));
    }

    canvasObj.addEventListener('webglcontextlost', event => {
      event.preventDefault();
    }, false);

    canvasObj.addEventListener('webglcontextrestored', () => {
      this.resetContext();
    }, false);
  }
  handleResize() {
    const { canvas, gl } = this;
    let docSize = getDocumentSize();
    canvas.width = docSize.width;
    canvas.height = docSize.height;
    if (!gl) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    this.aspectChanged = true;
  }
  update(container, delta) {
    this.deltaTime = delta;
    // Set the aspect ratio
    if (this.aspectChanged && this.camera) {
      const { canvas, camera } = this;
      camera.aspect = canvas.width / canvas.height;
      camera.invalidate();
      this.aspectChanged = false;
    }
    this.reset();
    container.update(this, null);
    this.render();
  }
}
