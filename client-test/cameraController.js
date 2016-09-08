import { quat, vec3, mat4 } from 'gl-matrix';

export default class CameraController {
  constructor(node, keyNode) {
    // Blender-like control mode
    this.rotation = quat.create();
    this.center = vec3.create();
    this.radius = 6;

    this.mouseHeld = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.rotateDir = 0;

    this.slerpStart = quat.create();
    this.slerpEnd = quat.create();
    this.slerpCounter = -1;

    this.lerpStart = vec3.create();
    this.lerpEnd = vec3.create();
    this.lerpCounter = -1;

    // false - Blender-like control
    // true - FPS-like control
    this.mode = false;

    this.hasChanged = true;
    this.projMat = mat4.create();
    this.viewMat = mat4.create();

    this.node = node;
    this.keyNode = keyNode;

    this.registerEvents();
  }
  registerEvents() {
    this.node.addEventListener('mousemove', e => {
      if (!this.mouseHeld) return;
      let offsetX = e.clientX - this.mouseX;
      let offsetY = e.clientY - this.mouseY;
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      if (e.shiftKey) {
        // Do translation instead - we'd need two vectors to make translation
        // relative to the camera rotation
        let vecX = vec3.create();
        let vecY = vec3.create();
        vec3.transformQuat(vecX, [-offsetX * this.radius / 600, 0, 0],
          this.rotation);
        vec3.transformQuat(vecY, [0, offsetY * this.radius / 600, 0],
          this.rotation);
        vec3.add(this.center, this.center, vecX);
        vec3.add(this.center, this.center, vecY);
        this.hasChanged = true;
        return;
      }
      // rotation....
      let rot = quat.create();
      quat.rotateY(rot, rot, Math.PI / 180 * -offsetX *
        this.rotateDir / 4);
      quat.multiply(this.rotation, rot, this.rotation);
      quat.rotateX(this.rotation, this.rotation, Math.PI / 180 * -offsetY / 4);
      this.hasChanged = true;
    });
    this.node.addEventListener('contextmenu', e => {
      e.preventDefault();
    });
    this.node.addEventListener('mousedown', e => {
      // if (e.button !== 1 && e.button !== 2) return;
      this.mouseHeld = true;
      // Determine if we should go clockwise or anticlockwise.
      let upLocal = vec3.create();
      let up = vec3.fromValues(0, 1, 0);
      vec3.transformQuat(upLocal, [0, 1, 0],
        this.rotation);
      let upDot = vec3.dot(up, upLocal);
      this.rotateDir = upDot >= 0 ? 1 : -1;
      // Set position
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      e.preventDefault();
    });
    this.node.addEventListener('mouseup', e => {
      // if (e.button !== 1 && e.button !== 2) return;
      this.mouseHeld = false;
      e.preventDefault();
    });
    this.node.addEventListener('wheel', e => {
      if (e.deltaMode === 0) {
        this.radius += this.radius * e.deltaY / 50 / 12;
      } else {
        this.radius += this.radius * e.deltaY / 50;
      }
      this.hasChanged = true;
      e.preventDefault();
    });
  }
  update() {
    if (this.hasChanged) {
      let rot = quat.create();
      quat.invert(rot, this.rotation);
      let pos = vec3.create();
      vec3.transformQuat(pos, [0, 0, -this.radius], this.rotation);
      vec3.subtract(pos, pos, this.center);
      // Create view matrix
      mat4.fromQuat(this.viewMat, rot);
      mat4.translate(this.viewMat, this.viewMat, pos);
      // mat4.fromRotationTranslation(this.viewMat, rot, pos);
      this.hasChanged = false;
    }
  }
}
