# webglue
Minimal WebGL wrapper library

# Installation
Run `npm install webglue` and use it like examples.

# Examples
[Examples directory](./client-test)

Note that importing should use `webglue/lib` instead of `webglue`.

## Really minimal example
```js
import Renderer from 'webglue/renderer';
import Camera from 'webglue/camera';
import Transform from 'webglue/transform';
import box from 'webglue/geom/box';
import wireframe from 'webglue/geom/wireframe';

let canvas = document.createElement('canvas');
let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
let renderer = new Renderer(gl);
document.body.appendChild(canvas);

let camera = new Camera();
camera.transform.translate([0, 0, 5]);
let transform = new Transform();
transform.rotateY(Math.PI / 4);
let geometry = renderer.geometries.create(wireframe(box()));
let shader = renderer.shaders.create(`
attribute vec3 aPosition;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;

void main() {
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}
`, `
void main() {
  gl_FragColor = vec4(1.0);
}
`);

renderer.render({
  options: {
    clearColor: new Float32Array([0, 0, 0, 1])
  },
  geometry: geometry,
  shader: shader,
  uniforms: {
    uModel: transform.get,
    uView: camera.getView,
    uProjection: camera.getProjection
  }
});
```
