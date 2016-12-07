export default function bakeMesh(geometry, materials) {
  if (geometry == null) return false;
  if (Array.isArray(geometry)) {
    return geometry.map(v => bakeMesh(v, materials));
  } else {
    let material = materials[
      (geometry.metadata && geometry.metadata.material) || 'default'
    ];
    if (material == null) return false;
    return Object.assign({ geometry }, material);
  }
}
