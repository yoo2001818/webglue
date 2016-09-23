# Geometry
Geometry consists of:

- Attributes
- Indices
- Count
- PrimCount
- Mode

## Attribute
Each attribute has following values:

- Data
- Axis
- Instanced

However, there's bunch more options in actual WebGL that users can customize.

- Stride
- Position
- Residing VBO

WebGLue forces the user to use one VBO per geometry, which can be bad for
reuploading geometry (static, dynamic). Stride and position are not used
very often, but it can be used to render lines.

To support separate VBO, users should be able to explicitly make their own
VBO. Shouldn't be too hard. Stride and position would require using VBO too.

Using matrix attribute is unsupported; There's no reason to do so.

```js
let buffer = renderer.geometries.createBuffer(/* TypedArray */);
let geometry = renderer.geometries.create({
  attributes: {
    aPosition: {
      buffer: buffer,
      offset: 0,
      stride: 3,
      axis: 3
    },
    aTexCoord: { // 'Traditional' method
      // (This will belong to geometry's own VBO)
      data: /* TypedArray */,
      axis: 2
    },
    aInstancedPos: {
      data: /* TypedArray */,
      axis: 3,
      instanced: 1
    }
  },
  count: 30 // Specifying this is mandatory now
})
// Unlike textures and shaders, geometries will be created immedately after
// calling create
let geomBuffer = geometry.vbo; // This yields geometry's buffer
deepEqual(geometry.attributes.aTexCoord, {
  buffer: geomBuffer,
  offset: 0,
  stride: 2,
  axis: 2,
  data: // data
});
```

### Uploading Attributes
Uploading attributes is quite complicated. (due to VBO support)

First, we need these variables:

- VBO. Defaults to null.
- Offsets. Defaults to null.
- Final attributes. Defaults to `{}`.
- Upload attributes. Defaults to `[]`.

1. Loop through each attributes. If we're done, move to 4.
2. If specified attribute's VBO isn't specified, use geometry's own VBO. (Create
   VBO if geometry's VBO doesn't exist) If it's specified, just copy it to
   final attributes object and skip to 1.  
   **This means that we don't reupload data to specified VBO even if it's
   specified.**
3. Increment offsets and put stride / offset to attribute, and copy it to the
   final attributes object. Put that attribute to upload attributes array.
   Go back to 1.
4. If geometry's own VBO is created (Upload attributes is not empty), Upload
   data to VBO for each attribute.

Then, at the use time, read each attribute and set pointer to it.

### Updating attributes
Updating attributes can be simple or complex depending on whether resizing has
occurred or not. If resizing has occurred, we have to update VAO to latest
state.

Currently it shouldn't overwrite VBO if custom VBO is specified; otherwise
we can simply overwrite it to geometry's VBO. However it can be changed later.

## Indices
Indices (Elements) array. **TODO** Support custom EBO / offset / size for this

## Mode
Drawing mode. Since single geometry can have multiple modes to draw single
object, it'd be good to support multiple modes. However, making geometry
functions will be hard then.

We can make a utility function to support multiple modes, but I don't think it's
that useful.
