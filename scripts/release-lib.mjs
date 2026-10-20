import { createHash } from 'node:crypto';
export const REPOSITORY = 'JudeWorks/hearthboard-displays';
export const TEST_UPDATE_KEY = 'd04ab232742bb4ab3a1368bd4615e4e6d0224ab71a016baf8520a332c9778737';
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export function validateRelease(product, release) {
 if (!['ink','frame'].includes(product)) throw new Error('Unknown product');
 if (!release || typeof release !== 'object') throw new Error('A release object is required');
 if (!/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(release.version)) throw new Error('Use a three-part release version');
 if (!['stable','beta'].includes(release.channel)) throw new Error('Invalid release channel');
 if (!/^\d{4}-\d{2}-\d{2}$/.test(release.date) || Number.isNaN(Date.parse(release.date))) throw new Error('Invalid release date');
 if (!/^[a-f0-9]{64}$/.test(release.sha256)) throw new Error('Invalid SHA-256');
 if (!Number.isSafeInteger(release.size) || release.size <= 0 || release.size >= 2 * 1024 ** 3) throw new Error('Invalid release file size');
 if (!/^[a-f0-9]{40}$/.test(release.sourceCommit)) throw new Error('A full private source commit is required');
 if (typeof release.notes !== 'string' || release.notes.trim().length < 20) throw new Error('Release notes are required');
 const tag = `${product}-v${release.version}`;
 const filename = product === 'ink' ? `hearthboard-ink-${release.version}-ee04.bin` : `hearthboard-frame-${release.version}.apk`;
 const expected = `https://github.com/${REPOSITORY}/releases/download/${tag}/${filename}`;
 if (release.downloadURL !== expected) throw new Error('Download must identify the versioned asset in the public repository');
 if (product === 'ink') {
  if (release.board !== 'seeed-ee04') throw new Error('Only the verified EE04 hardware target is supported');
  if (release.size > 4.1 * 1024 ** 2) throw new Error('Ink image exceeds the current factory application layout');
  if (release.manifestPath !== `/firmware/${tag}/manifest.json`) throw new Error('Invalid Ink manifest path');
 } else {
  if (!Number.isSafeInteger(release.versionCode) || release.versionCode < 1) throw new Error('Android versionCode is required');
  if (!Number.isSafeInteger(release.minSdk) || release.minSdk < 23) throw new Error('Android minSdk must be at least 23');
 }
 return { tag, filename };
}
export function inkManifest(release) {
 validateRelease('ink',release);
 return { name:'Hearthboard Ink · Seeed EE04',version:release.version,new_install_prompt_erase:true,new_install_improv_wait_time:0,builds:[{chipFamily:'ESP32-S3',parts:[{path:`hearthboard-ink-${release.version}-ee04.bin`,offset:0}]}] };
}
export function validateInkImage(bytes) {
 if (bytes.length < 0x10000 + 24 || bytes[0] !== 0xe9 || bytes[0x10000] !== 0xe9) throw new Error('Ink needs a merged image with bootloader at 0 and app at 0x10000');
 if (bytes.readUInt16LE(12) !== 9 || bytes.readUInt16LE(0x10000 + 12) !== 9) throw new Error('The image must target ESP32-S3');
 if (bytes[0x8000] !== 0xaa || bytes[0x8001] !== 0x50) throw new Error('Partition table must be at 0x8000');
}
