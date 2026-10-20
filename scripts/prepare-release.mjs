// Stages selected, verified binary assets. Never reads or copies an app source tree.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { copyFile } from 'node:fs/promises';
import { validateRelease, validateInkImage, inkManifest, sha256, TEST_UPDATE_KEY, REPOSITORY } from './release-lib.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)),'..');
const flags = Object.fromEntries(process.argv.slice(2).reduce((pairs,item,index,all)=>{if(index%2===0)pairs.push([item.replace(/^--/,''),all[index+1]]);return pairs;},[]));
const required = ['product','version','file','source-commit','notes-file','notices-file','verification'];
for (const key of required) if(!flags[key]) throw new Error(`Required: --${key}`);
if(flags.verification !== 'passed') throw new Error('Use --verification passed only after completing the release checklist');
const product=flags.product;
const bytes=await readFile(resolve(flags.file));
if(product==='ink') validateInkImage(bytes);
if(product==='frame') {
 if(bytes.readUInt32LE(0)!==0x04034b50)throw new Error('Frame requires an APK zip file');
 if(!flags.aapt || !flags.apksigner)throw new Error('Provide --aapt and --apksigner from Android build-tools');
 execFileSync(resolve(flags.apksigner),['verify','--verbose',resolve(flags.file)],{stdio:'pipe'});
 const info=execFileSync(resolve(flags.aapt),['dump','badging',resolve(flags.file)],{encoding:'utf8'});
 const pkg=info.match(/package: name='([^']+)' versionCode='(\d+)'/);
 if(!pkg || pkg[1]!=='com.judeworks.hearthboard')throw new Error('APK must use the public release package, not the debug package');
 flags['version-code']=pkg[2];
 flags['min-sdk']=info.match(/sdkVersion:'(\d+)'/)?.[1];
 if(/application-debuggable/.test(info))throw new Error('Debuggable APKs cannot be published');
 const dex=execFileSync('unzip',['-p',resolve(flags.file),'classes*.dex'],{maxBuffer:128*1024*1024});
 if(dex.includes(Buffer.from(TEST_UPDATE_KEY)))throw new Error('APK still contains the public test update key. Replace it in the private app source before releasing');
}
const notes=await readFile(resolve(flags['notes-file']),'utf8');
const release={version:flags.version,channel:flags.channel||'beta',date:new Date().toISOString().slice(0,10),sha256:sha256(bytes),size:bytes.length,sourceCommit:flags['source-commit'],notes:notes.trim(),downloadURL:`https://github.com/${REPOSITORY}/releases/download/${product}-v${flags.version}/hearthboard-${product}-${flags.version}${product==='ink'?'-ee04.bin':'.apk'}`,...(product==='ink'?{board:'seeed-ee04',manifestPath:`/firmware/ink-v${flags.version}/manifest.json`}:{versionCode:Number(flags['version-code']),minSdk:Number(flags['min-sdk'])})};
const {tag,filename}=validateRelease(product,release);
const catalogPath=join(root,'src/data/releases.json');
const catalog=JSON.parse(await readFile(catalogPath,'utf8'));
if(product==='frame' && catalog.frame && release.versionCode <= catalog.frame.versionCode)throw new Error('Android versionCode must increase');
// Export to an operator-selected directory outside this checkout.
if(!flags.output)throw new Error('Provide --output pointing outside the public repository');
const output=resolve(flags.output);
if(output===root || output.startsWith(root+'/'))throw new Error('Release output must be outside the repository');
await mkdir(output,{recursive:true});
await writeFile(join(output,filename),bytes,{flag:'wx'});
await copyFile(resolve(flags['notices-file']),join(output,'THIRD_PARTY_NOTICES.txt'));
await writeFile(join(output,'SHA256SUMS'),`${release.sha256}  ${filename}\n`);
await writeFile(join(output,'RELEASE_NOTES.md'),notes);
if(product==='ink') {
 const target=join(root,'public/firmware',tag);
 await mkdir(target,{recursive:true});
 await writeFile(join(target,filename),bytes,{flag:'wx'});
 await writeFile(join(target,'manifest.json'),JSON.stringify(inkManifest(release),null,2)+'\n');
}
catalog[product]=release;
await writeFile(catalogPath,JSON.stringify(catalog,null,2)+'\n');
console.log(`Staged ${tag}. Assets: ${output}`);
console.log('Run npm run check, npm test, and npm run build. Then upload only the named binary, SHA256SUMS, and THIRD_PARTY_NOTICES.txt to its GitHub release, with RELEASE_NOTES.md as the body. Publish the site only after the GitHub asset is live.');
