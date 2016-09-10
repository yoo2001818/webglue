# Geometry
Geometry consists of:

- Attributes
- Indices
- Mode
- Instanced

## Attribute
Each attribute has following values:

- Data
- Axis

However, there's bunch more options in actual WebGL that users can customize.

- Stride
- Position
- Residing VBO

WebGLue forces the user to use one VBO per geometry, which can be bad for
reuploading geometry (static, dynamic). Stride and position are not used
very often, but it can be used to render lines.

To support separate VBO, users should be able to explicitly make their own
VBO (not from the geometry). Shouldn't be too hard. Stride and position would
require using VBO too.

## Indices
Indices (Elements) array. Nothing else..

## Mode
Drawing mode. Since single geometry can have multiple modes to draw single
object, it'd be good to support multiple modes. However, making geometry
functions will be hard then.

We can make a utility function to support multiple modes, but I don't think it's
that useful. 

## Instanced
Specifies instanced divisor. Fallback will be run if instancing isn't supported.
