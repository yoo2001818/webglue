import { quat, vec3 } from 'gl-matrix';

export default class CameraController {
  constructor(node, keyNode, camera) {
    // Blender-like control mode
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
    this.camera = camera;

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
      let transform = this.camera.transform;
      if (e.shiftKey) {
        // Do translation instead - we'd need two vectors to make translation
        // relative to the camera rotation
        let vecX = vec3.create();
        let vecY = vec3.create();
        vec3.transformQuat(vecX, [-offsetX * this.radius / 600, 0, 0],
          transform.rotation);
        vec3.transformQuat(vecY, [0, offsetY * this.radius / 600, 0],
          transform.rotation);
        vec3.add(this.center, this.center, vecX);
        vec3.add(this.center, this.center, vecY);
        this.hasChanged = true;
        return;
      }
      // rotation....
      let rot = quat.create();
      quat.rotateY(rot, rot, Math.PI / 180 * -offsetX *
        this.rotateDir / 4);
      quat.multiply(transform.rotation, rot, transform.rotation);
      quat.rotateX(transform.rotation, transform.rotation,
        Math.PI / 180 * -offsetY / 4);
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
        this.camera.transform.rotation);
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
      let diff = e.deltaY / 50;
      if (e.deltaMode === 0) diff /= 12;
      if (e.shiftKey) {
        let vecY = vec3.create();
        vec3.transformQuat(vecY, [0, -diff * this.radius, 0],
          this.rotation);
        vec3.add(this.center, this.center, vecY);
        this.hasChanged = true;
        e.preventDefault();
        return;
      } else if (e.ctrlKey) {
        let vecX = vec3.create();
        vec3.transformQuat(vecX, [diff * this.radius, 0, 0],
          this.rotation);
        vec3.add(this.center, this.center, vecX);
        this.hasChanged = true;
        e.preventDefault();
        return;
      }
      this.radius += this.radius * diff;
      this.hasChanged = true;
      e.preventDefault();
    });
  }
  update() {
    if (this.hasChanged) {
      let transform = this.camera.transform;
      vec3.transformQuat(transform.position, [0, 0, this.radius],
        transform.rotation);
      vec3.add(transform.position, transform.position, this.center);
      transform.invalidate();
      this.hasChanged = false;
    }
  }
}
