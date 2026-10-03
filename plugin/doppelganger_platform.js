// Node-only platform boundary. Keep native filesystem paths out of Max messages.
const fs=require('fs'),os=require('os'),path=require('path');
function environmentValue(env,key){const match=Object.keys(env).find(k=>k.toLowerCase()===key.toLowerCase());return match?env[match]:undefined;}
function libraryRoot(platform=process.platform,env=process.env,home=os.homedir()){
 const p=platform==='win32'?path.win32:path.posix;
 if(platform==='win32')return p.join(environmentValue(env,'APPDATA')||p.join(home,'AppData','Roaming'),'Doppelganger','References');
 if(platform==='darwin')return p.join(home,'Library','Application Support','Doppelganger','References');
 return p.join(env.XDG_DATA_HOME||p.join(home,'.local','share'),'Doppelganger','References');
}
function executableCandidates(platform=process.platform,env=process.env,home=os.homedir()){
 const win=platform==='win32',p=win?path.win32:path.posix,name=win?'ffmpeg.exe':'ffmpeg';
 const candidates=[],add=v=>{if(v)candidates.push(v.replace(/^"(.*)"$/,'$1'));};
 add(environmentValue(env,'DOPPELGANGER_FFMPEG'));
 for(const raw of (environmentValue(env,'PATH')||'').split(win?';':':')){const dir=raw.replace(/^"(.*)"$/,'$1');if(dir&&p.isAbsolute(dir))add(p.join(dir,name));}
 if(win){
  add(p.join(environmentValue(env,'ProgramFiles')||'C:\\Program Files','ffmpeg','bin',name));
  add(p.join(environmentValue(env,'SystemDrive')||'C:','ffmpeg','bin',name));
  add(p.join(environmentValue(env,'ChocolateyInstall')||'C:\\ProgramData\\chocolatey','bin',name));
  add(p.join(home,'scoop','apps','ffmpeg','current','bin',name));
 }else for(const dir of ['/opt/homebrew/bin','/usr/local/bin','/usr/bin'])add(p.join(dir,name));
 return [...new Set(candidates)];
}
function findFFmpeg(options={}){
 const isFile=options.isFile||((p)=>{try{return fs.statSync(p).isFile();}catch{return false;}});
 return executableCandidates(options.platform,options.env,options.home).find(isFile);
}
function toMaxPath(file,platform=process.platform){return platform==='win32'?file.replace(/\\/g,'/'):file;}
function resolveAudioPath(file,platform=process.platform,exists=fs.existsSync){
 if(typeof file!=='string')throw Error('Choose an audio file');
 if(exists(file))return file;
 // Max drive-letter and UNC paths are already valid with forward slashes in Node.
 if(platform==='win32')return file;
 const m=/^([^:]+):\/(.*)$/.exec(file);
 if(m)for(const p of ['/'+m[2],'/Volumes/'+m[1]+'/'+m[2]])if(exists(p))return p;
 return file;
}
module.exports={environmentValue,libraryRoot,executableCandidates,findFFmpeg,toMaxPath,resolveAudioPath};
