import loadOBJ from 'webglue/loader/obj';

export default function multiMaterial(renderer) {
  console.log(loadOBJ(require('../geom/pencil.obj'), true));
  return () => {};
}
