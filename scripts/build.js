import * as esbuild from 'esbuild';

(async function() {
  await esbuild.build({
    entryPoints: ['./src/main.js'],
    bundle: true,
    outfile: './dist/main.js',
  })
})();