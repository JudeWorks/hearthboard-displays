import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRelease, sha256 } from './release-lib.mjs';
const root = resolve(fileURLToPath(new URL('..',import.meta.url)));
const allowed = new Set(['src','public','scripts','.github','astro.config.mjs','package.json','package-lock.json','wrangler.jsonc','.gitignore','.node-version','README.md','PUBLISHING.md','THIRD_PARTY_NOTICES.md','LICENSE']);
const excluded = new Set(['node_modules','dist','.astro','.git','.wrangler','.DS_Store']);
const forbidden = /\.(?:swift|kt|java|c|h|keystore|jks|pem|key|env|apk)$/i;
const secretPatterns = [/gh[pousr]_[A-Za-z0-9]{30,}/,/github_pat_[A-Za-z0-9_]{30,}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\/Users\/[^/]+\//,/100\.70\.115\.58/,/tail010b2c/];
let count=0;
async function walk(directory) {
 for(const entry of await readdir(directory,{withFileTypes:true})) {
  if(excluded.has(entry.name))continue;
  if(entry.isSymbolicLink())throw new Error('Symlinks are not allowed in the public source');
  const path=resolve(directory,entry.name), name=relative(root,path);
  if(directory===root&&!allowed.has(entry.name))throw new Error(`Unexpected root file or folder: ${name}`);
  if(entry.isDirectory()){await walk(path);continue;}
  if(forbidden.test(entry.name)||entry.name.startsWith('.env'))throw new Error(`Private source or credentials must not be published: ${name}`);
  const size=(await stat(path)).size;
  if(size>25*1024*1024)throw new Error(`Cloudflare Pages asset exceeds 25 MiB: ${name}`);
  if(!['.png','.jpg','.webp','.woff2','.bin','.ico'].includes(extname(path))) {
   const text=await readFile(path,'utf8');
   // This validator contains the pattern definitions themselves, rather than credentials.
   if(name!=='scripts/validate.mjs')for(const pattern of secretPatterns)if(pattern.test(text))throw new Error(`Private material detected: ${name}`);
  }
  count++;
 }
}
await walk(root);
const catalog=JSON.parse(await readFile(resolve(root,'src/data/releases.json'),'utf8'));
if(catalog.repository!=='JudeWorks/hearthboard-displays')throw new Error('Unexpected release repository');
for(const product of ['ink','frame'])if(catalog[product]){
 const release=catalog[product];validateRelease(product,release);
 if(product==='ink') {
  const manifest=JSON.parse(await readFile(resolve(root,'public',release.manifestPath.slice(1)),'utf8'));
  if(manifest.builds.length!==1||manifest.builds[0].chipFamily!=='ESP32-S3')throw new Error('Incorrect installer target');
  const part=manifest.builds[0].parts[0];
  if(part.offset!==0||!/^hearthboard-ink-[a-zA-Z0-9.-]+-ee04\.bin$/.test(part.path))throw new Error('Incorrect image path');
  const image=await readFile(new URL(part.path,new URL(`file://${resolve(root,'public',release.manifestPath.slice(1))}`)));
  if(sha256(image)!==release.sha256||image.length!==release.size)throw new Error('Installer image checksum mismatch');
 }
}
console.log(`Public-source boundary and release metadata verified (${count} files).`);
