import json,struct
from pathlib import Path
out=Path(__file__).resolve().parent; boxes=[]; lines=[]; params={}
def box(id,text='',cls='newobj',rect=None,**kw):
 d=dict(id=id,maxclass=cls,patching_rect=rect or [20,250+len(boxes)*26,190,22]);
 if text:d['text']=text
 d.update(kw);
 if cls=='message':d.update(numinlets=2,numoutlets=1,outlettype=[''])
 boxes.append({'box':d});return id
def wire(a,o,b,i=0):lines.append({'patchline':{'source':[a,o],'destination':[b,i]}})
def ui(id,cls,rect,**kw):return box(id,cls=cls,rect=rect,presentation=1,presentation_rect=rect,**kw)
def label(id,text,rect,size=10):ui(id,'comment',rect,text=text,textcolor=[.72,.79,.82,1],fontsize=size,ignoreclick=1)
def control(id,name,rect,lo,hi,value,enum=None):
 cls='live.menu' if enum else 'live.dial';attr={'parameter_longname':name,'parameter_shortname':name,'parameter_type':2 if enum else 0,'parameter_mmin':lo,'parameter_mmax':hi,'parameter_initial_enable':1,'parameter_initial':[value]}
 if enum:attr['parameter_enum']=enum
 else:attr['parameter_unitstyle']=0
 ui(id,cls,rect,varname=id,parameter_enable=1,saved_attribute_attributes={'valueof':attr},**({'items':enum} if enum else {}));params[id]=[name,name,0];box('pre_'+id,'prepend '+id);wire(id,0,'pre_'+id);wire('pre_'+id,0,'engine')
box('engine','js doppelganger_engine.js #0-source #0-refA #0-refB #0-spectrumL #0-spectrumR',varname='engine',numoutlets=7)
box('state','pattr profiles @bindto engine',varname='profiles',numinlets=1,numoutlets=3,saved_object_attributes={'parameter_enable':1},saved_attribute_attributes={'valueof':{'parameter_longname':'Spectral profiles','parameter_shortname':'Profiles','parameter_type':3}})
params['state']=['Spectral profiles','Profiles',0]
box('in','plugin~');box('out','plugout~');box('left','cascade~');box('right','cascade~');box('gain','pack 1. 80');box('line','line~ 1.');box('mulL','*~');box('mulR','*~');box('limiter','limi~ 2 512 @lookahead 256 @threshold -1.0 @release 100 @dcblock 0');box('dryL','delay~ 256 256');box('dryR','delay~ 256 256');box('selL','selector~ 2 1');box('selR','selector~ 2 1')
wire('engine',0,'left',1);wire('engine',0,'right',1);wire('engine',1,'gain');wire('gain',0,'line');wire('engine',2,'selL');wire('engine',2,'selR');wire('in',0,'left');wire('in',1,'right');wire('in',0,'dryL');wire('in',1,'dryR');box('dynamic','gen~ doppelganger_dynamic',numinlets=2,numoutlets=7);wire('engine',5,'dynamic');wire('left',0,'dynamic');wire('right',0,'dynamic',1);wire('dynamic',0,'mulL');wire('dynamic',1,'mulR');wire('line',0,'mulL',1);wire('line',0,'mulR',1);wire('mulL',0,'limiter');wire('mulR',0,'limiter',1);wire('dryL',0,'selL',1);wire('dryR',0,'selR',1);wire('limiter',0,'selL',2);wire('limiter',1,'selR',2);wire('selL',0,'out');wire('selR',0,'out',1)
# Latency-aligned, smoothed linear dry/wet blend after all processing.
control('wet','Dry/Wet',[324,119,72,24],0,100,100)
box('wetpack','pack 1. 30');box('wetline','line~ 1.');box('wetinv','!-~ 1.');
ui('bypass','live.text',[218,12,90,20],text='Bypass',texton='BYPASSED',mode=1,varname='bypass',parameter_enable=1,numinlets=1,numoutlets=2,saved_attribute_attributes={'valueof':{'parameter_longname':'Bypass','parameter_shortname':'Bypass','parameter_type':2,'parameter_enum':['Off','On'],'parameter_mmax':1,'parameter_initial_enable':1,'parameter_initial':[0]}})
params['bypass']=['Bypass','Bypass',0]
ui('bypass_switch','jsui',[218,12,90,20],filename='doppelganger_bypass.js',numinlets=1,numoutlets=1);wire('engine',4,'bypass_switch');wire('bypass_switch',0,'bypass')
box('bypass_pre','prepend bypass');wire('bypass',0,'bypass_pre');wire('bypass_pre',0,'engine')
box('bypass_mix','pak 1. 0');box('bypass_effective','expr $f1 * (1 - $i2)');wire('bypass',0,'bypass_mix',1);wire('bypass_mix',0,'bypass_effective');wire('bypass_effective',0,'wetpack')
box('wet_scale','/ 100.');wire('wet',0,'wet_scale');wire('wet_scale',0,'bypass_mix');wire('wetpack',0,'wetline');wire('wetline',0,'wetinv')
for ch in ['L','R']:
 box('wet'+ch,'*~');box('clean'+ch,'*~');box('mix'+ch,'+~')
 wire('sel'+ch,0,'wet'+ch);wire('wetline',0,'wet'+ch,1);wire('dry'+ch,0,'clean'+ch);wire('wetinv',0,'clean'+ch,1);wire('wet'+ch,0,'mix'+ch);wire('clean'+ch,0,'mix'+ch,1)
# Redirect the audible outputs, analyzer and capture to the final blend below.
lines[:]=[l for l in lines if l['patchline']['destination'][0]!='out']
wire('mixL',0,'out');wire('mixR',0,'out',1)
# The before tap uses the existing 256-sample delay, aligned with processed output.
box('capturebuf','buffer~ #0-measure 30000 4 @format float32');box('capture','record~ #0-measure 4');
wire('dryL',0,'capture');wire('dryR',0,'capture',1);wire('mixL',0,'capture',2);wire('mixR',0,'capture',3)
box('measure_route','route record buffer node');wire('engine',6,'measure_route');wire('measure_route',0,'capture');wire('measure_route',1,'capturebuf')
box('measure_node','node.script doppelganger_measure.js @autostart 1');wire('measure_route',2,'measure_node');wire('measure_node',0,'engine')
box('library_dialog','opendialog');box('library_import','prepend libraryimport');box('library_route','route librarydialog');wire('measure_node',0,'library_route');wire('library_route',0,'library_dialog');wire('library_dialog',0,'library_import');wire('library_import',0,'measure_node')
box('capture_diff','delta~');box('capture_end','>=~ 0.999');box('capture_finish_delay','delay 100');box('capture_edge','edge~');box('capture_done','measurecomplete',cls='message')
wire('capture',0,'capture_diff');wire('capture',0,'capture_end');wire('capture_end',0,'capture_edge');wire('capture_edge',0,'capture_finish_delay');wire('capture_finish_delay',0,'capture_done');wire('capture_done',0,'engine')
box('capture_progress','snapshot~ 100');box('capture_pre','prepend measureprogress');wire('capture',0,'capture_progress');wire('capture_progress',0,'capture_pre');wire('capture_pre',0,'engine')
box('capture_written','measurewritten',cls='message');wire('capturebuf',1,'capture_written');wire('capture_written',0,'engine')
box('dynpack','pak 0. 0. 0. 0. 0.');box('dynpre','prepend dynmeter');wire('dynpack',0,'dynpre');wire('dynpre',0,'engine')
for i in range(5):
 box('dynsnap'+str(i),'snapshot~ 40');wire('dynamic',i+2,'dynsnap'+str(i));wire('dynsnap'+str(i),0,'dynpack',i)
box('dsp','dspstate~');box('sr','prepend samplerate');wire('dsp',1,'sr');wire('sr',0,'engine');box('lb','live.thisdevice');wire('lb',0,'engine')
label('title','DOPPELGANGER', [12,5,190,25],18);label('sub','YOUR TRACK. THEIR TONE.  /  v0.2', [213,10,250,16],10)
for s,name,x in [(0,'Source',12),(1,'Ref A',126),(2,'Ref B',240)]:
 ui('load'+str(s),'textbutton',[x,32,104,21],text='Choose '+name,mode=0);box('read'+str(s),'opendialog');box('path'+str(s),'prepend replace');box('name'+str(s),'prepend audioselected '+str(s));box('buf'+str(s),'buffer~ #0-'+['source','refA','refB'][s]+' 1 2',varname='buf'+str(s));box('ana'+str(s),'analyze '+str(s),cls='message');wire('load'+str(s),0,'read'+str(s));wire('read'+str(s),0,'path'+str(s));wire('read'+str(s),0,'name'+str(s));wire('name'+str(s),0,'engine');wire('path'+str(s),0,'buf'+str(s));ui('drop'+str(s),'dropfile',[x,55,104,16],numinlets=1,numoutlets=2);label('droptext'+str(s),'or drop audio here',[x+3,55,100,16],9);wire('drop'+str(s),0,'path'+str(s));wire('drop'+str(s),0,'name'+str(s));wire('buf'+str(s),1,'ana'+str(s));wire('ana'+str(s),0,'engine')
for slot in range(3):
 tag=str(slot);box('selectfile'+tag,'t s s')
 lines[:]=[l for l in lines if not(l['patchline']['source'][0] in ['read'+tag,'drop'+tag] and l['patchline']['destination'][0] in ['path'+tag,'name'+tag])]
 wire('read'+tag,0,'selectfile'+tag);wire('drop'+tag,0,'selectfile'+tag);wire('selectfile'+tag,1,'name'+tag)
# Capture the actual buffer filename before analysis, including files loaded via drop.
for slot in range(3):
 tag=str(slot);box('fileinfo'+tag,'info~ #0-'+['source','refA','refB'][slot]);box('fileloaded'+tag,'t b b');box('actualname'+tag,'prepend audioselected '+tag)
 lines[:]=[l for l in lines if not (l['patchline']['source']==['buf'+tag,1] and l['patchline']['destination']==['ana'+tag,0])]
 wire('buf'+tag,1,'fileloaded'+tag);wire('fileloaded'+tag,1,'fileinfo'+tag);wire('fileinfo'+tag,9,'actualname'+tag);wire('actualname'+tag,0,'engine');wire('fileloaded'+tag,0,'ana'+tag)
ui('restore','textbutton',[354,32,110,21],text='Reset demo',mode=0);box('rst','resetprofiles',cls='message');wire('restore',0,'rst');wire('rst',0,'engine')
control('mode','Mode',[12,75,154,20],0,2,0,['Mode: Advice (dry)','Mode: Filters','Mode: Precision'])
control('style','Style',[174,75,130,20],0,3,0,['Style: Faithful','Style: Warm','Style: Air','Style: Club'])
box('style_enabled','== 1');box('style_active','prepend active');wire('mode',0,'style_enabled');wire('style_enabled',0,'style_active');wire('style_active',0,'style')
label('range','Analyze from / to %',[313,76,150,17])
control('start','Start',[317,99,47,47],0,99,0);control('end','End',[370,99,47,47],1,100,100)
for id,name,x,lo,hi,val in [('blend','A → B',12,0,100,50),('amount','Intensity',72,0,100,60),('limit','Max Correction dB',132,0,9,4),('output','Output',192,-18,6,0),('drive','Drive',252,0,9,0)]:control(id,name,[x,100,53,47],lo,hi,val)
ui('reanalyze','textbutton',[423,106,41,21],text='Scan',mode=0);box('rescan','analyze 0',cls='message');wire('reanalyze',0,'rescan');wire('rescan',0,'engine')
label('status','Load source and a reference',[12,149,965,18],10);wire('engine',3,'status')
ui('graph','jsui',[478,5,500,132],filename='doppelganger_graph.js',numinlets=1,numoutlets=1);wire('engine',4,'graph');box('edit_route','route amount output drive bypass');wire('graph',0,'edit_route');wire('edit_route',0,'amount');wire('edit_route',1,'output');wire('edit_route',2,'drive');wire('edit_route',3,'bypass');wire('edit_route',4,'engine')
ui('expand','textbutton',[478,138,108,18],text='Open EQ editor',mode=0)
box('open_editor','open',cls='message');box('editor_control','pcontrol');wire('expand',0,'open_editor');wire('open_editor',0,'editor_control')
editor={'fileversion':1,'rect':[100,30,1040,560],'openrect':[100,30,1040,560],'enablehscroll':0,'enablevscroll':0,'openinpresentation':1,'bgcolor':[.055,.075,.095,1],'boxes':[{'box':{'id':'in','maxclass':'inlet','patching_rect':[10,580,25,25]}},{'box':{'id':'ui','maxclass':'jsui','filename':'doppelganger_graph.js','numinlets':1,'numoutlets':1,'patching_rect':[0,0,1040,560],'presentation':1,'presentation_rect':[0,0,1040,560]}},{'box':{'id':'out','maxclass':'outlet','patching_rect':[50,580,25,25]}}],'lines':[{'patchline':{'source':['in',0],'destination':['ui',0]}},{'patchline':{'source':['ui',0],'destination':['out',0]}}]}
# DSP computes FFT power; the editor paints it on its own exact log-frequency grid.
box('spectrumL','buffer~ #0-spectrumL 400 1');box('spectrumR','buffer~ #0-spectrumR 400 1')
box('fft','pfft~ doppelganger_fft 8192 4 args #0-spectrumL #0-spectrumR',numinlets=2,numoutlets=0);wire('mixL',0,'fft');wire('mixR',0,'fft',1)
fft_boxes=[];fft_lines=[]
def fb(id,text,rect):fft_boxes.append({'box':{'id':id,'maxclass':'newobj','text':text,'patching_rect':rect}})
def fw(a,o,b,i=0):fft_lines.append({'patchline':{'source':[a,o],'destination':[b,i]}})
for ch in [1,2]:
 x=30+(ch-1)*260;tag=str(ch)
 fb('in'+tag,'fftin~ '+tag,[x,30,100,22]);fb('re'+tag,'*~',[x,80,45,22]);fb('im'+tag,'*~',[x+80,80,45,22]);fb('sum'+tag,'+~',[x,120,45,22]);fb('write'+tag,'poke~ #'+tag,[x,160,140,22])
 fw('in'+tag,0,'re'+tag);fw('in'+tag,0,'re'+tag,1);fw('in'+tag,1,'im'+tag);fw('in'+tag,1,'im'+tag,1);fw('re'+tag,0,'sum'+tag);fw('im'+tag,0,'sum'+tag,1);fw('sum'+tag,0,'write'+tag);fw('in'+tag,2,'write'+tag,1)
(out/'doppelganger_fft.maxpat').write_text(json.dumps({'patcher':{'fileversion':1,'rect':[0,0,600,250],'boxes':fft_boxes,'lines':fft_lines}},indent=2))
box('editor','p doppelgänger',numinlets=1,numoutlets=1,patcher=editor);wire('engine',4,'editor');wire('editor',0,'edit_route');wire('editor_control',0,'editor')
label('edit_hint','Click curve: add  /  Click dot: remove',[596,139,377,17],9)
# Separate label, knob and numeric value vertically; merge click/drop file targets.
layout={'mode':[12,62,154,20],'style':[174,62,130,20],'range':[313,63,150,17],
 'start':[317,118,47,24],'end':[370,118,47,24],'reanalyze':[423,118,41,24],
 'graph':[478,5,500,124],'expand':[478,132,108,18],'edit_hint':[596,133,377,17],
 'status':[478,153,500,15]}
for idx,bid in enumerate(['blend','amount','limit','output','drive']):layout[bid]=[12+idx*60,118,53,24]
for idx,x in enumerate([12,126,240]):
 layout['load'+str(idx)]=[x,32,104,25];layout['drop'+str(idx)]=[x,32,104,25]
for entry in boxes:
 b=entry['box'];bid=b['id']
 if bid in layout:b['presentation_rect']=layout[bid];b['patching_rect']=layout[bid]
 if b['maxclass']=='live.dial':b.update(showname=0,shownumber=0)
 if bid.startswith('droptext'):b.update(presentation=0,hidden=1)
 if b['maxclass']=='dropfile':b.update(background=1,border=0,rounded=6)
 if bid in ['load0','load1','load2']:
  b['text']=['Source · click / drop','Ref A · click / drop','Ref B · click / drop'][int(bid[-1])];b['fontsize']=9
for bid,title in [('blend','A / B'),('amount','Intensity'),('limit','Limit · dB'),('output','Output · dB'),('drive','Drive · dB'),('start','Start · %'),('end','End · %')]:
 rect=layout[bid];label('caption_'+bid,title,[rect[0],91,rect[2],15],10)
 label('value_'+bid,'0',[rect[0],148,rect[2],16],10)
 box('format_'+bid,'sprintf '+('%.1f' if bid in ['limit','output','drive'] else '%.0f'));box('value_set_'+bid,'prepend set')
 wire(bid,0,'format_'+bid);wire('format_'+bid,0,'value_set_'+bid);wire('value_set_'+bid,0,'value_'+bid)
for entry in boxes:
 if entry['box']['id'].startswith(('caption_','value_')):entry['box']['textjustification']=1
# Full-file analysis is the default workflow; retain legacy parameter IDs invisibly.
for entry in boxes:
 b=entry['box']
 if b['id'] in ['start','end','caption_start','caption_end','value_start','value_end','range']:
  b.update(presentation=0,hidden=1)
 if b['id']=='reanalyze':
  b.update(text='Analyze source',presentation_rect=[323,112,141,28],patching_rect=[323,112,141,28])
label('fullfile_hint','Full track',[323,91,141,15],10)
# Compact panel: consistent margins and a dedicated footer for actions/status.
polish={'title':[16,8,200,26],'sub':[224,15,150,16],'restore':[380,12,78,20],
 'mode':[16,66,212,20],'style':[246,66,212,20],
 'graph':[478,8,500,124],'expand':[478,140,148,22],'reanalyze':[638,140,138,22],
 'status':[788,142,190,18]}
for i,x in enumerate([16,165,314]):
 polish['load'+str(i)]=[x,36,144,23];polish['drop'+str(i)]=[x,36,144,23]
for i,bid in enumerate(['blend','amount','limit','output','drive']):
 x=16+i*90;polish[bid]=[x,119,76,24];polish['caption_'+bid]=[x,95,76,15];polish['value_'+bid]=[x,149,76,16]
for entry in boxes:
 b=entry['box'];bid=b['id']
 if bid in polish:b['presentation_rect']=polish[bid];b['patching_rect']=polish[bid]
 if bid in ['edit_hint','fullfile_hint']:b.update(presentation=0,hidden=1)
 if bid in ['load0','load1','load2']:
  b['text']=['Source','Reference A','Reference B'][int(bid[-1])];b['fontsize']=11;b['hint']='Click to choose audio, or drop a file here.'
 if bid.startswith('caption_'):
  b['text']={'caption_blend':'A / B blend','caption_amount':'Intensity','caption_limit':'Limit · dB','caption_output':'Output · dB','caption_drive':'Drive · dB'}.get(bid,b.get('text',''))
 if bid=='expand':b['text']='Open EQ editor'
 if bid=='status':b['fontsize']=9
# Narrow the compact strip without changing label / knob / value heights.
compact={'title':[12,8,176,26],'sub':[194,15,112,16],'restore':[318,12,78,20],
 'mode':[12,66,140,20],'style':[162,66,146,20],
 'graph':[416,8,352,154],'expand':[318,66,78,20],'reanalyze':[552,140,118,22],
 'status':[680,143,88,18]}
for i,x in enumerate([12,142,272]):
 compact['load'+str(i)]=[x,36,124,23];compact['drop'+str(i)]=[x,36,124,23]
for i,bid in enumerate(['blend','limit','output','drive','wet']):
 x=12+i*78;compact[bid]=[x,119,72,24];compact['caption_'+bid]=[x,95,72,15];compact['value_'+bid]=[x,149,72,16]
for entry in boxes:
 b=entry['box']
 if b['id'] in compact:b['presentation_rect']=compact[b['id']];b['patching_rect']=compact[b['id']]
label('caption_wet','Dry/Wet',[324,95,72,15],10);label('value_wet','100%',[324,149,72,16],10)
box('format_wet','sprintf %.0f');box('set_wet','prepend set');wire('wet',0,'format_wet');wire('format_wet',0,'set_wet');wire('set_wet',0,'value_wet')
for e in boxes:
 b=e['box']
 if b['id'] in ['amount','caption_amount','value_amount']:b.update(presentation=0,hidden=1)
 if b['id'] in ['caption_wet','value_wet']:b['textjustification']=1

# Shared progress footer remains visible when the EQ panel is folded.
ui('progress','jsui',[134,8,80,26],filename='doppelganger_status.js',numinlets=1,numoutlets=0);wire('engine',4,'progress')
ui('fold','live.text',[318,12,78,20],text='Show EQ',texton='Hide EQ',mode=1,varname='fold',parameter_enable=1,numinlets=1,numoutlets=2,saved_attribute_attributes={'valueof':{'parameter_longname':'Show compact EQ','parameter_shortname':'Show EQ','parameter_type':2,'parameter_enum':['Hidden','Visible'],'parameter_mmax':1,'parameter_initial_enable':1,'parameter_initial':[1]}})
params['fold']=['Show compact EQ','Show EQ',0]
box('width_select','sel 0 1');box('width_small','setwidth 408',cls='message');box('width_large','setwidth 780',cls='message');wire('fold',0,'width_select');wire('width_select',0,'width_small');wire('width_select',1,'width_large');wire('width_small',0,'lb');wire('width_large',0,'lb')
for e in boxes:
 b=e['box'];bid=b['id']
 if bid in ['restore','reanalyze','status','title']:b.update(presentation=0,hidden=1)
 if bid=='expand':b.update(text='EQ editor')
 if bid=='caption_limit':b.update(text='Correction',fontsize=9,presentation_rect=[88,89,76,27],patching_rect=[88,89,76,27])
 if bid=='format_limit':b['text']='sprintf %.2f'
 if bid=='limit':b['saved_attribute_attributes']['valueof'].update(parameter_steps=901,parameter_unitstyle=1,parameter_longname='Max Correction dB',parameter_shortname='Max Correction')

p={'fileversion':1,'appversion':{'major':9,'minor':0,'revision':5,'architecture':'x64','modernui':1},'classnamespace':'box','rect':[0,0,1000,850],'openrect':[0,0,780,169],'openinpresentation':1,'devicewidth':780,'bgcolor':[.09,.11,.14,1],'default_fontsize':11,'boxes':boxes,'lines':lines,'parameters':params,'latency':256,'dependency_cache':[{'name':'doppelganger_fft.maxpat','type':'JSON','implicit':1},{'name':'doppelganger_dynamic.gendsp','type':'gend','implicit':1}]+[{'name':n,'type':'TEXT','implicit':1} for n in ['doppelganger_core.js','doppelganger_defaults.js','doppelganger_engine.js','doppelganger_graph.js','doppelganger_measure.js','doppelganger_library.js','doppelganger_bypass.js','doppelganger_progress.js','doppelganger_status.js','doppelganger_platform.js']],'project':{'version':1,'amxdtype':1633771873,'devpath':'.','devpathtype':0,'autolocalize':0,'contents':{'patchers':{}}}}
hints={'wet':'0%: original audio. 100%: processed audio. Latency-aligned linear blend; EQ strength remains on the Analysis page.', 'mode':'Advice leaves audio dry. Filters applies a broad reference-inspired tone. Precision fits the reference more closely and enables Drive. Both processing modes use a -1 dB sample-peak limiter.', 'blend':'0% = reference A only. 100% = reference B only. 50% blends their tonal profiles.', 'amount':'How much of the reference tone to apply. Begin around 30-60%.', 'limit':'0.01 dB resolution. Hold Shift while dragging for fine adjustment. Maximum requested EQ correction and individual band gain in dB. Overlapping bands can slightly exceed this at some frequencies.', 'output':'Output trim after estimated EQ level compensation. Advice mode ignores this.', 'drive':'Extra level into the limiter in Precision mode only. Raise gradually; this is not automatic LUFS matching.', 'style':'Faithful keeps the reference tone. Warm adds low-frequency emphasis. Air adds brightness. Club emphasizes bass and reduces low mids. Active in Filters mode.', 'start':'Start of the analysis selection as a percentage of the loaded file. Set before choosing a file.', 'end':'End of the analysis selection as a percentage of the loaded file. Set before choosing a file.', 'reanalyze':'Analyze the entire loaded source. Reference files are analyzed in full when chosen or dropped.', 'restore':'Clear the loaded spectral profiles.'}
for entry in boxes:
 b=entry['box']
 if b['id'] in hints:b['annotation']=hints[b['id']];b['hint']=hints[b['id']]
for entry in list(boxes):
 b=entry['box']
 if b['maxclass']=='textbutton':
  bid=b['id'];b.update(maxclass='live.text',mode=0,outputmode=0,numinlets=1,numoutlets=2,parameter_enable=1,varname=bid,texton=b['text'],saved_attribute_attributes={'valueof':{'parameter_longname':b['text'],'parameter_shortname':b['text'],'parameter_type':2,'parameter_enum':['off','on'],'parameter_mmax':1,'parameter_initial_enable':1,'parameter_initial':[0]}})
  trigger=bid+'_trigger'
  for line in lines:
   if line['patchline']['source'][0]==bid:line['patchline']['source']=[trigger,0]
  box(trigger,'delay 100');box(bid+'_select','sel 1');box(bid+'_route','route bang');wire(bid,0,bid+'_route');wire(bid+'_route',0,trigger);wire(bid+'_route',1,bid+'_select');wire(bid+'_select',0,trigger)
# Shared device palette, matching the large editor.
p['bgcolor']=[.045,.053,.064,1]
for entry in boxes:
 b=entry['box'];cls=b['maxclass']
 if cls in ['comment','live.text','live.dial','live.menu']:
  b['fontname']='Helvetica Neue'
 if cls=='comment':b['textcolor']=[.60,.67,.72,1]
 if b['id']=='style':b.update(active=0,textcolor=[.35,.40,.44,1],bgcolor=[.07,.08,.09,1],annotation='Style is available in Filters mode only. Your selection is remembered while disabled.',hint='Style is available in Filters mode only. Your selection is remembered while disabled.')
 if cls=='live.dial':
  b.update(activedialcolor=[.43,.87,.75,1],activefgdialcolor=[.17,.21,.24,1],activeneedlecolor=[.86,.95,.92,1],textcolor=[.78,.83,.86,1],panelcolor=[.045,.053,.064,1],bordercolor=[.12,.15,.18,1])
 if cls=='live.text':
  b.update(activebgcolor=[.09,.12,.14,1],activebgoncolor=[.13,.23,.22,1],activetextcolor=[.78,.83,.86,1],activetextoncolor=[.43,.87,.75,1],bordercolor=[.16,.20,.23,1])
 if b['id']=='title':b.update(text='doppelgänger',presentation=1,hidden=0,presentation_rect=[12,8,122,26],patching_rect=[12,8,122,26],fontsize=18,textcolor=[.86,.89,.91,1])
 if b['id']=='sub':b.update(presentation=0,hidden=1)
 if b['id']=='bypass':b.update(presentation=0,hidden=1,activebgoncolor=[.30,.19,.10,1],activetextoncolor=[.98,.73,.43,1],hint='Bypass all audio processing. Your settings and Dry/Wet value are kept. Click again to resume.')
# File/dialog actions are momentary commands, never restored as automation toggles.
for e in list(boxes):
 b=e['box'];bid=b['id']
 if bid in ['load0','load1','load2','restore','reanalyze','expand']:
  b['parameter_enable']=1
  box(bid+'_resetvalue','set 0',cls='message');wire(bid+'_trigger',0,bid+'_resetvalue');wire(bid+'_resetvalue',0,bid)
box('actions_ready','delay 1200');wire('lb',0,'actions_ready');box('actions_enable','1',cls='message');wire('actions_ready',0,'actions_enable')
for bid in ['load0','load1','load2','expand','reanalyze']:
 gate=bid+'_readygate';box(gate,'gate 1 0')
 for l in lines:
  if l['patchline']['source']==[bid+'_trigger',0] and l['patchline']['destination'][0] not in [bid+'_resetvalue']:l['patchline']['source']=[gate,0]
 wire(bid+'_trigger',0,gate,1);wire('actions_enable',0,gate);wire('actions_ready',0,bid+'_resetvalue')
# A legacy saved Reset Demo value must never overwrite a restored profile.
lines[:]=[l for l in lines if l['patchline']['destination'][0]!='rst']
box('correction_visual','prepend correctionlimit');wire('limit',0,'correction_visual');wire('correction_visual',0,'graph');wire('correction_visual',0,'editor')
for item in lines:
 w=item['patchline']
 if w['source']==['limit',0]:w['order']=0 if w['destination'][0]=='correction_visual' else 1
# Self-contained audio-effect project metadata; no installed Ableton template needed.
p['project']={'version':1,'amxdtype':1633771873,'devpath':'.','devpathtype':0,'autolocalize':0,'autoorganize':1,'hideprojectwindow':1,'showdependencies':1,'contents':{'patchers':{}},'layout':{},'searchpath':{},'readonly':0}
theme=json.loads((out/'industrial-theme.json').read_text())
p['bgcolor']=theme['bgcolor']
for item in p['boxes']:item['box'].update(theme['styles'].get(item['box']['id'],{}))
p['boxes'].extend(theme['decorations'])
from live_build import integrate
integrate(p,out)
data=json.dumps({'patcher':p},indent=2).encode()+b'\0';header=b'ampf'+struct.pack('<I',4)+b'aaaa'+b'meta'+struct.pack('<II',4,0)+b'ptch'+struct.pack('<I',len(data));(out/'doppelgänger.amxd').write_bytes(header+data);(out/'doppelgänger.maxpat').write_bytes(data[:-1]);print('Built',len(boxes),'objects',len(lines),'connections')
