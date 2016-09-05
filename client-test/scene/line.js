import { mat3, mat4 } from 'gl-matrix';

export default function line(renderer) {
  const gl = renderer.gl;
  let box = renderer.geometries.create({
    attributes: {
      aPosition: [
        [-1, -1, -1], [1, 1, 1]
      ],
      aColor: [
        [1, 0, 0], [0, 0, 1]
      ]
    },
    mode: gl.LINES
  });
  let shader = renderer.shaders.create(
    require('../shader/staticColor.vert'),
    require('../shader/staticColor.frag')
  );
  let texture = renderer.textures.create({
    source: require('../texture/2.png')
  });

  let model1Mat = mat4.create();
  let model1Normal = mat3.create();

  let projMat = mat4.create();
  let viewMat = mat4.create();
  mat4.translate(viewMat, viewMat, new Float32Array([0, 0, -4]));

  return (delta) => {
    // TODO We have to receive aspect ratio from renderer, to make it work
    // in a framebuffer
    mat4.perspective(projMat, Math.PI / 180 * 70, gl.drawingBufferWidth /
      gl.drawingBufferHeight, 0.1, 60);
    mat4.rotateY(model1Mat, model1Mat, Math.PI * delta / 1000 / 2);
    mat3.normalFromMat4(model1Normal, model1Mat);

    renderer.render({
      options: {
        clearColor: new Float32Array([0, 0, 0, 1]),
        clearDepth: 1,
        cull: gl.BACK,
        depth: gl.LEQUAL
      },
      uniforms: {
        uProjection: projMat,
        uView: viewMat,
        uPointLight: [{
          position: [0, 0, 8],
          color: '#ffffff',
          intensity: [0.3, 0.7, 0.5, 0.00015]
        }]
      },
      passes: [{
        shader: shader,
        geometry: box,
        uniforms: {
          uModel: model1Mat,
          uNormal: model1Normal,
          uMaterial: {
            ambient: '#ffffff',
            diffuse: '#ffffff',
            specular: '#555555',
            shininess: 30
          },
          uTexture: texture
        }
      }]
    });
  };
}
