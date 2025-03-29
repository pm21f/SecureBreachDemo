// Use this script to build the API endpoint for Vercel deployment
import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';

// Ensure the dist directory exists
if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist');
}

// Build the API endpoint
async function buildApi() {
  try {
    await build({
      entryPoints: ['./api/index.js'],
      outdir: './dist',
      platform: 'node',
      target: 'node18',
      format: 'esm',
      bundle: true,
      external: ['pg-native'],
    });
    console.log('API endpoint built successfully');
  } catch (error) {
    console.error('Error building API endpoint:', error);
    process.exit(1);
  }
}

buildApi();