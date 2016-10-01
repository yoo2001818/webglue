import { quat, vec3 } from 'gl-matrix';
import { perspective, orthogonal } from '../camera';

function easeInOutQuad (t) {
  t *= 2;
  if (t < 1) return t*t/2;
  t--;
  return (t*(t-2) - 1) / -2;
}

export default class BlenderCameraController {
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
    //
    this.perspective = true;

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
    this.node.addEventListener('touchstart', e => {
      e.preventDefault();
      this.mouseHeld = true;
      // Determine if we should go clockwise or anticlockwise.
      let upLocal = vec3.create();
      let up = vec3.fromValues(0, 1, 0);
      vec3.transformQuat(upLocal, [0, 1, 0],
        this.camera.transform.rotation);
      let upDot = vec3.dot(up, upLocal);
      this.rotateDir = upDot >= 0 ? 1 : -1;
      // Set position
      this.mouseX = e.changedTouches[0].pageX;
      this.mouseY = e.changedTouches[0].pageY;
    }, false);
    this.node.addEventListener('touchmove', e => {
      if (!this.mouseHeld) return;
      let offsetX = e.changedTouches[0].pageX - this.mouseX;
      let offsetY = e.changedTouches[0].pageY - this.mouseY;
      this.mouseX = e.changedTouches[0].pageX;
      this.mouseY = e.changedTouches[0].pageY;
      let transform = this.camera.transform;
      // rotation....
      let rot = quat.create();
      quat.rotateY(rot, rot, Math.PI / 180 * -offsetX *
        this.rotateDir / 4);
      quat.multiply(transform.rotation, rot, transform.rotation);
      quat.rotateX(transform.rotation, transform.rotation,
        Math.PI / 180 * -offsetY / 4);
      this.hasChanged = true;
    });
    this.node.addEventListener('touchend', e => {
      e.preventDefault();
      this.mouseHeld = false;
    }, false);
    this.node.addEventListener('touchcancel', e => {
      e.preventDefault();
      this.mouseHeld = false;
    }, false);
    this.node.addEventListener('mousedown', e => {
      if (e.button === 0) return;
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
      if (e.button === 0) return;
      this.mouseHeld = false;
      e.preventDefault();
    });
    this.keyNode.addEventListener('keydown', e => {
      if (e.shiftKey) return;
      const { camera } = this;
      if (e.keyCode === 32) {
        vec3.copy(this.lerpStart, this.center);
        vec3.set(this.lerpEnd, 0, 0, 0);
        this.lerpCounter = 0;
      }
      // Persp - Ortho swap
      if (e.keyCode === 101 || e.keyCode === 53) {
        this.perspective = !this.perspective;
        if (this.perspective) {
          camera.projection = perspective(Math.PI / 180 * 70, 0.3, 1000);
        }
        this.hasChanged = true;
      }
      // Front
      if (e.keyCode === 97 || e.keyCode === 49) {
        quat.copy(this.slerpStart, camera.transform.rotation);
        quat.identity(this.slerpEnd);
        if (e.ctrlKey) {
          quat.rotateY(this.slerpEnd, this.slerpEnd, Math.PI);
        }
        this.slerpCounter = 0;
      }
      // Right
      if (e.keyCode === 99 || e.keyCode === 51) {
        quat.copy(this.slerpStart, camera.transform.rotation);
        quat.identity(this.slerpEnd);
        quat.rotateY(this.slerpEnd, this.slerpEnd, Math.PI / 2);
        if (e.ctrlKey) {
          quat.rotateY(this.slerpEnd, this.slerpEnd, -Math.PI);
        }
        this.slerpCounter = 0;
      }
      // Top
      if (e.keyCode === 103 || e.keyCode === 55) {
        quat.copy(this.slerpStart, camera.transform.rotation);
        quat.identity(this.slerpEnd);
        quat.rotateX(this.slerpEnd, this.slerpEnd, -Math.PI / 2);
        if (e.ctrlKey) {
          quat.rotateX(this.slerpEnd, this.slerpEnd, Math.PI);
        }
        this.slerpCounter = 0;
      }
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
  update(delta) {
    let transform = this.camera.transform;
    if (this.lerpCounter !== -1) {
      this.lerpCounter = Math.min(1, this.lerpCounter + delta * 4);
      vec3.lerp(this.center,
        this.lerpStart, this.lerpEnd, easeInOutQuad(this.lerpCounter)
      );
      this.hasChanged = true;
      if (this.lerpCounter >= 1) this.lerpCounter = -1;
    }
    if (this.slerpCounter !== -1) {
      this.slerpCounter = Math.min(1, this.slerpCounter + delta * 4);
      quat.slerp(transform.rotation,
        this.slerpStart, this.slerpEnd, easeInOutQuad(this.slerpCounter)
      );
      this.hasChanged = true;
      if (this.slerpCounter >= 1) this.slerpCounter = -1;
    }
    if (this.hasChanged) {
      if (!this.perspective) {
        this.camera.projection = orthogonal(this.radius / 2, 0.1, 1000);
      }
      vec3.transformQuat(transform.position, [0, 0, this.radius],
        transform.rotation);
      vec3.add(transform.position, transform.position, this.center);
      transform.invalidate();
      this.hasChanged = false;
    }
  }
}
