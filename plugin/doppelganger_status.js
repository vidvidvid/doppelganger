autowatch=1;inlets=1;outlets=0;mgraphics.init();mgraphics.relative_coords=0;mgraphics.autofill=0;
include('doppelganger_progress.js');var statusState={};
function data(s){try{statusState=JSON.parse(s);mgraphics.redraw();}catch(e){}}
function analysisdata(s){try{statusState.analysis=JSON.parse(s);mgraphics.redraw();}catch(e){}}
function librarydata(s){try{statusState.library=JSON.parse(s);mgraphics.redraw();}catch(e){}}
function measurementdata(s){try{statusState.measurement=JSON.parse(s);mgraphics.redraw();}catch(e){}}
function paint(){var a=progressFor(statusState);if(a.phase==='idle'||a.phase==='done'){mgraphics.set_source_rgba(.055,.055,.052,1);mgraphics.rectangle(0,0,80,26);mgraphics.fill();return;}drawAnalysisProgress(a,0,0,80,26);}
function anything(){}
var animation=new Task(function(){var a=progressFor(statusState);if(a.phase==='loading'||a.phase==='preparing'||a.phase==='writing')mgraphics.redraw();},this);animation.interval=100;animation.repeat();
function freebang(){animation.cancel();}
