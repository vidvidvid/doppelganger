from pathlib import Path
import json,zipfile
root=Path(__file__).resolve().parents[1];plugin=root/'plugin';out=root/'dist';out.mkdir(exist_ok=True)
p=json.loads((plugin/'doppelgänger.maxpat').read_text())['patcher']
names=['doppelgänger.amxd','doppelgänger Master Feed.amxd','GUIDE.html']+[d['name'] for d in p['dependency_cache']]
with zipfile.ZipFile(out/'doppelgänger-share.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in sorted(set(names)):z.write(plugin/name,'doppelgänger/'+name)
 for image in sorted((plugin/'guide-images').glob('*.jpg')):z.write(image,'doppelgänger/guide-images/'+image.name)
 z.writestr('doppelgänger/READ ME.txt','Unzip the entire folder and keep all companion files together. Drag doppelgänger.amxd into Live. Open GUIDE.html for installation, Live input, Master Feed, requirements and controls. Requires Max for Live. Windows and multi-device live-mode playback validation remain pending. Live 11 is unverified.\n')
print(out/'doppelgänger-share.zip')
