/* Shared finite audio capture. No audio crosses between Live devices. */
autowatch=1;inlets=1;outlets=3;
include('doppelganger_core.js');
var owner=String(jsarguments[2]),ticket='',phase='idle',rate=44100,fraction=0,lastAdvance=0,frames=[],index=0,total=0;
var scan=new Task(scanStep,this),watch=new Task(watchdog,this);watch.interval=500;
function emit(kind,value){outlet(2,'learnevent',JSON.stringify({id:ticket,owner:owner,kind:kind,value:value}));}
function request(id){if(phase!=='idle'){var previous=ticket;ticket=String(id);emit('error','Feed busy. Finish the other learning capture first.');ticket=previous;return;}ticket=String(id);phase='capturing';fraction=0;lastAdvance=new Date().getTime();emit('started',0);outlet(1,'clear');outlet(0,'reset');outlet(0,1);watch.repeat();}
function progress(v){if(phase!=='capturing')return;if(v>fraction){fraction=v;lastAdvance=new Date().getTime();emit('progress',v);}if(v>=.999)hold(ticket);}
function hold(id){if(String(id)!==ticket||phase!=='capturing')return;outlet(0,0);watch.cancel();if(fraction<.15){fail('Play at least 3 seconds before Hold.');return;}phase='analyzing';frames=[];index=0;var b=new Buffer(jsarguments[1]);total=Math.min(b.framecount(),Math.floor(fraction*20*rate));if(total<FFT_SIZE){fail('Capture too short.');return;}scan.interval=8;scan.repeat();}
function scanStep(){try{var b=new Buffer(jsarguments[1]),pos=Math.floor((total-FFT_SIZE)*index/63),l=b.peek(1,pos,FFT_SIZE),r=b.peek(2,pos,FFT_SIZE),lp=fftPower(l),rp=fftPower(r),power=[],rms=0;for(var i=0;i<lp.length;i++)power[i]=(lp[i]+rp[i])*.5;for(i=0;i<l.length;i++)rms+=(l[i]*l[i]+r[i]*r[i])/(2*l.length);frames.push({bands:bands(power,rate,FFT_SIZE),rms:rms,stats:stereoStats(l,r)});index++;emit('analyzing',index/64);if(index>=64){scan.cancel();var p=profile(frames,'Learned audio');for(i=0;i<p.power.length;i++)p.power[i]=Math.max(1e-20,p.power[i]);phase='idle';emit('result',p);}}catch(e){fail(e.message);}}
function abort(id){if(String(id)!==ticket)return;outlet(0,0);scan.cancel();watch.cancel();phase='idle';}
function fail(message){outlet(0,0);scan.cancel();watch.cancel();phase='idle';emit('error',message);}
function watchdog(){if(phase==='capturing'&&new Date().getTime()-lastAdvance>4000)fail('No advancing audio. Enable audio and play a passage.');}
function samplerate(v){if(v>0&&v!==rate){if(phase!=='idle')fail('Sample rate changed. Learn again.');rate=v;}}
function freebang(){scan.cancel();watch.cancel();}
