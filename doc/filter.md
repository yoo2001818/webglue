# Filters
Using image filter is really common task, Furthermore, many filters require
multiple passes, for example Gaussian blur, box blur, etc.

However, it's pretty tedious to create shader and texture and framebuffer for
them. So we need a simple way to do texture manipulation.

That's what Filter will do. Filter will create quad geometry, framebuffer,
output texture, shader, and return the rendering tree. This way, image filters
become much simpler. Filter will share framebuffer between instances through
renderer's variable. Also, filters should be chainable.

Filter has these properties:

- Inputs (Options)
- Output
- Fragment shader

Fragment shader should use `uTexture` for texture input.

A simple use case:
```js
let input = renderer.textures.create('res/input.png');
let intermediate = renderer.textures.create(null, { width: 512, height: 512 });
let output = renderer.textures.create(null, { width: 512, height: 512 });
let gaussianBlur = new Filter(renderer, 'fragment shader...');
onLoad(input, () => {
  renderer.render([
    gaussianBlur.get(input, intermediate, {uKernel: [1, 0]}),
    gaussianBlur.get(intermediate, output, {uKernel: [0, 1]})
  ]);
});
```
