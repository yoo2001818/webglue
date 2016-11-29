# webglue
Minimal WebGL wrapper library

webglue is a minimal WebGL wrapper library, which means it provides no
abstraction for WebGL concepts such as shaders or geometries.

Instead, webglue provides convinient interface for accessing WebGL.

- Draw calls are represented using JSON and a tree structure.
- Shader can be dynamically selected using uniforms and `pragma`. This is
  pretty useful since WebGL doesn't support dynamic `for` clause, dynamic
  texture lookup, etc.
- Geometries can be generated using functional programming.

# Installation
Run `npm install webglue` and use it like examples.

# Examples
[Examples directory](./client-test)

Note that importing should use `webglue/lib` instead of `webglue`.

## Really minimal example
```js
import Renderer from 'webglue/lib/renderer';
import Camera from 'webglue/lib/camera';
import Transform from 'webglue/lib/transform';
import box from 'webglue/lib/geom/box';
import wireframe from 'webglue/lib/geom/wireframe';

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

# Reference
## Renderer
`Renderer` class contains the WebGL context and all the webglue objects.

In order to render something using webglue, `Renderer` must be created like
this:

```js
import Renderer from 'webglue/lib/renderer';

let canvas = document.createElement('canvas');
let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
let renderer = new Renderer(gl);
document.body.appendChild(canvas);
```

`Renderer` consists of several parts. Each part manages single portion of WebGL
resource.

- shaders
- geometries
- textures
- framebuffers
- state

`Renderer` itself handles `render` function.

## Shader
Shader interface can be accessed using `renderer.shaders`.
- `create(vert, frag, noPreprocess)` - Creates the shader. `vert` is vertex
  shader code, `frag` is fragment shader code.  
  If `noPreprocess` is true, preprocessing will be disabled for the shader.

### Preprocessing
If preprocessing is enabled, webglue will look for registered uniform values,
then automatically put `#define`s into the shader.
```glsl
#pragma webglue: feature(USE_TEXTURE, uTexture)
#pragma webglue: count(FOR_LOOPS, uLoops, equal)

#ifndef FOR_LOOPS
  #define FOR_LOOPS 0
#endif

precision lowp float;

varying vec2 vTexCoord;
uniform sampler2D uTexture;
uniform vec2 uTextureResolution;

void main() {
  #ifdef USE_TEXTURE
    vec4 sum = texture2D(uTexture, vTexCoord);
    for (int i = 1; i < FOR_LOOPS; ++i) {
      sum += texture2D(uTexture, vTexCoord + uTextureResolution * i);
    }
    gl_FragColor = sum;
  #else
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  #endif
}
```

webglue-specific pragmas are defined using `#pragma webglue: ...`.

#### feature
`feature(defineName, uniformName)`

if `uniformName` uniform is defined (not `false` or `null` or `undefined`),
`defineName` will be defined.

#### count
`count(defineName, uniformName, governor)`

`count` will automatically change `defineName` by looking at `uniformValue`'s
value, using `governor`.

##### governors
Governors can be defined in `renderer.shaders.governors`.

```js
renderer.shaders.governors.equal = {
  checker: (shader, current) => shader === current,
  allocator: current => current
}
```

Predefined governors are:

- `max` - `defined value >= uniform value`
- `equal` - `defined value == uniform value`
- `maxLength` - `defined value >= (uniform value).length`
