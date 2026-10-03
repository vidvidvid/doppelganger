const fs=require('fs'),vm=require('vm'),assert=require('assert');
vm.runInThisContext(fs.readFileSync(__dirname+'/doppelganger_core.js','utf8'));
const profiles=JSON.parse(fs.readFileSync(__dirname+'/test_profiles.json'));let checks=0;
function ok(v,m){assert(v,m);checks++;}
for(const sr of [32000,44100,48000,96000])for(const mode of [0,1,2])for(const amount of [0,.6,1])for(const blend of [0,.5,1]){
 const r=design(...profiles,blend,amount,4,mode,0,sr);
 ok(r.coefficients.length===195,'Fixed 39-filter topology');ok(r.dense.every(Number.isFinite),'Finite dense response');
 ok(r.gains.every(g=>Math.abs(g)<=4.00001),'Automatic gain bounds');ok(r.after.percent>=0&&r.after.percent<=100,'Bounded metric');
 if(amount===0)ok(r.dense.every(g=>Math.abs(g)<1e-6),'Zero amount identity');
 for(let j=0;j<r.coefficients.length;j+=5){let a=r.coefficients[j+3],b=r.coefficients[j+4];ok(Math.abs(b)<1&&1+a+b>0&&1-a+b>0,'Stable poles');}
}
for(const q of [.2,1.4,12])for(const gain of [-12,12])for(const sr of [32000,44100,96000]){
 const base=design(...profiles,.5,0,4,2,0,sr),edited=finishDesign(base,profiles[0],[{f:1000,g:gain,q}],sr);
 let c=edited.coefficients.slice(155,160);ok(Math.abs(response(c,1000,sr)-gain)<1e-7,'Manual point center gain');
 ok(edited.dense.every(Number.isFinite),'Finite manual curves');ok(Math.abs(c[4])<1&&1+c[3]+c[4]>0&&1-c[3]+c[4]>0,'Stable manual poles');
 ok(finishDesign(base,profiles[0],[],sr).dense.every(v=>Math.abs(v)<1e-6),'Removing point restores identity');
}
const same=design(profiles[0],profiles[0],profiles[0],.5,1,9,2,0,44100);ok(same.after.percent===100&&same.after.rmse<1e-8,'Identity matches exactly');
const louder={...profiles[0],power:profiles[0].power.map(p=>p*100),rms:profiles[0].rms+20};const lev=design(profiles[0],louder,louder,.5,1,9,2,0,44100);ok(lev.dense.every(v=>Math.abs(v)<1e-6),'Level-independent reference comparison');
let threw=false;try{profile([{rms:0,bands:FREQ.map(()=>0)}],'silence')}catch(e){threw=true}ok(threw,'Silence rejected');
const report={checks,default:design(...profiles,.5,.6,4,0,0,44100)};fs.writeFileSync(__dirname+'/test-results.json',JSON.stringify({checks,before:report.default.before,after:report.default.after},null,2));console.log(JSON.stringify({checks,before:report.default.before,after:report.default.after}));
const sine=Array.from({length:1024},(_,i)=>.5*Math.sin(2*Math.PI*i/64));const mono=stereoStats(sine,sine),anti=stereoStats(sine,sine.map(v=>-v));ok(Math.abs(mono.lr/Math.sqrt(mono.ll*mono.rr)-1)<1e-12,'Mono correlation');ok(mono.side===0,'Mono has no side energy');ok(Math.abs(anti.lr/Math.sqrt(anti.ll*anti.rr)+1)<1e-12,'Antiphase correlation');const met=profile([{rms:.125,bands:FREQ.map(()=>1),stats:mono}],'test').metrics;ok(Math.abs(met.crest-3.0102999566)<1e-8,'Sine crest factor');ok(met.balance===0,'Equal channel balance');console.log('Stereo and transient measurements: synthetic mono/antiphase/sine checks pass.');
