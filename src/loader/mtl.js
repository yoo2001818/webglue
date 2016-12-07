// Parses MTL file to material objects. However webglue doesn't include phong
// shader, so user needs to create their shader on their own. So,
// only material options will be returned, not material itself.
export default function loadMTL(data) {
  let materials = {};
  let currentMaterial = null;
  function finalizeMaterial() {
    if (currentMaterial != null) {
      materials[currentMaterial.name] = currentMaterial;
    }
    currentMaterial = {};
  }
  function parseColor(args) {
    if (args[0] === 'spectral') {
      throw new Error('Spectral curve is not supported');
    }
    if (args[0] === 'xyz') {
      // TODO Implement CIE 1931 support
      throw new Error('CIE 1931 XYZ color space is not supported yet');
    }
    // Is wrapping to Float32Array really necessary?
    return new Float32Array(args.map(parseFloat));
  }
  function parseTexture(args) {
    // TODO Arguments are not supported yet.
    return args.join(' ');
  }

  // Parser logic starts here.
  let lines = data.split('\n');
  for (let i = 0; i < lines.length; ++i) {
    let line = lines[i].trim();
    // If the line starts with #, this line is a comment - skip the line.
    if (line[0] === '#') continue;
    // Parse the command and the rest.
    let [command, ...args] = line.split(' ');
    switch (command) {
    // Material name
    case 'newmtl':
      // Start a new material.
      finalizeMaterial();
      currentMaterial.name = args.join(' ');
      break;
    // Material color and illumination
    case 'Ka':
      // Ambient reflectivity.
      currentMaterial.ambient = parseColor(args);
      break;
    case 'Kd':
      // Diffuse reflectivity.
      currentMaterial.diffuse = parseColor(args);
      break;
    case 'Ks':
      // Specular reflectivity.
      currentMaterial.specular = parseColor(args);
      break;
    case 'Ke':
      // Emission reflectivity.
      currentMaterial.emission = parseColor(args);
      break;
    case 'Tf':
      // Transmission filter. Not implemented (yet).
      currentMaterial.transmission = parseColor(args);
      break;
    case 'illum':
      // Illumination model.
      // 0: Only use diffuse. color = Kd
      // 1: Diffuse illum model. color = KaIa + KdId
      // 2: Diffuse specular illum model (Phong).
      //    color = KaIa + KdId + KsIs
      // 3: Phong model with reflection. color = KaIa + KdId + Ks(Is+Ir)
      //    where Ir = (intensity of reflection map) + (ray trace)
      // 4: Glass model (same as 3, but with strong specular value)
      // 5: same as 3, but with Fresnel reflection.
      // 6: Phong model with refraction. color = KaIa + KdId + Ks(Is+Ir) +
      //    (1.0 - Ks) TfIt
      // 7: same as 6, but with Fresnel effect.
      // 8: same as 3, but without ray tracing.
      // 9: same as 4, but without ray tracing.
      // 10: Cast shadow on invisible surface. color = Pixel color.
      currentMaterial.model = parseInt(args[0]);
      break;
    case 'd':
      // Dissolve factor. Not implemented yet.
      // -halo should be implemented too.
      if (args[0] === '-halo') {
        currentMaterial.dissolveHalo = true;
      }
      currentMaterial.dissolve = parseFloat(args[args.length - 1]);
      break;
    case 'Ns':
      // Specular exponent.
      currentMaterial.shininess = parseFloat(args[0]);
      break;
    case 'sharpness':
      // Reflection sharpness. Not implemented yet.
      currentMaterial.sharpness = parseFloat(args[0]);
      break;
    case 'Ni':
      // Optical density. Not implemented.
      currentMaterial.density = parseFloat(args[0]);
      break;
    // Material texture
    case 'map_Ka':
      currentMaterial.ambientMap = parseTexture(args);
      break;
    case 'map_Kd':
      currentMaterial.diffuseMap = parseTexture(args);
      break;
    case 'map_Ks':
      currentMaterial.specularMap = parseTexture(args);
      break;
    case 'map_Ns':
      currentMaterial.shininessMap = parseTexture(args);
      break;
    case 'map_Ke':
      // Emission map; This is not in MTL spec but Blender uses it.
      currentMaterial.emissionMap = parseTexture(args);
      break;
    case 'map_d':
      // Dissolve map. Not implemented yet.
      currentMaterial.dissolveMap = parseTexture(args);
      break;
    case 'map_aat':
      // Selectively enable anti-aliasing... Which is not possible in OpenGL.
      // Not implemented.
      break;
    case 'decal':
      currentMaterial.decalMap = parseTexture(args);
      break;
    case 'disp':
      currentMaterial.displacementMap = parseTexture(args);
      break;
    case 'bump':
    case 'map_Bump':
      // Is this bump map or normal map?
      currentMaterial.normalMap = parseTexture(args);
      break;
    case 'refl':
      // TODO This does not comply with MTL specification
      currentMaterial.reflectionMap = parseTexture(args);
      break;
    }
  }
  finalizeMaterial();
  return materials;
}
