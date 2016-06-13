// Converts intermediate MTL tree to actual Material data.

import PhongMaterial from './phongMaterial';
import ConstantMaterial from './constantMaterial';

function calcAmbient(ambient, diffuse) {
  let output = new Float32Array(3);
  output[0] = ambient[0] * diffuse[0];
  output[1] = ambient[1] * diffuse[1];
  output[2] = ambient[2] * diffuse[2];
  return output;
}

function processPhong(options) {
  let output = Object.assign({}, options);
  output.ambient = calcAmbient(options.ambient, options.diffuse);
  if (options.diffuseMap) output.diffuse = new Float32Array([1, 1, 1]);
  return output;
}

export default function processMTL(mtl) {
  let output = {};
  for (let key in mtl) {
    let options = mtl[key];
    console.log(options);
    switch (options.model) {
    case 0:
      output[key] = new ConstantMaterial(processPhong(options));
      break;
    case 1:
      // Just disable specular map. :P
      output[key] = new PhongMaterial(Object.assign({}, processPhong(options), {
        specularMap: null,
        specular: new Float32Array([0, 0, 0])
      }));
      break;
    case 2:
    default:
      // Other illum models are not implemented yet... Just use phong material.
      output[key] = new PhongMaterial(processPhong(options));
      break;
    }
    console.log(output[key]);
  }
  return output;
}
