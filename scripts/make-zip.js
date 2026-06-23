const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'esteselzipultimatum.zip');

const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', '.pnpm-cache', '.pnpm-store',
  '.cache', '.upm', '.agents', '.local', 'dist', '.vite',
]);

if (fs.existsSync(OUT)) fs.unlinkSync(OUT);

const output = fs.createWriteStream(OUT);
const archive = archiver('zip', { zlib: { level: 6 } });

output.on('close', () => {
  const mb = (archive.pointer() / 1024 / 1024).toFixed(1);
  console.log(`Done: esteselzipultimatum.zip — ${mb} MB`);
});
archive.on('error', (err) => { throw err; });
archive.on('warning', (err) => { if (err.code !== 'ENOENT') throw err; });

archive.pipe(output);

function addDir(dirPath, zipPrefix) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const zipPath = path.join(zipPrefix, entry.name);

    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      addDir(fullPath, zipPath);
    } else {
      // Skip the output zip itself
      if (fullPath === OUT) continue;
      archive.file(fullPath, { name: zipPath });
    }
  }
}

addDir(ROOT, '');
archive.finalize();
