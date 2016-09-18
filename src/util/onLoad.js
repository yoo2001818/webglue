import { isSource, isLoaded } from '../renderer/texture';

export default function onLoad(texture, callback) {
  let count = 0;
  function checkLoad(entry) {
    if (isLoaded(entry)) return;
    if (isSource(entry)) {
      count ++;
      entry.addEventListener('load', () => {
        count --;
        if (count === 0) callback();
      });
    }
  }
  function checkTexture(entry) {
    let { source } = entry.options;
    if (Array.isArray(source)) {
      source.forEach(checkLoad);
    } else {
      checkLoad(source);
    }
  }
  if (Array.isArray(texture)) {
    texture.forEach(checkTexture);
  } else {
    checkTexture(texture);
  }
  if (count === 0) callback();
}
