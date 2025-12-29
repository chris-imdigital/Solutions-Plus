/**
 * esbuild Configuration for Custom Scripts
 * Compiles custom JavaScript files from src/scripts/ to assets/
 */

const esbuild = require('esbuild');
const { globSync } = require('glob');
const path = require('path');

// Get all JS files from src/scripts
const entryPoints = globSync('src/scripts/**/*.js');

// Check if running in watch mode
const isWatch = process.argv.includes('--watch');

// If no entry points, exit gracefully
if (entryPoints.length === 0) {
  console.log('📦 No JavaScript files found in src/scripts/ - skipping JS build');
  process.exit(0);
}

// Common build options
const buildOptions = {
  entryPoints,
  outdir: 'assets',
  bundle: true,
  minify: process.env.NODE_ENV === 'production',
  sourcemap: process.env.NODE_ENV !== 'production',
  target: ['es2020'],
  format: 'iife',
  outExtension: { '.js': '.min.js' }, // Output as .min.js
  logLevel: 'info',
};

async function build() {
  try {
    if (isWatch) {
      // Watch mode for development
      console.log('🔍 Watching for changes in src/scripts/...\n');
      
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      
      console.log('✅ esbuild is watching for changes');
    } else {
      // Single build for production
      console.log('📦 Building JavaScript files...\n');
      
      await esbuild.build(buildOptions);
      
      console.log('\n✅ JavaScript build complete!');
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
