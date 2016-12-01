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

`Renderer` itself handles `render` function.

- `render(passes)` - Renders the scene graph.

### Scene graph
Scene graph can be `false`, `null`, Array, Object, or Function.

- `false` and `null` will be silently ignored.
- If an array is specified, its contents will be called recursively
  (`array.forEach(this.render)`).
- If an function is specified, the function will be run and returned object will
  be called recusively (`this.render(func())`).

An object is treated like a 'scene node', which has WebGL properties and
children.

Scene node looks like this:
```js
{
  options: {
    clearColor: '#000000',
    clearDepth: 1,
    cull: gl.BACK,
    depth: gl.LEQUAL
  },
  shader: shader,
  uniforms: {
    uView: camera.getView,
    uProjection: camera.getProjection,
    uColor: '#ff0000',
    uTexture: texture,
    uLightPos: [1, 2, 3],
    uNormal: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9])
  },
  passes: [{
    geometry: geometry,
    uniforms: {
      uModel: transform.get
    }
  }, {
    geometry: geometry2,
    uniforms: {
      uModel: transform2.get
    },
    passes: [{
      framebuffer: {
        framebuffer: framebuffer,
        // Or it can be color: texture2, as 'target' exists for cubemap textures
        color: { texture: texture2, target: gl.TEXTURE_2D }
      }
    }, {
      framebuffer: framebuffer2
    }]
  }]
}
```

#### options
`options` set the WebGL state and features.
The following options are available:

- blend: `false` | Object (See below)
  - color: Array<Number(0-1)> = [r, g, b, a]
  - equation: WebGLConstant | {rgb: WebGLConstant, alpha: WebGLConstant}
  - func: Array<WebGLConstant> = [sfactor, dfactor] |
    {rgb: Array<WebGLConstant>, alpha: Array<WebGLConstant>}
- colorMask: Array<Boolean>
- depthMask: Boolean
- clearColor: String | Array<Number(0-1)> = [r, g, b, a]
- clearDepth: Number
- clearStencil: Number
- cull: `false` | `gl.FRONT` | `gl.BACK` | `gl.FRONT_AND_BACK` |
  Object (See below)
  - front: `gl.CW` | `gl.CCW`
  - face: `gl.FRONT` | `gl.BACK` | `gl.FRONT_AND_BACK`
- depth: `false` | `gl.NEVER` | `gl.LESS` | `gl.EQUAL` | `gl.LEQUAL` |
  `gl.GREATER` | `gl.NOTEQUAL` | `gl.GEQUAL` | `gl.ALWAYS` | Object (See below)
  - func: `gl.NEVER` | `gl.LESS` | `gl.EQUAL` | `gl.LEQUAL` |
    `gl.GREATER` | `gl.NOTEQUAL` | `gl.GEQUAL` | `gl.ALWAYS`
  - range: Array<Number(0-1)> = [zNear, zFar]
- dither: Boolean
- stencil: `false` | Object (See below)
  - func: Array = [func, ref, mask] | Array = [front = [func, ref, mask],
    back = [func, ref, mask]]
  - op: Array = [fail, zFail, pass] | Array = [front = [fail, zFail, pass],
    back = [fail, zFail, pass]]
- viewport: `false` | Array<Number> = [x, y, w, h]
- scissor: `false` | Array<Number> = [x, y, w, h]
- polygonOffset: `false` | Array<Number> = [factor, units]

#### shader
`shader` sets the shader to use. It must be a shader object generated by
`renderer.shaders.create`.

##### shaderHandler
`shaderHandler` can be set to override or swap the shader by top node.
When children node uses shader, `shaderHandler(shader, node, renderer)` will be
called. The returned value will be used as the shader.

### geometry
`geometry` sets the geometry to use. It must be a geometry object generated by
`renderer.geometries.create`.

### framebuffer
`framebuffer` sets the framebuffer to use. It can be also specified like this
to reset bound texture:

```js
framebuffer: {
  framebuffer: framebuffer,
  // Or it can be color: texture2, as 'target' exists for cubemap textures
  color: { texture: texture2, target: gl.TEXTURE_2D }
}
```

### uniforms
Sets uniforms to pass to the shader.

```js
{
  uView: camera.getView,
  uProjection: camera.getProjection,
  uColor: '#ff0000',
  uTexture: texture,
  uLightPos: [1, 2, 3],
  uNormal: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]),
  uMaterial: {
    ambient: '#ffffff',
    diffuse: '#ff0000',
    specular: '#aabbbbbb' // ARGB
  },
  uArray: ['#ff0000', '#0000ff']
}
```

This is pretty self-explanatory though, but here's some description:

- GLSL Structs and arrays will be expanded to support JSON.
- JS Array will be converted to Float32Array, or Int32Array.
- RGB can be specified on vec3.
- RGB or ARGB can be specified on vec4.
- Texture object can be specified on sampler2D, samplerCube.
- Function can be specified, then the function's result will be used as the
  uniform.

### passes
Sets the child nodes to render. If this is specified, the node itself won't
be rendered - only the children will.

Child node inherits parent node's properties, except `clearColor`, `clearDepth`
and `clearStencil`. This is really useful for rendering multiple objects
on the screen.

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
- `createBuffer(data: Float32Array)` - Creates the buffer.

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
Once `renderer.geometries.create(options)` is called, it returns a geometry
object. It can be used to reuse geometry buffer in another geometry, or
to reupload the geometry object.

- `update(options)` - Updates the geometry object. Only given attributes/indices
  will be uploaded (If not specified, it won't be changed.) If `null` or `false`
  is given as an attribute, it'll be deleted.
- `dispose()` - Disposes the geometry object. This will remove the VBO object
  from WebGL, so if other geometry is referencing the geometry,
  it'll cause an error.

### Buffer object
`renderer.geometries.createBuffer(data)` will return a buffer object. It can be
specified in attribute's `buffer`.

- `update(data)` - Reuploads the buffer object.
- `updateSub(data, offset)` - Reuploads the portion of buffer object. Offset
  is in Float32Array index, not in bytes.
- `dispose()` - Disposes the buffer object. This will remove the VBO object
  from WebGL, so if other geometry is referencing the geometry,
  it'll cause an error.

## Texture
Texture interface can be accessed using `renderer.textures`.

- `create(source, options)` - Creates the texture. Source can be a URL,
  a Image or Video, or TypedArray, or null. If the source is an array (not
  TypedArray), a cubemap will be created.
  If TypedArray is specified, width and height must be specified in options.

The following code specifies the default options of textures. If the source
is null, `minFilter` will be `gl.LINEAR` and `mipmap` will be disabled.

```js
{
  target: renderer.gl.TEXTURE_2D,
  format: renderer.gl.RGB,
  type: renderer.gl.UNSIGNED_BYTE,
  params: {
    magFilter: gl.LINEAR,
    minFilter: gl.LINEAR_MIPMAP_LINEAR,
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE,
    mipmap: true,
    flipY: true
  }
}
```

### Texture object
Once `renderer.textures.create(texture, options)` is called, it returns a
texture object.

- `this.valid` - If false, texture will be reuploaded. This is useful for
  processing videos.
- `this.width` - The texture width. (0 if not uploaded)
- `this.height` - The texture height. (0 if not uploaded)
- `generateMipmap()` - Generates mipmap of the texture.
- `dispose()` - Disposes the texture object.

## Framebuffer
Framebuffer interface can be accessed using `renderer.framebuffers`.

- `create(options)` - Creates the framebuffer object.

Options look like this. Note that only depth renderbuffer is supported for now.

```js
{
  color: texture,
  depth: gl.DEPTH_COMPONENT16
}
```

### Framebuffer object
`renderer.framebuffers.create(options)` returns a framebuffer object.

- `readPixels(x, y, width, height, format, type, pixels)` - Calls
  `gl.readPixels`.
- `readPixelsRGBA(x, y, width, height, pixels)` - Reads pixels into `pixels`.
- `readPixelsRGB(x, y, width, height, pixels)` - Reads pixels into `pixels`.
- `dispose()` - Disposes the framebuffer object.
