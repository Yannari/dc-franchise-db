"""Download the CC0 originals listed in ../SOURCES.json into a local cache.
The dmochas pack must be downloaded free from itch.io and extracted separately.
Usage: python fetch_sources.py --cache <directory>
"""
import argparse, hashlib, json, pathlib, urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--cache',type=pathlib.Path,required=True)
args=ap.parse_args();args.cache.mkdir(parents=True,exist_ok=True)
sources=json.loads((ROOT/'SOURCES.json').read_text(encoding='utf8'))['sources']
originals={key:info for key,info in sources.items() if key!='dmochas'}
for key,info in originals.items():
    path=args.cache/(key+'.wav')
    if not path.exists():
        print('Downloading',key,flush=True)
        request=urllib.request.Request(info['download'],headers={'User-Agent':'TD-audio-preparation/1.0'})
        with urllib.request.urlopen(request,timeout=120) as response,path.open('wb') as output:
            while data:=response.read(1024*1024):output.write(data)
    if info.get('originalSha256'):
        assert hashlib.sha256(path.read_bytes()).hexdigest()==info['originalSha256'], 'Source changed: '+key
(args.cache/'source-metadata.json').write_text(json.dumps(originals,indent=2),encoding='utf8')
