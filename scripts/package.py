from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1]
out=root.parent/'GreenShare_AE2_Source.zip'
excluded={'.git','node_modules','.next','.cache','.npm-cache','coverage','dist'}
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as archive:
    for p in sorted(root.rglob('*')):
        relative=p.relative_to(root)
        if not p.is_file() or any(part in excluded for part in relative.parts): continue
        if p.name.startswith('.env') and p.name!='.env.example': continue
        if p.suffix in {'.log','.tsbuildinfo'} or 'service-account' in p.name or 'firebase-adminsdk' in p.name: continue
        archive.write(p,Path('greenshare-ae2')/relative)
with zipfile.ZipFile(out) as archive:
    assert not any('/node_modules/' in n or '/.next/' in n or n.endswith('/.env.local') for n in archive.namelist())
print(out)
