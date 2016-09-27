import { isSource, isLoaded } from '../renderer/texture';

export default function onLoad(object, callback) {
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
  function checkObj(entry) {
    // Texture check
    let { source } = entry.options;
    if (Array.isArray(source)) {
      source.forEach(checkLoad);
    } else if (source != null) {
      checkLoad(source);
    }
    // Geometry check
    if (typeof entry.options.then === 'function') {
      count ++;
      entry.options.then(() => {
        count --;
        if (count === 0) callback();
      });
    }
  }
  if (Array.isArray(object)) {
    object.forEach(checkObj);
  } else {
    checkObj(object);
  }
  if (count === 0) callback();
}
