import DiskCache from './utils/DiskCache';
import MemoryCache from './utils/MemoryCache';

const cacheName = 'classnames';

function getCache(options) {
  if (options.cacheDir) {
    return new DiskCache(cacheName, options);
  }

  return new MemoryCache(cacheName);
}

export function clearCache(options) {
  getCache(options).clear();
}

export default function compressClassName(className, options) {
  const cache = getCache(options);

  return cache.fetch(className, (keys) => {
    return '_' + keys.length.toString(36).split('').reverse().join('');
  });
}
