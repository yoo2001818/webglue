export default function strip(geometry, whitelist) {
  let newAttributes = {};
  whitelist.forEach(key => {
    if (geometry.attributes[key]) newAttributes[key] = geometry.attributes[key];
  });
  return Object.assign({}, geometry, {attributes: newAttributes});
}
