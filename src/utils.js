import Papa from 'papaparse';

/**
 * 
 * @param {any} file 
 * @param {Papa.ParseLocalConfig<any,any>} config 
 */
export function PapaPromise(file, config) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      ...config,
      complete: (result) => {
        resolve(result);
      },
      error: (err) => {
        reject(err);
      },
    });
  });
}

/**
 * オブジェクトを取得する。デフォルト値あり。
 * @param {object} o 
 * @param {string} path 
 * @param {*} def 
 * @returns 
 */
export function deepGet(o, path, def=null) {
  return path.split('.').reduce((pre, cur) => {
    if(typeof pre === 'undefined') return def;
    if(pre === null) return pre;
    if(typeof pre === 'object' && cur in pre) return pre[cur];
    return def;
  }, o);
}