const esbuild = require('esbuild');
const glob = require('glob');
const path = require('path');

const isWatch = process.argv.includes('--watch');

// Find all JavaScript entry points in src/scripts/
const entryPoints = glob.sync('src/scripts/**/*.js');

// If no entry points, exit gracefully
if (entryPoints.length === 0) {
  console.log('📦 No JavaScript files found in src/scripts/ - skipping JS build');
  process.exit(0);
}

const buildOptions = {
  entryPoints,
  bundle: true,
  minify: process.env.NODE_ENV === 'production',
  sourcemap: process.env.NODE_ENV !== 'production',
  outdir: 'assets',
  // Generate .min.js files to match gitignore pattern
  outExtension: { '.js': '.min.js' },
  // Use the filename without path as the output name
  entryNames: '[name]',
  target: ['es2020'],
  format: 'iife',
  logLevel: 'info',
};

async function build() {
  try {
    if (isWatch) {
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      console.log('👀 Watching for changes in src/scripts/...');
    } else {
      await esbuild.build(buildOptions);
      console.log('✅ JavaScript build complete');
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();

