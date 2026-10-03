/* Doppelganger DSP math. ES5 for Max js; also used unchanged by the test harness. */
var FREQ=[],FILTER_FREQ=[];
for(var fi=0;fi<61;fi++)FREQ.push(32*Math.pow(500,fi/60));
for(var fi=0;fi<61;fi+=2)FILTER_FREQ.push(FREQ[fi]);
var FFT_SIZE=32768;
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function db(x){return 10*Math.log(Math.max(1e-20,x))/Math.LN10;}
function mean(a){var s=0;for(var i=0;i<a.length;i++)s+=a[i];return s/a.length;}
function fftPower(x){var n=x.length,re=[],im=[],i,j=0,t,k;for(i=0;i<n;i++){re[i]=x[i]*(0.5-0.5*Math.cos(2*Math.PI*i/(n-1)));im[i]=0;}
for(i=1;i<n;i++){var bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){t=re[i];re[i]=re[j];re[j]=t;}}
for(var len=2;len<=n;len*=2){var ang=-2*Math.PI/len;for(i=0;i<n;i+=len){var wr=1,wi=0;for(j=0;j<len/2;j++){k=i+j;var b=k+len/2,vr=re[b]*wr-im[b]*wi,vi=re[b]*wi+im[b]*wr;re[b]=re[k]-vr;im[b]=im[k]-vi;re[k]+=vr;im[k]+=vi;t=wr;wr=t*Math.cos(ang)-wi*Math.sin(ang);wi=t*Math.sin(ang)+wi*Math.cos(ang);}}}
var p=[];for(i=0;i<=n/2;i++)p[i]=(re[i]*re[i]+im[i]*im[i])/(n*n);return p;}
function bands(p,sr,n){var a=[];for(var i=0;i<FREQ.length;i++){var lo=FREQ[i]/Math.pow(2,0.10),hi=FREQ[i]*Math.pow(2,0.10),sum=0,c=0;for(var k=Math.max(1,Math.ceil(lo*n/sr));k<=Math.min(p.length-1,Math.floor(hi*n/sr));k++){sum+=p[k];c++;}a[i]=sum/Math.max(1,c);}return a;}
function profile(frames,name){if(!frames.length)throw Error('No audible audio in selection');var max=-200,i,j;for(i=0;i<frames.length;i++)max=Math.max(max,db(frames[i].rms));var a=[],r=0,count=0;for(j=0;j<FREQ.length;j++)a[j]=0;for(i=0;i<frames.length;i++){if(db(frames[i].rms)<Math.max(-70,max-30))continue;for(j=0;j<a.length;j++)a[j]+=frames[i].bands[j];r+=frames[i].rms;count++;}if(!count)throw Error('Selection is silent');for(j=0;j<a.length;j++)a[j]/=count;var stats={peak:0,ll:0,rr:0,lr:0,mid:0,side:0,count:0};for(i=0;i<frames.length;i++){var f=frames[i];if(!f.stats||db(f.rms)<Math.max(-70,max-30))continue;stats.peak=Math.max(stats.peak,f.stats.peak);for(var key in stats)if(key!=='peak')stats[key]+=f.stats[key];}var result={name:name,power:a,rms:db(r/count),frames:count};if(stats.count>0)result.metrics={rms:result.rms,peak:20*Math.log(Math.max(1e-20,stats.peak))/Math.LN10,crest:20*Math.log(Math.max(1e-20,stats.peak))/Math.LN10-result.rms,correlation:clamp(stats.lr/Math.sqrt(Math.max(1e-30,stats.ll*stats.rr)),-1,1),sideMid:clamp(db(stats.side/Math.max(1e-30,stats.mid)),-100,100),balance:clamp(db(stats.rr/Math.max(1e-30,stats.ll)),-100,100),method:'sampled analysis windows'};return result;}
function coeff(f,g,sr,q){if(f>sr*0.45)return [1,0,0,0,0];var A=Math.pow(10,g/40),w=2*Math.PI*f/sr,alpha=Math.sin(w)/(2*(q||2.2)),c=Math.cos(w),d=1+alpha/A;return [(1+alpha*A)/d,-2*c/d,(1-alpha*A)/d,-2*c/d,(1-alpha/A)/d];}
function response(c,f,sr){var w=2*Math.PI*f/sr,co=Math.cos(w),si=-Math.sin(w),c2=Math.cos(2*w),s2=-Math.sin(2*w);return db((Math.pow(c[0]+c[1]*co+c[2]*c2,2)+Math.pow(c[1]*si+c[2]*s2,2))/(Math.pow(1+c[3]*co+c[4]*c2,2)+Math.pow(c[3]*si+c[4]*s2,2)));}

function normalized(p){var a=[],i;for(i=0;i<p.length;i++)a[i]=db(p[i]);var mid=[];for(i=0;i<FREQ.length;i++)if(FREQ[i]>=125&&FREQ[i]<=8000)mid.push(a[i]);var center=mean(mid);for(i=0;i<a.length;i++)a[i]-=center;return a;}
function tonalScore(source,target,curve,sr){var err=[],i;for(i=0;i<FREQ.length;i++)if(FREQ[i]<=sr*.45)err.push(source[i]+(curve?curve[i]:0)-target[i]);var offset=mean(err),sq=0,hits=0;for(i=0;i<err.length;i++){var e=err[i]-offset;sq+=e*e;if(Math.abs(e)<=3)hits++;}return {percent:100*hits/err.length,rmse:Math.sqrt(sq/err.length),threshold:3,bands:err.length};}
function design(src,a,b,blend,amount,limit,mode,style,sr,regions,referenceMix){
var source=normalized(src.power),refA=normalized(a.power),refB=normalized(b.power),reference=[],delta=[],i,j;
for(i=0;i<FREQ.length;i++){var mix=referenceMix?regionWeight(FREQ[i],referenceMix):blend;reference[i]=refA[i]*(1-mix)+refB[i]*mix;delta[i]=reference[i]-source[i];}
// Smooth the measured difference, never interpolate the old 15-band profiles.
var sm=[],radius=mode===1?5:2;
for(i=0;i<delta.length;i++){var sum=0,weight=0;for(j=-radius;j<=radius;j++){var w=radius+1-Math.abs(j);sum+=delta[clamp(i+j,0,delta.length-1)]*w;weight+=w;}sm[i]=sum/weight;}delta=sm;
for(i=0;i<delta.length;i++){var tint=0;if(mode===1){if(style===1)tint=1.5*(1-2*i/(delta.length-1));if(style===2)tint=1.5*(2*i/(delta.length-1)-1);if(style===3)tint=(FREQ[i]<160?1.2:FREQ[i]<600?-1:0);}delta[i]=clamp((delta[i]+tint)*amount*regionWeight(FREQ[i],regions),-limit,limit);if(FREQ[i]>sr*.45)delta[i]=0;}
var gains=[],cur=[],basis=[];
for(j=0;j<FREQ.length;j++)cur[j]=0;
for(i=0;i<FILTER_FREQ.length;i++){gains[i]=0;basis[i]=[];for(j=0;j<FREQ.length;j++)basis[i][j]=response(coeff(FILTER_FREQ[i],1,sr),FREQ[j],sr);}
// Linearized fitting followed by exact response measurement. Avoid repeated trig in the optimizer.
for(var pass=0;pass<60;pass++)for(i=0;i<gains.length;i++){var num=0,den=.2;for(j=0;j<cur.length;j++){num+=basis[i][j]*(delta[j]-cur[j]);den+=basis[i][j]*basis[i][j];}var old=gains[i],next=clamp(old+.75*(num-.2*old)/den,-limit,limit);gains[i]=next;for(j=0;j<cur.length;j++)cur[j]+=basis[i][j]*(next-old);}
var coefficients=[];for(i=0;i<gains.length;i++)coefficients=coefficients.concat(coeff(FILTER_FREQ[i],gains[i],sr));
var result={gains:gains,target:delta,coefficients:coefficients,source:source,refA:refA,refB:refB,reference:reference,rmsGap:a.rms*(1-blend)+b.rms*blend-src.rms};
return finishDesign(result,src,[],sr);
}
// Cache fixed-frequency trig and unchanged custom bands between pointer updates.
var responseGridCache=null,manualResponseCache=[];
function gridFor(sr){if(responseGridCache&&responseGridCache.sr===sr)return responseGridCache;var fs=FREQ.slice();for(var i=0;i<321;i++)fs.push(32*Math.pow(500,i/320));var rows=[];for(i=0;i<fs.length;i++){var w=2*Math.PI*fs[i]/sr;rows.push([Math.cos(w),-Math.sin(w),Math.cos(2*w),-Math.sin(2*w)]);}return responseGridCache={sr:sr,rows:rows};}
function gridResponse(c,row){var re=c[0]+c[1]*row[0]+c[2]*row[2],im=c[1]*row[1]+c[2]*row[3],dr=1+c[3]*row[0]+c[4]*row[2],di=c[3]*row[1]+c[4]*row[3];return db((re*re+im*im)/(dr*dr+di*di));}
function finishDesign(base,src,points,sr){var result={},key,i,j;for(key in base)if(base.hasOwnProperty(key))result[key]=base[key];var cs=base.coefficients.slice(0,FILTER_FREQ.length*5),grid=gridFor(sr).rows;
if(!base.autoResponse){base.autoResponse=[];for(j=0;j<grid.length;j++)base.autoResponse[j]=0;for(i=0;i<cs.length;i+=5){var c=cs.slice(i,i+5);for(j=0;j<grid.length;j++)base.autoResponse[j]+=gridResponse(c,grid[j]);}}result.autoResponse=base.autoResponse;
var combined=base.autoResponse.slice();
for(i=0;i<8;i++){var p=points[i],c=p?coeff(p.f,p.g,sr,p.q):[1,0,0,0,0];cs=cs.concat(c);if(!p||p.g===0)continue;var signature=[sr,p.f,p.g,p.q].join(':'),cached=manualResponseCache[i];if(!cached||cached.signature!==signature){var values=[];for(j=0;j<grid.length;j++)values[j]=gridResponse(c,grid[j]);cached=manualResponseCache[i]={signature:signature,values:values};}for(j=0;j<combined.length;j++)combined[j]+=cached.values[j];}
result.coefficients=cs;result.curve=combined.slice(0,FREQ.length);result.dense=combined.slice(FREQ.length);var before=0,after=0;
for(i=0;i<FREQ.length;i++){var w=src.power[i]*FREQ[i];before+=w;after+=w*Math.pow(10,result.curve[i]/10);}
result.trim=clamp(-db(after/before),-12,6);result.before=base.before||tonalScore(result.source,result.reference,null,sr);result.after=tonalScore(result.source,result.reference,result.curve,sr);return result;}

var REGIONS=[{name:'Sub weight',lo:32,hi:80},{name:'Bass / body',lo:80,hi:250},{name:'Mids',lo:250,hi:2000},{name:'Presence',lo:2000,hi:6000},{name:'Air / highs',lo:6000,hi:16001}];
function regionWeight(f,weights){if(!weights)return 1;var centers=[];for(var i=0;i<5;i++)centers[i]=Math.sqrt(REGIONS[i].lo*REGIONS[i].hi);if(f<=centers[0])return weights[0]/100;for(i=1;i<5;i++)if(f<=centers[i]){var t=Math.log(f/centers[i-1])/Math.log(centers[i]/centers[i-1]);t=t*t*(3-2*t);return (weights[i-1]*(1-t)+weights[i]*t)/100;}return weights[4]/100;}
function breakdown(result){var rows=[];for(var r=0;r<5;r++){var gap=0,applied=0,spread=0,error=0,count=0;for(var i=0;i<FREQ.length;i++)if(FREQ[i]>=REGIONS[r].lo&&FREQ[i]<REGIONS[r].hi){var d=result.source[i]-result.reference[i];gap+=d;applied+=result.curve[i];spread+=Math.abs(result.refA[i]-result.refB[i]);error+=(d+result.curve[i])*(d+result.curve[i]);count++;}rows.push({name:REGIONS[r].name,lo:REGIONS[r].lo,hi:Math.min(16000,REGIONS[r].hi),gap:gap/count,applied:applied/count,remainingMean:(gap+applied)/count,remaining:Math.sqrt(error/count),disagreement:spread/count});}return rows;}

function stereoStats(left,right){var s={peak:0,ll:0,rr:0,lr:0,mid:0,side:0,count:left.length};for(var i=0;i<left.length;i++){var l=left[i],r=right?right[i]:l,m=(l+r)*.5,d=(l-r)*.5;s.peak=Math.max(s.peak,Math.abs(l),Math.abs(r));s.ll+=l*l;s.rr+=r*r;s.lr+=l*r;s.mid+=m*m;s.side+=d*d;}return s;}

// Bilinear-transform bandpass / bell use the same frequency and Q as the audio engine.
var DYN_FREQ=[55,150,700,3500,10000],DYN_Q=1;
var dynamicCurveCache=[];
function dynamicCurve(gains,sr,n){var signature=[sr,n].concat(gains.map(function(v){return Math.round(v*100)/100;})).join(':');for(var k=0;k<dynamicCurveCache.length;k++)if(dynamicCurveCache[k].key===signature)return dynamicCurveCache[k].value;var a=[],cs=[];for(var i=0;i<5;i++)cs.push(coeff(Math.min(DYN_FREQ[i],sr*.44),gains[i]||0,sr,DYN_Q));var rows=gridFor(sr).rows;for(var j=0;j<n;j++){var v=0;for(i=0;i<5;i++)v+=n===321?gridResponse(cs[i],rows[61+j]):response(cs[i],32*Math.pow(500,j/(n-1)),sr);a.push(v);}dynamicCurveCache.push({key:signature,value:a});if(dynamicCurveCache.length>8)dynamicCurveCache.shift();return a;}
