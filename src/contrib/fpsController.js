import { quat, vec3 } from 'gl-matrix';

export default class FPSCameraController {
  constructor(node, keyNode, camera) {
    this.node = node;
    this.keyNode = keyNode;
    this.camera = camera;
    this.speed = 8.0;
    this.pitch = 0;
    this.yaw = Math.PI / 2;
    this.hasChanged = true;

    this.mouseX = 0;
    this.mouseY = 0;
    this.keys = [];
    
    this.registerEvents();
  }
  registerEvents() {
    this.node.addEventListener('click', () => {
      this.node.requestPointerLock = this.node.requestPointerLock ||
                                       this.node.mozRequestPointerLock;
      this.node.requestPointerLock();
    });
    this.node.addEventListener('mousemove', e => {
      if (document.pointerLockElement || document.mozPointerLockElement) {
        this.pitch = Math.max(-Math.PI / 2 + 0.001, Math.min(Math.PI / 2
          - 0.001, this.pitch - e.movementY / 400));
        this.yaw = this.yaw + e.movementX / 400;
        this.hasChanged = true;
        return;
      }
      let mouseX = e.layerX - this.node.width / 2;
      let mouseY = e.layerY - this.node.height / 2;
      this.mouseX = mouseX;
      this.mouseY = mouseY;
    });
    this.keyNode.addEventListener('keydown', e => {
      this.keys[e.keyCode] = true;
    });
    this.keyNode.addEventListener('keyup', e => {
      this.keys[e.keyCode] = false;
    });
  }
  update(delta) {
    const { camera } = this;

    if (!this.node.requestPointerLock && !this.node.mozRequestPointerLock) {
      if (Math.abs(this.mouseY) > 10) {
        this.pitch = Math.max(-Math.PI / 2 + 0.001, Math.min(Math.PI / 2
          - 0.001, this.pitch - Math.sin(this.mouseY / 4000)));
        this.hasChanged = true;
      }
      if (Math.abs(this.mouseX) > 10) {
        this.yaw = this.yaw + Math.sin(this.mouseX / 4000);
        this.hasChanged = true;
      }
      /*this.pitch = Math.max(-Math.PI / 2 + 0.001, Math.min(Math.PI / 2
        - 0.001, -this.mouseY / 200));
      this.yaw = this.mouseX / 200;*/
    }

    // Build camera rotation.
    if (this.hasChanged) {
      quat.identity(camera.transform.rotation);
      quat.rotateY(camera.transform.rotation, camera.transform.rotation,
        -this.yaw);
      quat.rotateX(camera.transform.rotation, camera.transform.rotation,
        this.pitch);
    }

    // Process movement; We have to build up, front, right vector.
    let up = vec3.fromValues(0, 1, 0);
    // Since camera's default position faces Z-, we have to rotate them weirdly
    let front = vec3.fromValues(
      Math.cos(this.pitch) * Math.sin(this.yaw),
      Math.sin(this.pitch),
      Math.cos(this.pitch) * -Math.cos(this.yaw)
    );
    vec3.normalize(front, front);
    // Calculating right (or left) vector can be done by calculating cross
    // vector of those two.
    let right = vec3.create();
    vec3.cross(right, up, front);

    let speed = this.speed * delta;
    let velocity = vec3.create();
    // Now, process the key inputs.
    if (this.keys[38] || this.keys[87]) {
      vec3.add(velocity, velocity, front);
    }
    if (this.keys[40] || this.keys[83]) {
      vec3.subtract(velocity, velocity, front);
    }
    if (this.keys[69]) {
      vec3.add(velocity, velocity, up);
    }
    if (this.keys[81]) {
      vec3.subtract(velocity, velocity, up);
    }
    if (this.keys[37] || this.keys[65]) {
      vec3.add(velocity, velocity, right);
    }
    if (this.keys[39] || this.keys[68]) {
      vec3.subtract(velocity, velocity, right);
    }
    vec3.normalize(velocity, velocity);
    vec3.scale(velocity, velocity, speed);
    vec3.add(camera.transform.position, camera.transform.position, velocity);
    this.hasChanged = true;
    if (this.hasChanged) {
      camera.transform.invalidate();
      this.hasChanged = false;
    }
  }
}
