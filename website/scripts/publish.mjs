import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const target={project:process.env.RAILWAY_PROJECT_ID,service:process.env.RAILWAY_SERVICE_ID,url:process.env.RAILWAY_PUBLIC_URL};
if(!target.project||!target.service||!target.url)throw Error('Set RAILWAY_PROJECT_ID, RAILWAY_SERVICE_ID and RAILWAY_PUBLIC_URL.');
function run(command,args){const r=spawnSync(command,args,{cwd:root,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
run(process.execPath,['scripts/prepare-release.mjs',...process.argv.slice(2)]);
run('railway',['up','--ci','--project',target.project,'--service',target.service,'--environment','production','--message','Publish latest doppelgänger release']);
const expected=JSON.parse(readFileSync(root+'releases/latest.json','utf8'));
for(let i=0;i<30;i++){
 try{const live=await fetch(target.url+'/release.json',{cache:'no-store'});const data=await live.json();if(data.sha256===expected.sha256){console.log('Live latest release verified: '+target.url);process.exit(0);}}catch{}
 await new Promise(r=>setTimeout(r,4000));
}
throw Error('Deployment has not served the new release yet; inspect Railway before reporting publication complete.');
