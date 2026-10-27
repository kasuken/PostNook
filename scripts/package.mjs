import { createWriteStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { ZipArchive } from 'archiver';
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
await mkdir('artifacts', { recursive: true });
const checksums = [];
for (const browser of ['chrome', 'edge']) {
  const filename = `postnook-${version}-${browser}.zip`;
  await new Promise((resolve, reject) => {
    const output = createWriteStream(`artifacts/${filename}`);
    const zip = new ZipArchive({ zlib: { level: 9 } });
    output.on('close', resolve);
    output.on('error', reject);
    zip.on('error', reject);
    zip.pipe(output);
    zip.directory('dist/', false);
    void zip.finalize();
  });
  checksums.push(
    `${createHash('sha256')
      .update(await readFile(`artifacts/${filename}`))
      .digest('hex')}  ${filename}`,
  );
}
await writeFile('artifacts/SHA256SUMS.txt', checksums.join('\n') + '\n');
console.log('Chrome and Edge packages and SHA-256 checksums created in artifacts/.');
