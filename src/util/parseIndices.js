export default function parseIndices(indices, attributes = null) {
  if (Array.isArray(indices)) {
    let array = indices;
    if (Array.isArray(indices[0])) {
      // Flatten it.....
      array = [];
      // What the heck
      indices.forEach(v => v.forEach(v2 => array.push(v2)));
    }
    // Check indices boundary
    // TODO We need to split the indices if the device doesn't support
    // OES_element_index_uint
    let bits = 8;
    if (attributes != null) {
      if (attributes.length >= 65536) return new Uint32Array(array);
      if (attributes.length >= 256) return new Uint16Array(array);
      return new Uint8Array(array);
    }
    array.forEach(v => {
      if (v >= 65536 && bits < 32) bits = 32;
      if (v >= 256 && bits < 16) bits = 16;
    });
    switch (bits) {
    case 8: return new Uint8Array(array);
    case 16: return new Uint16Array(array);
    case 32: return new Uint32Array(array);
    }
  }
  return indices;
}
