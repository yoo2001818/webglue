import loadCollada from 'webglue/loader/collada';

export default function collada() {
  let data = loadCollada(require('../geom/cat.dae'));
  return () => {};
}
