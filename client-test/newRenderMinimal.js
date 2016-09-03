import Renderer from 'webglue/renderer';
import calcNormals from 'webglue/geom/calcNormals';
import geomBox from 'webglue/geom/box';
import geomQuad from 'webglue/geom/quad';
import { mat3, mat4 } from 'gl-matrix';

let canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.width = 800;
canvas.height = 600;
let gl = canvas.getContext('webgl', { antialias: false }) ||
  canvas.getContext('experimental-webgl');

let renderer = new Renderer(gl);

// Init basic textures and geometries
/*let texture = renderer.textures.create({
  source: require('./texture/1.jpg')
});*/
let texture2 = renderer.textures.create({
  source: require('./texture/2.png')
});
let skybox = renderer.textures.create({
  source: [
    require('./texture/stormyday/front.jpg'),
    require('./texture/stormyday/back.jpg'),
    require('./texture/stormyday/up.jpg'),
    require('./texture/stormyday/down.jpg'),
    require('./texture/stormyday/right.jpg'),
    require('./texture/stormyday/left.jpg')
  ]
});
// Framebuffer test
let outputTex = renderer.textures.create({
  width: 32,
  height: 32,
  params: {
    magFilter: gl.NEAREST,
    minFilter: gl.NEAREST,
    mipmap: false
  }
});
let framebuffer = renderer.framebuffers.create({
  color: outputTex, // TODO How do we specify the target of cubemap?
  depth: gl.DEPTH_COMPONENT16 // Automatically use renderbuffer
});

// Or
/* let framebuffer = render.framebuffers.create({
  width: 256,
  height: 256
}); */

// We'd need specifiying 'capability', but we'll do that later.
let shader = renderer.shaders.create(
  require('./shader/texCoordTest.vert'),
  require('./shader/texCoordTest.frag')
);
let screenShader = renderer.shaders.create(
  require('./shader/screen.vert'),
  require('./shader/noise.frag')
);
let skyboxShader = renderer.shaders.create(
  require('./shader/skybox.vert'),
  require('./shader/skybox.frag')
);

function range(v) {
  let out = [];
  for (let i = 0; i < v; ++i) out.push(i);
  return out;
}

let box = renderer.geometries.create(calcNormals(geomBox()));
let quad = renderer.geometries.create(geomQuad());

// Test instancing data...
let instancedData = renderer.geometries.create({
  attributes: {
    aInstPos: range(100).map(() => [
      Math.random() * 50 - 25, Math.random() * 50 - 25, Math.random() * 50 - 25
    ])
  },
  instanced: {
    aInstPos: 1
  }
});
let boxes = renderer.geometries.create([box, instancedData]);

let projMat = mat4.create();
mat4.perspective(projMat, Math.PI / 180 * 70, 800/600, 0.1, 60);
let viewMat = mat4.create();
mat4.translate(viewMat, viewMat, new Float32Array([0, 0, -5]));

let model1Mat = mat4.create();
let model2Mat = mat4.create();
let uvMat = mat4.create();

mat4.translate(model2Mat, model2Mat, new Float32Array([0, 2, 2]));
mat4.translate(model1Mat, model1Mat, new Float32Array([0, 0, 1]));

let model1Normal = mat3.create();
let model2Normal = mat3.create();
mat3.normalFromMat4(model2Normal, model2Mat);

mat4.translate(uvMat, uvMat, new Float32Array([0, 0, 2]));

let prevTime = -1;
let timer = 0;
let step = 0;

function animate(time) {
  if (prevTime === -1) prevTime = time;
  let delta = time - prevTime;
  prevTime = time;
  timer += delta / 1000;
  step ++;
  mat4.rotateY(viewMat, viewMat, Math.PI / 120);
  mat4.rotateY(model1Mat, model1Mat, Math.PI / 60);
  mat3.normalFromMat4(model1Normal, model1Mat);
  mat4.identity(uvMat);
  mat4.translate(uvMat, uvMat, new Float32Array([
    Math.cos(timer * 5), Math.sin(timer * 5),
    Math.cos(timer) * 2 + 1]));
  // And provide sample data
  /*
    The following code will happen if we support JSX.

    renderer.render(<Pass uniforms={camera.getUniforms()}>
      <Options clearColor='#f000' clearDepth={1} cull='back' depth='lequal' />
      <Pass shader={shader} uniforms={material} geometry={geometry}>
        <Pass uniforms={model1} draw />
        <Pass uniforms={model2} draw />
      </Pass>
    </Pass>)
  */
  let worldScene = {
    options: {
      clearColor: new Float32Array([0, 0, 0, 1]),
      clearDepth: 1,
      cull: gl.BACK,
      depth: gl.LEQUAL
    },
    uniforms: {
      uProjection: projMat,
      uView: viewMat
    },
    passes: [{
      shader: shader,
      uniforms: {
        uMaterial: {
          ambient: '#ffffff',
          diffuse: '#ffffff',
          specular: '#ffffff',
          shininess: 30
        },
        uPointLight: [{
          position: [0, 0, 5],
          color: '#ffffff',
          intensity: [0.3, 0.7, 0.5, 0.00015]
        }]
      },
      geometry: boxes,
      passes: [{
        uniforms: {
          uTexture: outputTex,
          uModel: model1Mat,
          uNormal: model1Normal
        }
      }, {
        uniforms: {
          uTexture: texture2,
          uModel: model2Mat,
          uNormal: model2Normal
        }
      }]
    }, {
      options: {
        cull: gl.FRONT
      },
      shader: skyboxShader,
      geometry: box,
      uniforms: {
        uSkybox: skybox
      }
    }]
  };
  renderer.render([{
    options: {
      clearColor: new Float32Array([0, 0, 0, 1])
    },
    framebuffer: framebuffer,
    shader: screenShader,
    geometry: quad,
    uniforms: {
      uStep: step
    }
  }, {
    passes: [worldScene]
  }]);
  window.requestAnimationFrame(animate);
}

window.requestAnimationFrame(animate);
