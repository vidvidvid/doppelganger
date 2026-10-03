import json,struct

def integrate(p,out):
 def obj(i,text='',cls='newobj',rect=None,**kw):
  b=dict(id=i,maxclass=cls,patching_rect=rect or [20,1000,230,22],**kw)
  if text:b['text']=text
  p['boxes'].append({'box':b});return b
 def wire(a,o,b,i=0):p['lines'].append({'patchline':{'source':[a,o],'destination':[b,i]}})
 def capture(prefix,inp,target):
  obj(prefix+'buf','buffer~ #0-learn 20000 2 @format float32')
  obj(prefix+'rec','record~ #0-learn 2')
  obj(prefix+'js','js doppelganger_capture.js #0-learn #0',numoutlets=3)
  obj(prefix+'snap','snapshot~ 100');obj(prefix+'progress','prepend progress')
  obj(prefix+'dsp','dspstate~');obj(prefix+'sr','prepend samplerate')
  wire(inp,0,prefix+'rec');wire(inp,1,prefix+'rec',1)
  wire(prefix+'rec',0,prefix+'snap');wire(prefix+'snap',0,prefix+'progress');wire(prefix+'progress',0,prefix+'js')
  wire(prefix+'dsp',1,prefix+'sr');wire(prefix+'sr',0,prefix+'js')
  wire(prefix+'js',0,prefix+'rec');wire(prefix+'js',1,prefix+'buf');wire(prefix+'js',2,target)
 capture('learn','in','engine')
 obj('source_route','route local master');wire('engine',7,'source_route');wire('source_route',0,'learnjs')
 obj('master_send','s doppelganger-master-request-v1');wire('source_route',1,'master_send')
 obj('master_receive','r doppelganger-master-response-v1');wire('master_receive',0,'engine')
 obj('sourceaction','sourceaction',cls='message');wire('load0_readygate',0,'sourceaction');wire('sourceaction',0,'engine')
 p['lines'][:]=[x for x in p['lines'] if not (x['patchline']['source'][0]=='load0_readygate' and x['patchline']['destination'][0]=='read0')]
 for x in p['boxes']:
  b=x['box']
  if b['id']=='engine':b['numoutlets']=8
  if b['id'] in ['load0','drop0']:b['presentation_rect']=[70,36,66,23]
  if b['id']=='read0':b['varname']='read0'
 obj('source_mode','',cls='umenu',rect=[12,36,54,23],presentation=1,presentation_rect=[12,36,54,23],items=['Live',',','Master',',','File'],varname='source_mode',fontsize=10)
 obj('source_mode_pre','prepend sourcemode');wire('source_mode',0,'source_mode_pre');wire('source_mode_pre',0,'engine')
 for n in ['doppelganger_capture.js','doppelganger_live.js']:p['dependency_cache'].append({'name':n,'type':'TEXT','implicit':1})
 main=p
 p={'fileversion':1,'appversion':main['appversion'],'classnamespace':'box','rect':[0,0,600,600],'openrect':[0,0,350,169],'openinpresentation':1,'devicewidth':350,'bgcolor':main['bgcolor'],'boxes':[],'lines':[],'latency':0,'project':main['project'],'dependency_cache':[{'name':n,'type':'TEXT','implicit':1} for n in ['doppelganger_core.js','doppelganger_capture.js']]}
 obj('in','plugin~');obj('out','plugout~');wire('in',0,'out');wire('in',1,'out',1)
 obj('send','s doppelganger-master-response-v1');capture('feed','in','send')
 obj('request','r doppelganger-master-request-v1');wire('request',0,'feedjs')
 for i,text,y,sz in [('title','DOPPELGÄNGER / MASTER FEED',16,16),('desc','Place last on the Master track. Audio passes unchanged.',50,11),('help','In doppelgänger: Source → Master → Learn.',76,11),('help2','Keep one active Master Feed per Live Set.',102,11),('help3','Captures up to 20s. Sends analysis only, never audio.',126,10)]:
  obj(i,text,cls='comment',rect=[12,y,330,24],presentation=1,presentation_rect=[12,y,330,24],fontsize=sz,textcolor=[1,.55,.3,1] if i=='title' else [.8,.8,.76,1])
 data=json.dumps({'patcher':p},indent=2).encode()+b'\0'
 header=b'ampf'+struct.pack('<I',4)+b'aaaa'+b'meta'+struct.pack('<II',4,0)+b'ptch'+struct.pack('<I',len(data))
 (out/'doppelgänger Master Feed.amxd').write_bytes(header+data)
 (out/'doppelgänger Master Feed.maxpat').write_bytes(data[:-1])
