const fs=require('fs'),vm=require('vm'),assert=require('assert');
function Task(fn,ctx){this.fn=()=>fn.call(ctx);this.schedule=this.cancel=this.repeat=()=>{};}
const events=[];let route;
const c=vm.createContext({Task,Math,JSON,Date,isFinite,jsarguments:['engine','one-source','a','b','l','r'],arrayfromargs:a=>Array.from(a),notifyclients(){},outlet(p,...args){events.push([p,...args]);if(p===2)route=args[0];},patcher:{getnamed(){return{message(){}};}}});
c.include=n=>vm.runInContext(fs.readFileSync(__dirname+'/'+n,'utf8'),c);c.include('doppelganger_engine.js');
const profile={name:'reference',power:Array(61).fill(1),rms:-18};c.profiles[1]=profile;c.cfg.mode=2;c.update();assert.equal(c.sourceState.mode,0);
c.learnstart();assert(c.learnTicket);assert.equal(route,1);const id=c.learnTicket;
function event(kind,value,owner='sender'){c.learnevent(JSON.stringify({id,owner,kind,value}));}
event('started',0);event('progress',.5);assert.equal(c.sourceState.progress,.5);event('result',profile);assert.equal(route,2);assert.equal(c.sourceState.phase,'held');assert(!c.profiles[0].filePath);
const saved=c.getvalueof();c.sourcemode(1);assert(c.regions.every(x=>x===0));assert.equal(route,1);c.setvalueof(saved);assert.equal(c.sourceState.mode,0);assert.equal(route,2);
c.learnstart();c.learncancel();assert.equal(route,2,'Cancel resumes held processing');
c.sourcemode(1);c.learnstart();let master=c.learnTicket;c.learnevent(JSON.stringify({id:master,owner:'a',kind:'started',value:0}));c.learnevent(JSON.stringify({id:master,owner:'b',kind:'started',value:0}));assert.equal(c.sourceState.phase,'error');assert(/More than one/.test(c.sourceState.message));
c.learnstart();c.learnTimeout.fn();assert.equal(c.sourceState.phase,'error');assert(!c.learnTicket);
c.setvalueof(JSON.stringify({profiles:[profile,profile,profile]}));assert.equal(c.sourceState.mode,2,'Legacy sets restore file mode');
// Run the actual capture analyzer against generated stereo audio, including silence/short captures.
let messages=[],signal=true;const cc=vm.createContext({Task,Math,JSON,Date,isFinite,jsarguments:['capture','buffer','sender'],outlet(p,...a){if(p===2)messages.push(JSON.parse(a[1]));},Buffer:function(){this.framecount=()=>882000;this.peek=(ch,pos,n)=>Array.from({length:n},(_,i)=>signal?.2*Math.sin(2*Math.PI*440*(pos+i)/44100):0);}});cc.include=n=>vm.runInContext(fs.readFileSync(__dirname+'/'+n,'utf8'),cc);cc.include('doppelganger_capture.js');cc.request('test');cc.progress(.2);cc.hold('test');for(let i=0;i<64;i++)cc.scanStep();assert.equal(messages.at(-1).kind,'result');assert(messages.at(-1).value.power.every(x=>Number.isFinite(x)&&x>0));
cc.request('short');cc.hold('short');assert.equal(messages.at(-1).kind,'error');signal=false;cc.request('silence');cc.progress(.2);cc.hold('silence');for(let i=0;i<64;i++)cc.scanStep();assert.equal(messages.at(-1).kind,'error');
console.log('PASS live capture, Hold/cancel, save/restore, legacy migration, master collision, missing feed, finite spectra and silence.');
