import RenderContext from '../webgl/renderContext';

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
    const { canvas } = this;
    let docSize = getDocumentSize();
    canvas.width = docSize.width;
    canvas.height = docSize.height;
    this.setSize(docSize.width, docSize.height);
  }
  update(container, delta) {
    this.deltaTime = delta;
    this.reset();
    container.update(this, null);
    this.render();
  }
}
