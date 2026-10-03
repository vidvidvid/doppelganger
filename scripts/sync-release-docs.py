from pathlib import Path
import json,re,shutil
root=Path(__file__).resolve().parents[1]
version=json.loads((root/'version.json').read_text())['version']
assert re.fullmatch(r'\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?',version),'Invalid release version'
notes=(root/'CHANGELOG.md').read_text()
assert re.search(r'^## '+re.escape(version)+r' — \d{4}-\d{2}-\d{2}$',notes,re.M),'Current version needs dated release notes'
guide=(root/'plugin/GUIDE.html').read_text()
assert 'FOR v'+version in guide,'Update the guide version and content before releasing'
site=root/'website/dist';site.mkdir(parents=True,exist_ok=True)
shutil.copy2(root/'plugin/GUIDE.html',site/'guide.html')
shutil.copytree(root/'plugin/guide-images',site/'guide-images',dirs_exist_ok=True)
shutil.copy2(root/'CHANGELOG.md',site/'CHANGELOG.md')
print('Release version, notes and guide synchronized:',version)
