import {readFileSync,writeFileSync,mkdirSync,renameSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const base=fileURLToPath(new URL('../',import.meta.url));
const source=process.argv[2]||fileURLToPath(new URL('../../doppelgänger-share.zip',import.meta.url));
const version=process.argv[3]||'0.2';
if(!/^\d+\.\d+(?:\.\d+)?(?:-[a-z0-9.-]+)?$/.test(version))throw Error('Invalid release version');
const check=spawnSync('python3',['-c',`import zipfile,sys
with zipfile.ZipFile(sys.argv[1]) as z:
 assert z.testzip() is None
 assert 'doppelgänger/doppelgänger.amxd' in z.namelist()
 for n in z.namelist():
  assert not n.startswith('/') and '..' not in n.split('/')
  assert not n.lower().endswith(('.wav','.mp3','.aif','.aiff','.als'))
  for bad in [b'/Users/', b'/home/', b'sessionMigration']:
   assert bad not in z.read(n),(n,bad)
`,source],{encoding:'utf8'});
if(check.status!==0)throw Error(check.stderr||'Release validation failed');
const zip=readFileSync(source),sha256=createHash('sha256').update(zip).digest('hex');
mkdirSync(base+'releases',{recursive:true});
let previous;try{previous=JSON.parse(readFileSync(base+'releases/latest.json','utf8'));}catch{}
const publishedAt=previous?.sha256===sha256?previous.publishedAt:new Date().toISOString();
writeFileSync(base+'releases/latest.zip.tmp',zip);renameSync(base+'releases/latest.zip.tmp',base+'releases/latest.zip');
writeFileSync(base+'releases/latest.json',JSON.stringify({version,publishedAt,bytes:zip.length,sha256,download:'/download/latest'},null,2)+'\n');
console.log(`Prepared v${version}: ${zip.length} bytes, SHA256 ${sha256}`);
