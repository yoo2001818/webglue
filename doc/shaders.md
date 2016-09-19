# Shaders
Some shaders may use `#define` to set the light size, or features.
There are few types of that, mainly:

- Feature definition. Mainly boolean.
- Number definition. It should have max limit (Since there is uniform budget
  limit), and it should adaptively changed because it affects the performance.
  Maybe some kind of 'governor' should be implemented.
  Or, it should be an exact number (Kernel size)

It'd be written in the vertex or/and fragment shader, like:

```glsl
#pragma webglue: feature(USE_DEPTH, uDepth)
#pragma webglue: count(LIGHTS_COUNT, uLights, max=1)
#pragma webglue: define(KERNEL_SIZE, uKernel)
```

Then at the render time, the shader would check if current shader is valid
and use the right one if needed.

Feature definition will use a BitSet to save it, (Thus limited to 32 features)
and fragment/vertex shader will share same context (If same uniform is
specified, it'd use shared bitset key)

Count definition will be created on-demand, while capping to maximum value.

Capability definition never changes, so it wouldn't be changed at all.

```js
/^\s*#pragma webglue: ([a-z]+)\(([^\)]+)(?:,[\t ]*([^\)]+))*\)\s*$/gm
```

It'd be contained like:
```js
{
  3: [{
    uLights: 5,
    program: WebGLProgram
  }, {
    uLights: 11,
    program: WebGLProgram
  }],
  17: [{
    uLights: 5,
    program: WebGLProgram
  }]
}
```
