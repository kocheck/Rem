const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const UI_JS_PATH = path.resolve(__dirname, '../dist/ui.js');

console.log('Watching dist/ui.js for changes...');

// Run build-ui.js initially
try {
  execSync('node utils/build-ui.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Initial build failed:', error);
}

// Watch for changes using fs.watchFile for better reliability
fs.watchFile(UI_JS_PATH, { interval: 500 }, (curr, prev) => {
  // Check if modification time changed
  if (curr.mtime !== prev.mtime) {
    console.log('ui.js changed, rebuilding ui.html...');
    try {
      execSync('node utils/build-ui.js', { stdio: 'inherit' });
    } catch (error) {
      console.error('Build failed:', error);
    }
  }
});

console.log('Press Ctrl+C to stop watching...');
