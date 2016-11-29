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

### Shader object
- `dispose()` - Disposes the shader object.

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

## Geometry
Geometry interface can be accessed using `renderer.geometries`.

- `create(options)` - Creates the geometry.
- `createBuffer(data: Float32Array)` - Creates the VBO buffer.

### Geometry options
Geometry options are defined using the following schema.

```js
{
  attributes: {
    aPosition: {
      data: [0, 0, 0, 0, 0, 1],
      axis: 3
    },
    aInstanced: {
      data: [0, 1],
      axis: 2,
      instanced: 1
    },
    aVerbose: {
      data: [0, 1],
      axis: 1
      // geometry.vbo or buffer object
      // buffer: null
      stride: 4, // Stride value, in bytes
      offset: 0 // Offset value, in bytes
    }
  },
  // Instanced attributes can be defined like this too
  /* instanced: {
    aInstanced: 1
  }, */
  indices: [0, 1],
  mode: gl.LINES,
  // count: 2,
  // primCount: 2
}
```

#### Attribute
Attribute name can be anything, but webglue uses `aPosition`, `aTexCoord`,
`aNormal`, `aTangent` by default.

You can use either Float32Array or just regular array, as webglue automatically
parses them. It's also possible to define them using 2D array. If using 1D
array, you must specify axis.

```js
{
  attributes: {
    aPosition: [
      [0, 0, 0], [1, 0, 0]
    ],
    aTexCoord: {
      data: [0, 0, 1, 1],
      axis: 2
    },
    aNormal: {
      data: new Float32Array([0, 1, 0, 0, 1, 0]),
      axis: 3
    }
  }
}
```

You can specify WebGL buffer, `stride`, `offset`, `instanced` (divisor) for
an attribute too.

#### Indices
Indices are exactly same as WebGL indices buffer, but an array or 2D array can
be used as well.

#### Mode
Mode is exactly same as WebGL mode, it can be one of the following:

- `gl.TRIANGLES` - the default value
- `gl.TRIANGLE_STRIP`
- `gl.TRIANGLE_FAN`
- `gl.LINES`
- `gl.LINE_STRIP`
- `gl.LINE_LOOP`
- `gl.POINTS`

### Geometry object
Once `renderer.geometries.create(options)` is called, it returns an geometry
object. It can be used to reuse geometry buffer in another geometry, or
to reupload the geometry object.

- `update(options)` - Updates the geometry object. Only given attributes/indices
  will be uploaded (If not specified, it won't be changed.) If `null` or `false`
  is given as an attribute, it'll be deleted.
- `dispose()` - Disposes the geometry object. This will remove the VBO object
  from WebGL, so if other geometry is referencing the geometry,
  it'll cause an error.
