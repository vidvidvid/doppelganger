/* Doppelganger: shared compact display and full-size interactive editor. */
autowatch=1;inlets=1;outlets=1;mgraphics.init();mgraphics.relative_coords=0;mgraphics.autofill=0;
include("doppelganger_core.js");
include("doppelganger_progress.js");
var liveBuffers=null,liveCurves=[[],[]],liveGrid=null;
var mixView=0;
var tabs=[['Source',7,22,133],['EQ editor',0,165,133],['Analysis',3,308,133],['Whole mix',4,451,133],['Dynamics',5,594,133],['Library',6,737,133],['Spectrum / Image',1,880,138]];
var libraryFilter='All',libraryPage=0,librarySort=0;
var state=null,selected=-1,view=0,hover='',gesture=null,controlGesture=null;
var ink=[.92,.91,.85,1],muted=[.62,.63,.59,1],mint=[1,.36,.10,1],purple=[.65,.61,.88,1],orange=[.90,.84,.43,1],blue=[.43,.67,.88,1];
function data(s){try{state=JSON.parse(s);correctionlimit(state.cfg.limit);if(state.buffers&&!liveBuffers)liveBuffers=[new Buffer(state.buffers[0]),new Buffer(state.buffers[1])];if(selected>=state.points.length)selected=-1;mgraphics.redraw();}catch(e){}}
function editdata(s){try{var d=JSON.parse(s);if(!state)return;if(gesture&&gesture.moved)return;state.points=d.points;state.result.curve=d.curve;state.result.dense=d.dense;state.result.after=d.after;state.result.breakdown=d.breakdown;if(selected>=state.points.length)selected=-1;mgraphics.redraw();}catch(e){}}
function curveAt(f){var a=state.result.dense,t=Math.max(0,Math.min(a.length-1,Math.log(f/32)/Math.log(500)*(a.length-1))),i=Math.floor(t);return a[i]+(a[Math.min(i+1,a.length-1)]-a[i])*(t-i);}
function size(){var w=box.rect[2]-box.rect[0],h=box.rect[3]-box.rect[1];return {w:w,h:h,big:h>250,l:h>250?55:28,r:w-(h>250?48:18),t:h>250?116:42,b:h-(h>250?90:23)};}
function fx(f,z){return z.l+Math.log(f/32)/Math.log(500)*(z.r-z.l);}
function xf(x,z){return 32*Math.pow(500,Math.max(0,Math.min(1,(x-z.l)/(z.r-z.l))));}
function gy(g,z){return (z.t+z.b)/2-g*(z.b-z.t)/30;}
function yg(y,z){return Math.max(-12,Math.min(12,((z.t+z.b)/2-y)*30/(z.b-z.t)));}
function fmt(f){return f>=1000?(f/1000).toFixed(2)+' kHz':Math.round(f)+' Hz';}
function text(s,x,y,sz,c){var g=mgraphics;g.set_source_rgba(c||ink);g.select_font_face('Arial');g.set_font_size(sz);g.move_to(x,y);g.show_text(s);}
function line(x,y,x2,y2,c,width){var g=mgraphics;g.set_source_rgba(c);g.set_line_width(width||1);g.move_to(x,y);g.line_to(x2,y2);g.stroke();}
function panel(x,y,w,h,c,r){var g=mgraphics;g.set_source_rgba(c);g.rectangle_rounded(x,y,w,h,r===19?19:2,r===19?19:2);g.fill();}
function dot(x,y,c,r){var g=mgraphics;g.set_source_rgba(c);g.ellipse(x-r,y-r,r*2,r*2);g.fill();}
function pill(s,x,y,w,active){var g=mgraphics;panel(x,y,w,25,active?[.23,.125,.07,1]:[.09,.09,.085,1],5);if(active)line(x+9,y+24,x+w-9,y+24,mint,1.5);text(s.toUpperCase(),x+10,y+17,10,active?ink:muted);}
function legend(s,x,y,c){dot(x,y-3,c,2.5);text(s,x+9,y,10,muted);}
function num(s,x,y,sz,c){var g=mgraphics;g.set_source_rgba(c||ink);g.select_font_face('Courier New');g.set_font_size(sz);g.move_to(x,y);g.show_text(s);}
function hit(x,y,z){if(!state)return -1;var best=-1,d=144;for(var i=0;i<state.points.length;i++){var p=state.points[i],dd=Math.pow(fx(p.f,z)-x,2)+Math.pow(gy(curveAt(p.f),z)-y,2);if(dd<d){d=dd;best=i;}}return best;}
function onclick(x,y,button,cmd,shift,caps,opt){var z=size();gesture=null;if(!state)return;
if(z.big&&x>=568&&x<=708&&y>=16&&y<=43){outlet(0,'bypass',state.cfg.bypass?0:1);return;}
if(z.big&&y>=63&&y<=88){for(var ti=0;ti<tabs.length;ti++){var tab=tabs[ti];if(x>=tab[2]&&x<tab[2]+tab[3]){view=tab[1];if(view===6)outlet(0,'libraryopen');break;}}mgraphics.redraw();return;}
if(z.big&&view===7){sourceClick(x,y);return;}
if(z.big&&view===6){libraryClick(x,y);return;}
if(z.big&&view===5){if(y>=112&&y<=144&&x>=240&&x<=760){controlGesture={type:'dynamic',key:'amount',lo:0,hi:100,left:240,width:520};adjustControl(x);return;}var ds=[['threshold',-60,0],['range',0,6],['attack',1,150],['release',30,1000]];for(var di=0;di<4;di++)if(y>=196+di*53&&y<=223+di*53&&x>=240&&x<=720){controlGesture={type:'dynamic',key:ds[di][0],lo:ds[di][1],hi:ds[di][2],left:240,width:480};adjustControl(x);return;}if(y>=439&&y<=467){for(var bi=0;bi<5;bi++)if(x>=22+bi*145&&x<157+bi*145){outlet(0,'dynband',bi);return;}if(x>=760){outlet(0,'dynparam','punch',1-state.dynamic.punch);outlet(0,'commitdynamic');return;}}return;}
if(z.big&&view===4){if(y>=109&&y<=136){if(x>=180&&x<275)mixView=0;else if(x>=285&&x<395)mixView=1;else if(x>=690&&x<850){mixView=1;outlet(0,'measurestart');}else if(x>=860&&x<960)outlet(0,'measurecancel');mgraphics.redraw();return;}if(y>=487&&y<=514){var idx=Math.floor((x-22)/250);if(idx>=0&&idx<4&&x>=22+idx*250&&x<=222+idx*250){var ws=[['output',-18,6],['drive',0,9],['amount',0,100],['attack',1,150]];controlGesture={type:idx<2?'native':'dynamic',key:ws[idx][0],lo:ws[idx][1],hi:ws[idx][2],left:22+idx*250,width:200};adjustControl(x);}}return;}
if(z.big&&view===0&&y>=94&&y<=111&&x>=300&&x<=480){controlGesture={type:'dynamic',key:'amount',lo:0,hi:100,left:300,width:180};adjustControl(x);return;}
if(z.big&&view===3){for(var ri=0;ri<5;ri++)if(y>=224+ri*57&&y<=246+ri*57&&x>=22&&x<=157){var choice=Math.floor((x-22)/45);outlet(0,'refmix',ri,[0,-1,100][choice]);outlet(0,'commitregions');return;}if(y>=112&&y<=143&&x>=240&&x<=760){controlGesture={type:'amount'};adjustControl(x);return;}for(var r=0;r<5;r++)if(y>=204+r*57&&y<=229+r*57&&x>=600&&x<=760){controlGesture={type:'region',index:r};adjustControl(x);return;}return;}
if(z.big&&y>z.h-40){if(view!==0)return;if(x>z.w-119){selected=-1;outlet(0,'clearpoints');}else if(selected>=0&&x>z.w-227){var i=selected;selected=-1;outlet(0,'removepoint',i);}else if(selected>=0&&x>z.w-421&&x<z.w-235){var p=state.points[selected],q=Math.max(.2,Math.min(12,p.q*(x<z.w-329?.8:1.25)));outlet(0,'editpoint',selected,p.f,p.g,q);outlet(0,'commitpoints');}return;}
if((view!==0&&z.big)||x<z.l||x>z.r||y<z.t||y>z.b)return;
var i=hit(x,y,z);
if(i>=0){selected=i;var p=state.points[i];gesture={index:i,x:x,y:y,f:p.f,g:p.g,q:p.q,moved:false};preparePreview(gesture);}
else if(Math.abs(y-gy(curveAt(xf(x,z)),z))<=12){gesture={index:-1,x:x,y:y,f:xf(x,z),moved:false};}
mgraphics.redraw();}
// Mouse-local preview: no scheduler, JSON round trip or engine acknowledgement needed.
function preparePreview(a){var rows=gridFor(state.sr||44100).rows,c=coeff(a.f,a.g,state.sr||44100,a.q),all=state.result.curve.concat(state.result.dense);a.fixed=[];for(var j=0;j<all.length;j++)a.fixed[j]=all[j]-gridResponse(c,rows[j]);}
function previewPoint(a,f,g){var rows=gridFor(state.sr||44100).rows,c=coeff(f,g,state.sr||44100,a.q),all=[];for(var j=0;j<a.fixed.length;j++)all[j]=a.fixed[j]+gridResponse(c,rows[j]);state.result.curve=all.slice(0,FREQ.length);state.result.dense=all.slice(FREQ.length);mgraphics.redraw();}
// A click is resolved on release so grabbing a dot does not delete it or move the EQ.
function ondrag(x,y,button){if(controlGesture){adjustControl(x);if(!button){controlGesture=null;outlet(0,'commitregions');outlet(0,'commitdynamic');}return;}if(!state||!gesture)return;var z=size(),a=gesture;
if(Math.abs(x-a.x)+Math.abs(y-a.y)>4)a.moved=true;
if(a.index>=0&&a.moved){var f=Math.max(32,Math.min(16000,a.f*Math.pow(500,(x-a.x)/(z.r-z.l)))),g=Math.max(-12,Math.min(12,a.g-(y-a.y)*30/(z.b-z.t)));state.points[a.index]={f:f,g:g,q:a.q};previewPoint(a,f,g);outlet(0,'editpoint',a.index,f,g,a.q);}
if(!button){gesture=null;if(a.index>=0){if(a.moved)outlet(0,'commitpoints');else{selected=-1;outlet(0,'removepoint',a.index);}}
else if(!a.moved){if(state.points.length>=8){hover='Eight custom bands maximum';mgraphics.redraw();return;}selected=state.points.length;outlet(0,'editpoint',selected,a.f,0,1.4);outlet(0,'commitpoints');}mgraphics.redraw();}}
function onidle(x,y){var z=size();if(x>=z.l&&x<=z.r&&y>=z.t&&y<=z.b){var f=xf(x,z);hover=Math.round(f)+' Hz / '+curveAt(f).toFixed(2)+' dB EQ';}else hover='';mgraphics.redraw();}
function onidleout(){hover='';mgraphics.redraw();}
function onresize(){mgraphics.redraw();}
function paint(){var z=size(),g=mgraphics;g.set_source_rgba(.055,.055,.052,1);g.rectangle(0,0,z.w,z.h);g.fill();if(!state){text('Loading doppelgänger...',20,30,14);return;}var r=state.result,pts=state.points;
if(z.big){
// Industrial identity: paired signal rails and a compact technical wordmark.
line(22,18,22,43,mint,4);line(31,12,31,37,mint,4);
g.set_source_rgba(ink);g.select_font_face('Arial','normal','bold');g.set_font_size(26);g.move_to(45,32);g.show_text('DOPPELGÄNGER');
text('REFERENCE PROCESSOR  /  EQ + DYNAMICS',46,47,8,muted);
line(22,3,z.w-22,3,mint,2);
drawAnalysisProgress(progressFor(state),303,12,235,36);
text('Bypass',568,34,11,state.cfg.bypass?orange:ink);panel(622,20,44,19,state.cfg.bypass?[.45,.29,.13,1]:[.20,.20,.17,1],19);dot(state.cfg.bypass?656:632,29.5,state.cfg.bypass?orange:muted,7);text(state.cfg.bypass?'ON':'OFF',676,34,10,state.cfg.bypass?orange:muted);
panel(z.w-307,8,285,45,[.105,.105,.095,1],7);text('01 / TONAL MATCH',z.w-293,24,9,muted);num(state.ready===false?'—':state.sourceState&&state.sourceState.mode===1?'GUIDED':Math.round(r.before.percent)+' → '+Math.round(r.after.percent)+'%',z.w-178,31,20,mint);text(state.ready===false?'Load source and a reference':state.sourceState&&state.sourceState.mode===1?'Master target · verify actual master output':'Wet EQ prediction  ·  '+r.after.rmse.toFixed(1)+' dB error',z.w-293,43,9,muted);
line(22,57,z.w-22,57,[.22,.22,.19,1],.6);
for(var ti=0;ti<tabs.length;ti++){var tab=tabs[ti];pill(tab[0],tab[2],63,tab[3],view===tab[1]);}dot(z.w-185,100,state.cfg.mode===0?muted:mint,2.5);text(state.cfg.bypass?'BYPASSED · DRY':state.cfg.mode===0?'ADVICE · DRY':'DRY/WET '+Math.round(state.cfg.wet===undefined?100:state.cfg.wet)+'%',z.w-176,104,9,state.cfg.mode===0?muted:mint);
}else{text(state.ready===false?'LEARN SOURCE + REFERENCE':state.sourceState&&state.sourceState.mode===1?'MASTER GUIDANCE':'MATCH /  '+Math.round(r.before.percent)+'% > '+Math.round(r.after.percent)+'% wet EQ',12,16,10,mint);text(state.ready===false?'Load a reference, then Learn; or choose File':state.cfg.bypass?'BYPASSED · original audio':'Wet EQ curve · Dry/Wet '+Math.round(state.cfg.wet===undefined?100:state.cfg.wet)+'%',12,31,9,state.cfg.bypass?orange:muted);}
var shown=z.big?view:0;
if(shown===7){drawSource();return;}
if(shown===6){drawLibrary(z);return;}
if(state.ready===false){text('Load a reference and Learn the source to begin.',z.l,z.t+40,z.big?14:10,muted);return;}
if(shown===1||shown===2){drawSpectrumImage(z);return;}
if(shown===5){drawDynamics(z);return;}
if(shown===4){drawWholeMix(z);return;}
if(shown===3){drawAnalysis(z);return;}
if(shown<3){panel(z.l-10,z.t-2,z.r-z.l+20,z.b-z.t+31,[.070,.070,.065,1],6);if(z.big)panel(12,z.h-42,z.w-24,36,[.075,.088,.104,1],6);}
if(shown===2){
// Spectral fingerprint, not a time spectrogram: each tile is one measured frequency band.
var rows=[r.source,r.refA,r.refB,r.source.map(function(v,i){return v+r.curve[i];})],labels=['YOUR SOURCE','REFERENCE A','REFERENCE B','EQ PREVIEW'];
var rh=(z.b-z.t)/4;for(var rr=0;rr<4;rr++){text(labels[rr],z.l,z.t+rr*rh+14,10,[blue,orange,purple,mint][rr]);for(var k=0;k<61;k++){var v=Math.max(0,Math.min(1,(rows[rr][k]+30)/45));g.set_source_rgba(.07+.35*v,.13+.58*v,.19+.39*v,1);g.rectangle(z.l+k*(z.r-z.l)/61,z.t+rr*rh+24,(z.r-z.l)/61+1,rh-31);g.fill();}}text('Average spectral fingerprint | darker = less relative energy | normalized tonal profiles',z.l,z.h-47,11,muted);
}else{
var lo=-15,hi=15;if(shown===1){var extrema=r.source.concat(r.refA,r.refB,r.source.map(function(v,i){return v+r.curve[i];}));lo=Math.floor((Math.min.apply(null,extrema)-2)/10)*10;hi=Math.ceil((Math.max.apply(null,extrema)+2)/10)*10;}
function yy(v){return z.b-(Math.max(lo,Math.min(hi,v))-lo)/(hi-lo)*(z.b-z.t);}
var guides=[32,60,100,200,300,600,1000,2000,3000,6000,10000,16000];for(var vg=0;vg<guides.length;vg++)line(fx(guides[vg],z),z.t,fx(guides[vg],z),z.b,[.13,.13,.115,1],.5);
for(var d=shown===0?-12:lo;d<=hi;d+=shown===0?6:10){line(z.l,yy(d),z.r,yy(d),d===0?[.35,.35,.30,1]:[.17,.17,.15,1],d===0?1:.5);text(''+d,7,yy(d)+4,9,muted);}
function curve(a,c,width){g.set_source_rgba(c);g.set_line_width(width);for(var i=0;i<a.length;i++){var x=z.l+i/(a.length-1)*(z.r-z.l),y=yy(a[i]);if(i===0)g.move_to(x,y);else g.line_to(x,y);}g.stroke();}
if(shown===0){drawCorrectionLimit(z);drawLive(z);curve(r.target,[.36,.41,.46,.65],.8);drawDynamicRange(z);curve(r.dense,mint,2.2);if(state.dynamic&&state.dynamic.amount>0){var movement=dynamicCurve(dynamicGains,state.sr||44100,r.dense.length);curve(r.dense.map(function(v,i){return v+movement[i];}),orange,1.6);}if(z.big){text('DYNAMIC',210,104,10,muted);bar(300,96,180,state.dynamic?state.dynamic.amount:0);text(Math.round(state.dynamic?state.dynamic.amount:0)+'%',490,106,10,mint);}for(var i=0;i<pts.length;i++){var p=pts[i],x=fx(p.f,z),y=gy(curveAt(p.f),z);if(i===selected)dot(x,y,[.90,.84,.43,.13],11);dot(x,y,i===selected?orange:mint,5.5);dot(x,y,[.070,.070,.065,1],2.5);if(z.big){panel(x+8,y-19,20,16,[.10,.13,.15,1],3);num(''+(i+1),x+13,y-7,9,ink);}}if(z.big){legend('Requested EQ',z.l,z.h-48,[.50,.55,.60,1]);legend('Base EQ + edits',z.l+125,z.h-48,mint);legend('Dynamic EQ',z.l+263,z.h-48,orange);legend('Live L',z.l+377,z.h-48,blue);legend('Live R',z.l+448,z.h-48,purple);text('Shading: maximum dynamic cut',z.r-185,z.h-48,9,muted);}
}else{curve(r.source,blue,1.4);curve(r.refA,orange,1.2);curve(r.refB,purple,1.2);curve(r.source.map(function(v,i){return v+r.curve[i];}),mint,2.2);text('Source',z.l,z.h-47,11,blue);text('Ref A',z.l+75,z.h-47,11,orange);text('Ref B',z.l+145,z.h-47,11,purple);text('Predicted EQ',z.l+215,z.h-47,11,mint);text('Level-normalized average spectra; not live meters',z.l+360,z.h-47,11,muted);}
}
var ticks=z.big?[32,100,300,1000,3000,10000,16000]:[32,100,300,1000,3000,16000];for(var t=0;t<ticks.length;t++){var tx=fx(ticks[t],z);text(ticks[t]>=1000?(ticks[t]/1000)+'k':''+ticks[t],tx-10,z.b+16,9,muted);}
if(z.big&&shown!==0){text(shown===1?'AVERAGE SPECTRA   ·   Level-normalized comparison':'SPECTRAL FINGERPRINT   ·   Each column represents a measured frequency band',22,z.h-15,10,muted);return;}
if(z.big){var p=pts[selected];text(p?'Band '+(selected+1)+'   '+fmt(p.f)+'   '+p.g.toFixed(1)+' dB   Q '+p.q.toFixed(2):'Click to add or remove  ·  Drag to shape',22,z.h-15,11,ink);pill('Wider',z.w-420,z.h-36,82,false);pill('Narrower',z.w-328,z.h-36,92,false);pill('Delete',z.w-226,z.h-36,98,false);pill('Clear points',z.w-118,z.h-36,103,false);if(hover)text(hover,555,104,10,ink);
}else if(hover)text(hover,z.w-105,16,10,ink);
}

var requestTask=new Task(function(){outlet(0,"bang");},this);requestTask.schedule(350);
function freebang(){correctionTask.cancel();requestTask.cancel();spectrumTask.cancel();}

function pollSpectrum(){if(!state||!liveBuffers)return;try{var sr=state.sr||44100,n=8192;
if(!liveGrid||liveGrid.sr!==sr){var bins=[];for(var i=0;i<512;i++){var f=32*Math.pow(500,i/511),next=32*Math.pow(500,(i+.5)/511),prev=32*Math.pow(500,(i-.5)/511);bins.push([Math.max(1,Math.min(4095,Math.floor(prev*n/sr))),Math.max(1,Math.min(4095,Math.ceil(next*n/sr))),f*n/sr]);}liveGrid={sr:sr,bins:bins};}
for(var ch=0;ch<2;ch++){var power=liveBuffers[ch].peek(1,0,4096);if(!power||power.length<4096)continue;var row=liveCurves[ch];for(var i=0;i<512;i++){var b=liveGrid.bins[i],v=0;if(b[1]-b[0]>2){for(var k=b[0];k<=b[1];k++)v=Math.max(v,power[k]);}else{var t=Math.min(4094,b[2]),k=Math.floor(t);v=power[k]*(1-(t-k))+power[k+1]*(t-k);}v=10*Math.log(Math.max(1e-20,v/(n*n/16)))/Math.LN10;v=Math.max(-100,Math.min(0,v));row[i]=row[i]===undefined?v:Math.max(v,row[i]-2.5);}}
// Don't compete with the pointer's own redraw requests during a drag.
if(!gesture)mgraphics.redraw();}catch(e){}}
function drawLive(z){var g=mgraphics;if(z.big){text('EQ dB',5,z.t-8,9,muted);text('dBFS',z.r+8,z.t-8,9,muted);for(var d=0;d>=-100;d-=20)text(''+d,z.r+8,z.b-(d+100)/100*(z.b-z.t)+3,9,muted);}for(var ch=0;ch<2;ch++){var a=liveCurves[ch];if(!a.length)continue;var c=ch===0?blue:purple;g.set_source_rgba(c[0],c[1],c[2],.10);g.move_to(z.l,z.b);for(var i=0;i<a.length;i++)g.line_to(z.l+i/(a.length-1)*(z.r-z.l),z.b-(a[i]+100)/100*(z.b-z.t));g.line_to(z.r,z.b);g.close_path();g.fill();g.set_source_rgba(c[0],c[1],c[2],.60);g.set_line_width(.8);for(var i=0;i<a.length;i++){var x=z.l+i/(a.length-1)*(z.r-z.l),y=z.b-(a[i]+100)/100*(z.b-z.t);if(i===0)g.move_to(x,y);else g.line_to(x,y);}g.stroke();}}
var spectrumTask=new Task(pollSpectrum,this);spectrumTask.interval=40;spectrumTask.repeat();

function adjustControl(x){if(!controlGesture||!state)return;var c=controlGesture;if(c.type==='amount'){state.cfg.amount=clamp((x-240)/520*100,0,100);outlet(0,'amount',state.cfg.amount);}else if(c.type==='dynamic'||c.type==='native'){var v=c.lo+clamp((x-c.left)/c.width,0,1)*(c.hi-c.lo);if(c.type==='dynamic'){state.dynamic[c.key]=v;outlet(0,'dynparam',c.key,v);}else{state.cfg[c.key]=v;outlet(0,c.key,v);}}else{state.regions[c.index]=clamp((x-600)/160*100,0,100);outlet(0,'region',c.index,state.regions[c.index]);}mgraphics.redraw();}
function bar(x,y,w,v){var g=mgraphics,t=clamp(v/100,0,1),hx=x+w*t;panel(x,y+4,w,4,[.17,.21,.24,1],2);if(t>0)panel(x,y+4,Math.max(1,w*t),4,[.30,.63,.55,1],2);dot(hx,y+6,[.025,.033,.041,1],6);dot(hx,y+6,mint,4);dot(hx,y+5,[.77,.96,.9,1],1.3);}
function signed(v){return (v>=0?'+':'')+v.toFixed(1)+' dB';}
function drawAnalysis(z){var rows=state.result.breakdown;if(!rows)return;var names=state.names||['Source','A','B'];text('Source: '+names[0].split(' - ')[0]+'  |  A: '+names[1].split(' - ')[0]+'  |  B: '+names[2].split(' - ')[0]+'  |  Mix: '+(100-state.cfg.blend).toFixed(0)+' / '+state.cfg.blend.toFixed(0),22,104,10,muted);text(state.cfg.bypass?'Bypassed: audio dry':state.cfg.mode===0?'Advice: audio dry':'EQ processing on',850,133,11,orange);text('MATCH AMOUNT',22,133,13,mint);bar(240,120,520,state.cfg.amount);text(Math.round(state.cfg.amount)+'%',782,133,14,mint);text('0: no automatic EQ   /   100: full proposed correction   /   your manual points stay independent',240,156,10,muted);
text('REGION',22,185,10,muted);text('AVG SOURCE vs REF',204,185,10,muted);text('AVG BASE EQ',402,185,10,muted);text('REGION AMOUNT',600,185,10,muted);text('RESIDUAL RMS',820,185,10,muted);
for(var r=0;r<rows.length;r++){var a=rows[r],y=219+r*57;panel(12,y-20,z.w-24,53,r%2===0?[.085,.085,.078,1]:[.065,.065,.060,1],4);text(a.name,22,y,13,ink);var choice=state.referenceMix?state.referenceMix[r]:-1;for(var rb=0;rb<3;rb++){var bx=22+rb*45;gsmall(['A','Mix','B'][rb],bx,y+5,40,choice===[0,-1,100][rb]);}num(signed(a.gap),204,y,13,a.gap>0?orange:blue);num(signed(a.applied),402,y,13,mint);bar(600,y-10,160,state.regions[r]);text(Math.round(state.regions[r])+'%',769,y,10,ink);text(a.remaining.toFixed(1)+' dB RMS',846,y,12,ink);text('Avg: '+signed(a.gap+a.applied),846,y+18,10,muted);
var why=Math.abs(a.gap)<.5?'Average balance already close.':a.gap>0?'Above reference → reduce energy.':'Below reference → add energy.';if(a.disagreement>3)why+=' A and B differ here.';text(why,204,y+18,10,muted);}
text('CURVE RECIPE   Reference difference → smoothing → amount → '+state.cfg.limit.toFixed(1)+' dB band cap → fitted filters + your edits.',22,519,11,ink);
text('Residual RMS measures frequency-by-frequency differences; larger deviations weigh more. Avg = source gap + EQ. Static prediction, before limiting.',22,541,10,muted);
}

function drawWholeMix(z){pill('Files',180,109,95,mixView===0);pill('Measured',285,109,110,mixView===1);var m=state.measurement||{phase:'idle'},busy=['preparing','capturing','writing','analyzing'].indexOf(m.phase)>=0;pill(busy?'Measuring...':'Measure 30 seconds',690,109,160,!busy);if(busy)pill('Cancel',860,109,100,false);if(mixView===1){drawMeasured(z);return;}var ms=state.metrics||[],names=state.names||['Source','Reference A','Reference B'];text('Whole mix',22,126,19,ink);text('Loudness: full-file scans where available. Punch / stereo: sampled windows. Measurements only.',22,150,11,muted);
for(var col=0;col<3;col++)panel(314+col*225,169,215,267,[.085,.085,.078,1],5);text('MEASUREMENT',22,186,9,muted);for(var c=0;c<3;c++)text((c===0?'SOURCE: ':c===1?'REF A: ':'REF B: ')+names[c].split(' - ')[0].slice(0,19),330+c*225,186,11,c===0?blue:c===1?orange:purple);
var defs=[['Integrated loudness','lufs',' LUFS','Original file loudness'],['Loudness range','lra',' LU','Loudness variation across the file'],['Transient headroom','crest',' dB','Sampled peak minus RMS; a punch indicator'],['Stereo side / mid','sideMid',' dB','Side energy relative to the center'],['L / R correlation','correlation','','Negative values can indicate cancellation'],['Channel balance R / L','balance',' dB','Positive: right louder · Negative: left louder'],['True peak','truePeak',' dBTP','Full-file estimated intersample peak']];
for(var r=0;r<defs.length;r++){var d=defs[r],y=207+r*35;text(d[0],22,y,12,ink);text(d[3],22,y+13,9,muted);for(var c=0;c<3;c++){var m=ms[c],v=m&&m[d[1]];num(typeof v==='number'?v.toFixed(d[1]==='correlation'?2:1)+d[2]:(d[1]==='lufs'||d[1]==='lra'||d[1]==='truePeak'?'Full scan required':'Re-analyze file'),330+c*225,y,14,c===0?blue:c===1?orange:purple);}if(r<6)line(22,y+21,z.w-22,y+21,[.12,.15,.18,1],.5);}
var controls=[['OUTPUT',state.cfg.output,-18,6,' dB'],['DRIVE (Precision)',state.cfg.drive,0,9,' dB'],['DYNAMIC',state.dynamic.amount,0,100,'%'],['ATTACK / PUNCH',state.dynamic.attack,1,150,' ms']];for(var wi=0;wi<4;wi++){var d=controls[wi],wx=22+wi*250;panel(wx-10,449,238,70,[.074,.091,.107,1],6);text(d[0],wx,467,9,muted);num(d[1].toFixed(1)+d[4],wx,485,14,ink);bar(wx,495,200,(d[1]-d[2])/(d[3]-d[2])*100);}text('Above: original file measurements, not live output. Advice is dry. Keep punch imposes a 25 ms minimum attack.',22,538,10,muted);}

var dynamicGains=[0,0,0,0,0];
function dynamicdata(s){if(!state)return;state.dynamic=JSON.parse(s);mgraphics.redraw();}
function dynmeter(){var a=arrayfromargs(arguments);if(a.length===1&&a[0] instanceof Array)a=a[0];if(a.length!==5)return;dynamicGains=a;if(!gesture)mgraphics.redraw();}
function gsmall(s,x,y,w,on){panel(x,y,w,19,on?[.23,.125,.07,1]:[.09,.115,.14,1],3);text(s,x+10,y+13,9,on?mint:muted);}
function drawDynamicRange(z){if(!state.dynamic||state.dynamic.amount<=0)return;var d=state.dynamic,range=dynamicCurve(d.enabled.map(function(v){return -v*d.range*d.amount/100;}),state.sr||44100,state.result.dense.length),a=state.result.dense,g=mgraphics;g.set_source_rgba(.98,.64,.32,.16);for(var i=0;i<a.length;i++){var x=z.l+i/(a.length-1)*(z.r-z.l),y=gy(a[i],z);if(i===0)g.move_to(x,y);else g.line_to(x,y);}for(i=a.length-1;i>=0;i--)g.line_to(z.l+i/(a.length-1)*(z.r-z.l),gy(a[i]+range[i],z));g.close_path();g.fill();}
function drawDynamics(z){var d=state.dynamic; text('Dynamic amount',22,133,18,ink);bar(240,120,520,d.amount);text(Math.round(d.amount)+'%',782,133,14,mint);text('0: static EQ only  /  100: full allowed movement. Stereo-linked, cut-only bands after static EQ.',22,164,11,muted);var rows=[['Threshold',d.threshold,-60,0,' dBFS','Band RMS trigger; lower reacts more often.'],['Maximum cut / band',d.range,0,6,' dB','Amount scales this limit. Overlapping bands can add.'],['Attack',d.attack,1,150,' ms','Keep punch uses at least 25 ms; it is not kick isolation.'],['Release',d.release,30,1000,' ms','How gently the correction returns to the base curve.']];for(var i=0;i<4;i++){var r=rows[i],y=211+i*53;panel(12,y-22,z.w-24,51,i%2===0?[.085,.085,.078,1]:[.065,.065,.060,1],4);text(r[0],22,y,13,ink);bar(240,y-10,480,(r[1]-r[2])/(r[3]-r[2])*100);num(r[1].toFixed(1)+r[4],748,y,13,ink);text(r[5],240,y+20,10,muted);}for(i=0;i<5;i++){pill(REGIONS[i].name,22+i*145,439,135,d.enabled[i]);num(dynamicGains[i].toFixed(2)+' dB',32+i*145,485,11,orange);panel(32+i*145,492,110,2,[.14,.18,.21,1],1);panel(32+i*145,492,Math.max(1,110*Math.min(1,-dynamicGains[i]/6)),2,orange,1);}pill('Keep punch',760,439,150,d.punch);text('Threshold is manual in this version. Reference choices shape the static target; dynamic bands respond to your audio.',22,519,11,ink);text('The match percentage describes static tonal correction. Use level-matched listening to judge the dynamic result.',22,541,10,muted);}

function measurementdata(s){if(!state)return;state.measurement=JSON.parse(s);mgraphics.redraw();}
function drawMeasured(z){var m=state.measurement||{phase:'idle'},r=m.result; text('Whole mix',22,126,19,ink);
var status=m.phase==='capturing'?'Capturing the same input / output passage: '+Math.round((m.progress||0)*30)+' / 30 s':m.phase==='analyzing'?'Analyzing the captured audio...':m.phase==='writing'?'Preparing captured audio...':m.phase==='preparing'?'Preparing measurement...':m.phase==='error'?m.error:!r?'Play your track, then measure 30 seconds. Input and output are captured together.':m.stale?'Settings changed since capture. Measure again to assess the current processing.':'Measured '+r.seconds.toFixed(1)+' s together. Reference columns are original file scans.';
text(status.slice(0,145),22,158,11,m.stale||m.phase==='error'?orange:muted);
if(!r){panel(22,190,z.w-44,245,[.085,.085,.078,1],6);text('Hear it. Measure it. Compare it.',55,240,21,ink);text('Output includes EQ, dynamics, gain, limiting and the final Dry/Wet blend.',55,278,13,muted);text('Before / output use the same passage, aligned for the device latency.',55,306,13,muted);text('In Advice mode, both taps are dry. Leave settings fixed during the capture.',55,334,13,muted);if(m.phase==='capturing')bar(55,380,700,(m.progress||0)*100);drawMixControls();return;}
var cols=[r.before.metrics,r.after.metrics,(state.metrics||[])[1]||{},(state.metrics||[])[2]||{}],xs=[330,490,660,830],colors=[blue,mint,orange,purple],labels=['BEFORE · passage','OUTPUT · passage','REF A · file','REF B · file'];for(var c=0;c<4;c++){panel(xs[c]-12,174,155,267,[.085,.085,.078,1],5);text(labels[c],xs[c],189,10,colors[c]);}
var defs=[['Tonal similarity','score','%','Bands within 3 dB of the captured reference target'],['Integrated loudness','lufs',' LUFS','Measured over this captured passage'],['RMS level','rms',' dBFS','Average energy across the passage'],['Crest factor','crest',' dB','Sample peak minus RMS; a punch indicator'],['Stereo side / mid','sideMid',' dB','Side energy relative to the center'],['L / R correlation','correlation','','Channel similarity; negative may cancel in mono'],['Estimated true peak','truePeak',' dBTP','Oversampled estimate from the captured waveform']];
for(var i=0;i<defs.length;i++){var d=defs[i],y=211+i*35;text(d[0],22,y,12,ink);text(d[3],22,y+13,9,muted);for(c=0;c<4;c++){var v=d[1]==='score'?(c===0?r.before.score&&r.before.score.percent:c===1?r.after.score&&r.after.score.percent:null):cols[c][d[1]];num(typeof v==='number'&&isFinite(v)?v.toFixed(d[1]==='score'?0:d[1]==='correlation'?2:1)+d[2]:'—',xs[c],y,12,colors[c]);}if(i<6)line(22,y+21,z.w-22,y+21,[.12,.15,.18,1],.5);}
drawMixControls();text((r.warning||'Reference file scans cover different passages. Crest factor alone does not measure perceived punch.').slice(0,145),22,538,10,r.warning?orange:muted);
}
function drawMixControls(){var controls=[['OUTPUT',state.cfg.output,-18,6,' dB'],['DRIVE (Precision)',state.cfg.drive,0,9,' dB'],['DYNAMIC',state.dynamic.amount,0,100,'%'],['ATTACK / PUNCH',state.dynamic.attack,1,150,' ms']];for(var i=0;i<4;i++){var d=controls[i],x=22+i*250;panel(x-10,449,238,70,[.074,.091,.107,1],6);text(d[0],x,467,9,muted);num(d[1].toFixed(1)+d[4],x,485,14,ink);bar(x,495,200,(d[1]-d[2])/(d[3]-d[2])*100);}}

function librarydata(s){try{if(state)state.library=JSON.parse(s);mgraphics.redraw();}catch(e){}}
function libraryEntries(){var lib=state.library||{entries:[]},entries=lib.entries.filter(function(e){return libraryFilter==='All'||e.tags.indexOf(libraryFilter)>=0;});entries.sort(function(a,b){if(librarySort===1)return b.shares[0]-a.shares[0];if(librarySort===2)return b.shares[2]-a.shares[2];return a.name.toLowerCase()<b.name.toLowerCase()?-1:a.name.toLowerCase()>b.name.toLowerCase()?1:0;});return entries;}
function shortText(s,n){return s.length>n?s.slice(0,n-1)+'…':s;}
function libraryClick(x,y){if(y>=108&&y<=133){if(x>=850){outlet(0,'libraryimport');return;}if(x>=670&&x<=835){librarySort=(librarySort+1)%3;libraryPage=0;}}var filters=['All','Bass-heavy','Bright','Warm','Mid-forward','Balanced'];if(y>=151&&y<=176)for(var i=0;i<6;i++)if(x>=22+i*133&&x<145+i*133){libraryFilter=filters[i];libraryPage=0;}var entries=libraryEntries();libraryPage=Math.max(0,Math.min(libraryPage,Math.ceil(entries.length/5)-1));if(y>=222&&y<472){var row=Math.floor((y-222)/50),e=entries[libraryPage*5+row];if(e&&x>=847&&x<=1010)outlet(0,'libraryload',e.id,x<928?1:2);}if(y>=478&&y<=503){if(x>=820&&x<910)libraryPage=Math.max(0,libraryPage-1);if(x>=920)libraryPage=Math.min(Math.max(0,Math.ceil(entries.length/5)-1),libraryPage+1);}mgraphics.redraw();}
function drawLibrary(z){var lib=state.library||{entries:[],status:'Loading…'},entries=libraryEntries();libraryPage=Math.max(0,Math.min(libraryPage,Math.max(0,Math.ceil(entries.length/5)-1)));text('Your reference collection',22,127,18,ink);pill(['Sort: Name','Sort: Bass first','Sort: Bright first'][librarySort],670,108,165,false);pill('+ Import audio',850,108,168,true);var filters=['All','Bass-heavy','Bright','Warm','Mid-forward','Balanced'];for(var i=0;i<filters.length;i++)pill(filters[i],22+i*133,151,123,libraryFilter===filters[i]);text(shortText(lib.status||'Ready',125),22,198,11,mint);text('TRACK / CHARACTER',34,216,9,muted);text('LOW  /  MID  /  HIGH ENERGY',565,216,9,muted);text('LOAD INTO',863,216,9,muted);
if(!entries.length){panel(22,238,996,216,[.065,.08,.095,1],8);text(lib.entries.length?'No references in this group yet.':'Build your own reference shelf.',48,285,18,ink);text('Import audio to keep a local copy and its analysis. Saved references load instantly into A or B.',48,317,12,muted);text('Choosing a new reference with the main A / B buttons also saves it here after analysis.',48,344,12,muted);}
for(var row=0;row<5;row++){var e=entries[libraryPage*5+row];if(!e)break;var y=222+row*50;panel(22,y,996,45,[.08,.08,.073,1],5);text(shortText(e.name,58),34,y+18,12,ink);text(e.tags.join(' · '),34,y+35,10,mint);var pos=565,colors=[orange,purple,blue];for(var j=0;j<3;j++){var width=e.shares[j]*225;panel(pos,y+10,Math.max(.1,width),5,colors[j],1);pos+=width;num(Math.round(e.shares[j]*100)+'%',565+j*78,y+34,10,colors[j]);}pill('Use A',847,y+9,73,state.names[1]===e.name);pill('Use B',932,y+9,73,state.names[2]===e.name);}
text(entries.length+' references · page '+(libraryPage+1)+' / '+Math.max(1,Math.ceil(entries.length/5)),22,496,10,muted);pill('Previous',820,478,90,false);pill('Next',920,478,98,false);text('Tonal tags estimate energy in 32–250 Hz / 250 Hz–2 kHz / 2–16 kHz. They are browsing hints, not genre labels.',22,527,10,muted);text('Local audio copies + saved analysis · independent of the original file · no uploads',22,546,10,muted);}

function analysisdata(s){try{if(state)state.analysis=JSON.parse(s);mgraphics.redraw();}catch(e){}}
function drawCorrectionLimit(z){var g=mgraphics,limit=correctionShown===null?state.cfg.limit:correctionShown,top=gy(limit,z),bottom=gy(-limit,z);g.set_source_rgba(.43,.67,.88,.09);g.rectangle(z.l,top,z.r-z.l,bottom-top);g.fill();line(z.l,top,z.r,top,[.43,.67,.88,.34],.7);line(z.l,bottom,z.r,bottom,[.43,.67,.88,.34],.7);var label='±'+limit.toFixed(2)+' dB'+(z.big?' max correction':'');text(label,z.r-(z.big?155:65),top-4,z.big?10:8,blue);}

// Lightweight visual feedback does not wait for the EQ fitter's 70 ms queue.
var correctionShown=null,correctionTarget=0,correctionAnimating=false;
var correctionTask=new Task(animateCorrection,this);correctionTask.interval=16;
function correctionlimit(v){v=Number(v);if(!isFinite(v))return;correctionTarget=Math.max(0,Math.min(9,v));if(correctionShown===null)correctionShown=correctionTarget;if(!correctionAnimating&&Math.abs(correctionShown-correctionTarget)>.001){correctionAnimating=true;correctionTask.repeat();}mgraphics.redraw();}
function animateCorrection(){var delta=correctionTarget-correctionShown;correctionShown+=delta*.5;if(Math.abs(delta)<.002){correctionShown=correctionTarget;correctionAnimating=false;correctionTask.cancel();}mgraphics.redraw();}

// One shared frequency axis for the averaged spectra and their tonal fingerprints.
function drawSpectrumImage(z){
var r=state.result,g=mgraphics,rows=[r.source,r.refA,r.refB,r.source.map(function(v,i){return v+r.curve[i];})],colors=[blue,orange,purple,mint],labels=['Source','Ref A','Ref B','EQ preview'];
text('AVERAGE SPECTRUM',22,127,11,ink);text('Level-normalized tonal balance',205,127,10,muted);
var top=148,bottom=310,all=[].concat.apply([],rows),lo=Math.floor((Math.min.apply(null,all)-2)/10)*10,hi=Math.ceil((Math.max.apply(null,all)+2)/10)*10;
if(hi<=lo)hi=lo+10;
function sy(v){return bottom-(v-lo)/(hi-lo)*(bottom-top);}
panel(z.l-10,top-6,z.r-z.l+20,bottom-top+12,[.070,.070,.065,1],2);
var ticks=[32,100,300,1000,3000,10000,16000];
for(var t=0;t<ticks.length;t++){var x=fx(ticks[t],z);line(x,top,x,bottom,[.17,.17,.15,1],.5);text(ticks[t]>=1000?(ticks[t]/1000)+'k':''+ticks[t],x-9,bottom+19,9,muted);}
for(var db=lo;db<=hi;db+=10){line(z.l,sy(db),z.r,sy(db),[.17,.17,.15,1],.5);num(''+db,14,sy(db)+3,9,muted);}
for(var row=0;row<4;row++){g.set_source_rgba(colors[row]);g.set_line_width(row===3?1.8:1.1);for(var i=0;i<rows[row].length;i++){var x=fx(FREQ[i],z),y=sy(rows[row][i]);if(i===0)g.move_to(x,y);else g.line_to(x,y);}g.stroke();legend(labels[row],z.l+row*130,352,colors[row]);}
text('TONAL FINGERPRINT',22,382,11,ink);text('Same frequencies · brighter cells = more relative energy',205,382,10,muted);
for(row=0;row<4;row++){var y=403+row*30;text(labels[row].toUpperCase(),z.l,y,8,colors[row]);for(i=0;i<61;i++){var v=Math.max(0,Math.min(1,(rows[row][i]-lo)/(hi-lo)));var x0=i===0?z.l:(fx(FREQ[i-1],z)+fx(FREQ[i],z))/2,x1=i===60?z.r:(fx(FREQ[i],z)+fx(FREQ[i+1],z))/2;g.set_source_rgba(.06+colors[row][0]*v*.8,.06+colors[row][1]*v*.8,.055+colors[row][2]*v*.8,1);g.rectangle(x0,y+5,Math.max(.5,x1-x0-.7),12);g.fill();}}
text('Averages from analyzed audio, not live meters. EQ preview shows the predicted static tonal change.',22,z.h-16,10,muted);
}

function sourcedata(s){try{if(state)state.sourceState=JSON.parse(s);mgraphics.redraw();}catch(e){}}
function sourceClick(x,y){if(y>=148&&y<=173){for(var i=0;i<3;i++)if(x>=22+i*300&&x<302+i*300){outlet(0,'sourcemode',i);return;}}if(y>=265&&y<=290){if(x>=22&&x<202)outlet(0,'sourceaction');else if(x>=222&&x<402)outlet(0,'learncancel');}}
function drawSource(){var s=state.sourceState||{mode:2,phase:'idle',message:'Choose a source'},busy=['waiting','capturing','analyzing'].indexOf(s.phase)>=0;
text('SOURCE / LISTEN TO YOUR SESSION',22,125,18,ink);
var labels=['Live input','Master feed','Audio file'];for(var i=0;i<3;i++)pill(labels[i],22+i*300,148,280,s.mode===i);
text(s.mode===0?'Analyze the audio arriving at this device on a track, group or master.':s.mode===1?'Add one Master Feed companion last on the master. This instance still processes its own track.':'Load a source file with the Source button or drop audio onto it.',22,210,13,ink);
text(s.mode===1?'Choose allowed frequency regions in Analysis. They start at 0% when switching to Master.':'Play a representative passage. Learn captures up to 20 seconds; Hold finishes after at least 3 seconds.',22,238,12,muted);
pill(s.mode===2?'Choose file':busy?'Hold learning':'Learn · 20 seconds',22,265,180,busy);if(s.mode!==2)pill('Cancel',222,265,180,false);
text(s.message||s.phase,22,329,13,mint);if(busy)drawAnalysisProgress(progressFor(state),22,350,600,40);
text('LEARN → HOLD',22,423,15,ink);
text('Processing passes dry while learning. Your held EQ resumes once analysis finishes.',22,453,12,muted);
text('Held profiles save with the Live Set. Relearn after major mix or arrangement changes.',22,480,12,muted);
text('Master guidance cannot isolate instruments; its score is not a prediction of your corrected master.',22,507,12,muted);
text('Use one correcting instance at a time; verify the result by listening and measuring the master.',22,534,12,muted);
}
