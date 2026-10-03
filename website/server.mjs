import http from 'node:http';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const release=JSON.parse(readFileSync(root+'releases/latest.json','utf8'));
const zip=readFileSync(root+'releases/latest.zip');
const html=readFileSync(root+'dist/index.html','utf8').replaceAll('{{VERSION}}',release.version).replaceAll('{{SIZE}}',`${(release.bytes/1024).toFixed(0)} KB`).replaceAll('{{DATE}}',release.publishedAt.slice(0,10)).replaceAll('{{SHA256}}',release.sha256);
const releaseNotes=readFileSync(root+'dist/CHANGELOG.md');
const guide=readFileSync(root+'dist/guide.html');
const guideImages=new Map(['eq','analysis','dynamics'].map(name=>['/guide-images/'+name+'.jpg',readFileSync(root+'dist/guide-images/'+name+'.jpg')]));
const server=http.createServer((req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
 res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
 res.setHeader('Cache-Control','no-store');
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});return res.end();}
 let pathname;try{pathname=new URL(req.url,'http://localhost').pathname;}catch{res.writeHead(400);return res.end();}
 let body,type;
 if(pathname==='/') {body=html;type='text/html; charset=utf-8';}
 else if(pathname==='/release-notes'){body=releaseNotes;type='text/plain; charset=utf-8';}
 else if(pathname==='/guide'){body=guide;type='text/html; charset=utf-8';}
 else if(guideImages.has(pathname)){body=guideImages.get(pathname);type='image/jpeg';}
 else if(pathname==='/download/latest'){body=zip;type='application/zip';res.setHeader('Content-Disposition',`attachment; filename="doppelganger-${release.version}.zip"; filename*=UTF-8''${encodeURIComponent('doppelgänger-'+release.version+'.zip')}`);res.setHeader('X-Release-SHA256',release.sha256);}
 else if(pathname==='/release.json'){body=JSON.stringify(release);type='application/json';}
 else if(pathname==='/health'){body='ok';type='text/plain';}
 else{res.writeHead(404,{'Content-Type':'text/plain'});return res.end('Not found');}
 res.writeHead(200,{'Content-Type':type,'Content-Length':Buffer.byteLength(body)});res.end(req.method==='HEAD'?undefined:body);
});
server.listen(Number(process.env.PORT)||3088,'0.0.0.0');
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
