const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('⚡ Compiling TypeScript with tsc...');
execSync('yarn tsc', { stdio: 'inherit' });

const filesToCopy = ['components.js', 'mintlify-components.js', 'command-palette.js'];
filesToCopy.forEach(file => {
  const distPath = path.join(__dirname, '..', 'dist', file);
  if (fs.existsSync(distPath)) {
    let content = fs.readFileSync(distPath, 'utf8');
    // Strip ES module imports/exports for classic browser script compatibility
    content = content.replace(/^import\s+.*?from\s+['"].*?['"];?\r?\n/gm, '');
    content = content.replace(/^export\s+(async\s+)?(function|class|const|let|var)\s+/gm, '$1$2 ');
    content = content.replace(/^export\s*\{[^}]*\};?\r?\n/gm, '');
    const outPath = path.join(__dirname, '..', file);
    fs.writeFileSync(outPath, content, 'utf8');
    console.log(`✅ Emitted root bundle: ${file}`);
  }
});
