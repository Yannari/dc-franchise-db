"""Build TD OGG assets from licensed originals cached outside the repository.
Usage: python prepare.py --sources <cache-directory> --blips <extracted-itch-pack>
Requires numpy and imageio-ffmpeg (or --ffmpeg PATH). See ../SOURCES.json.
"""
import argparse, hashlib, json, math, pathlib, subprocess
import numpy as np
import imageio_ffmpeg

RATE = 44100
HERE = pathlib.Path(__file__).resolve().parents[1]
# (source, filter, gain): all source recordings are identified in SOURCES.json.
AMBIENCE = {
 'camp-day': [('forest','',.85),('stream','lowpass=f=1600',.15)],
 'camp-night': [('night','',.9),('insects','lowpass=f=4500',.1)],
 'island-day': [('sea','',1)],
 'island-night': [('calmsea','lowpass=f=3500',.9),('night','highpass=f=1200',.08)],
 'filmlot-day': [('city','lowpass=f=1700',1)],
 'filmlot-night': [('citynight','lowpass=f=1200',1)],
 'carnival-day': [('wind','lowpass=f=2200',.7),('creak','lowpass=f=1800',.12),('vent','lowpass=f=500',.2)],
 'carnival-night': [('wind','lowpass=f=1400',.6),('creak','lowpass=f=1100',.16),('night','',.12)],
 'worldtour': [('vent','lowpass=f=1300',.9),('plane','lowpass=f=400',.15)],
 'indoor': [('room','',1)],
 'rain': [('rain','',1)],
 'campfire': [('fire','',1)],
}
SFX = {
 'confessional': [('static','highpass=f=400',1)],
 'boat-horn': [('horn','',1)],
 'motorboat': [('boat','highpass=f=80',1)],
 'bus-engine': [('bus','lowpass=f=1800',1)],
 'bus-door': [('creak','highpass=f=300',.6),('blow','highpass=f=1500',.7)],
 'helicopter': [('heli','',1)],
 'jet': [('plane','lowpass=f=1000',.7),('whoosh','',.6)],
 'door-slam': [('door','',1)],
 'splash': [('splash','',1)],
 'thunder': [('thunder','',1)],
 'anvil': [('anvil','',1)],
 'bonk': [('bonk','asetrate=35280,aresample=44100',1)],
 'boing': [('boing','',1)],
 'fall-whistle': [('whistle','',1)],
 'record-scratch': [('scratch','',1)],
 'torch-light': [('whoosh','',.8),('fire','highpass=f=500',.25)],
 'torch-snuff': [('blow','highpass=f=250',.9),('fire','lowpass=f=1500',.15)],
 'pencil': [('pencil','',1)],
 'ballot-drop': [('paper','',1)],
 'idol': [('magic','',1)],
 'applause': [('applause','',1)],
 'cheer': [('cheer','',1)],
 'boo': [('boo','',1)],
 'phone-ring': [('phone','',1)],
}
DESIGNED = {
 'carnival-day': 'Designed empty fairground: wind, sparse metal creaks and a low ventilation hum; no music or visitors.',
 'carnival-night': 'Designed empty fairground at night: wind, sparse creaks and distant night insects.',
 'worldtour': 'Designed cabin rumble from ventilation and low-passed propeller-plane audio; not a jet-cabin field recording.',
 'bus-door': 'Designed pneumatic door from a metal-door creak and a filtered breath hiss; not a recorded bus door.',
 'jet': 'Designed short aircraft transition from a low-passed propeller plane and a rope whoosh; not a jet field recording.',
 'motorboat': 'Engine/water excerpt from a ferry back deck; larger vessel rather than a small outboard motor.',
 'rain': 'Rain on a terrace; not a rain-on-leaves field recording.',
 'torch-light': 'Designed fire ignition from rope whoosh and fire crackle.',
 'torch-snuff': 'Designed extinguish from breath and fire crackle.',
 'ballot-drop': 'Paper-handling foley excerpt used for a ballot landing.',
}
def ff(args, data=None):
    p = subprocess.run([FFMPEG, '-hide_banner','-loglevel','error',*args],input=data,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    if p.returncode: raise RuntimeError(p.stderr.decode(errors='replace'))
    return p.stdout
def decode(path, filt=''):
    args = ['-i',str(path)]
    if filt: args += ['-af',filt]
    return np.frombuffer(ff([*args,'-ar',str(RATE),'-ac','2','-f','f32le','-']),dtype='<f4').reshape(-1,2).copy()
def rms(x): return float(np.sqrt(np.mean(x.astype(np.float64)**2)))
def normalize(x, target_rms=None, peak=.82):
    x = x - np.mean(x,axis=0)
    if target_rms is not None: x *= target_rms/max(rms(x),1e-9)
    maximum=float(np.max(np.abs(x)))
    if maximum>peak: x *= peak/maximum
    return x
def loopify(x, seconds=90):
    # Overlap-add repeated source, then fold its final overlap onto the start.
    # Both sides of the file boundary follow the same original waveform.
    n=int(seconds*RATE); fade=min(2*RATE,len(x)//4)
    if fade<100: raise ValueError('Source too short for ambience')
    w=(.5-.5*np.cos(np.linspace(0,np.pi,fade)))[:,None]
    base=x
    while len(x)<n+fade:
        x=np.concatenate((x[:-fade],x[-fade:]*(1-w)+base[:fade]*w,base[fade:]))
    segment=x[:n+fade].copy()
    segment[:fade]=segment[n:n+fade]*(1-w)+segment[:fade]*w
    return segment[:n]
def excerpt(x, limit=2.8):
    # Pick the strongest short window, retaining 60ms before the loudest point.
    mono=np.mean(x*x,axis=1)
    win=max(1,int(.01*RATE))
    energy=np.convolve(mono,np.ones(win)/win,mode='same')
    threshold=max(float(np.max(energy))*.001,1e-10)
    active=np.flatnonzero(energy>threshold)
    if not len(active): raise ValueError('Silent source')
    start=max(0,int(active[0])-int(.002*RATE)); end=int(active[-1])+1
    maxn=int(limit*RATE)
    if end-start>maxn:
        strongest=int(np.argmax(energy))
        start=max(start,strongest-int(.06*RATE))
        end=min(len(x),start+maxn)
    x=x[start:end].copy()
    # Strip any remaining quiet lead after choosing the window.
    envelope=np.max(np.abs(x),axis=1)
    active=np.flatnonzero(envelope>max(float(np.max(envelope))*.012,1e-6))
    if len(active): x=x[max(0,int(active[0])-int(.002*RATE)):]
    a=min(int(.003*RATE),len(x)//4); b=min(int(.045*RATE),len(x)//4)
    x[:a]*=np.linspace(0,1,a)[:,None]
    x[-b:]*=np.linspace(1,0,b)[:,None]
    return x[:maxn]
def encode(path,x,category):
    path.parent.mkdir(parents=True,exist_ok=True)
    ff(['-y','-f','f32le','-ar',str(RATE),'-ac','2','-i','-','-c:a','libvorbis','-q:a','3' if category=='amb' else '5','-map_metadata','-1',str(path)],x.astype('<f4').tobytes())
    decoded=decode(path)
    if not np.isfinite(decoded).all() or rms(decoded)<1e-6: raise ValueError('Invalid/silent output '+str(path))
    duration=len(decoded)/RATE
    if category=='amb': assert 60<=duration<=180
    else: assert 0<duration<3
    peak=float(np.max(np.abs(decoded)))
    assert peak<1, (path,peak)
    energy=np.mean(decoded**2,axis=1)
    audible=np.flatnonzero(energy>max(float(energy.max())*.0002,1e-10))
    lead=float(audible[0]/RATE) if len(audible) else duration
    if category!='amb': assert lead<.03,(path,lead)
    seam=float(np.max(np.abs(decoded[0]-decoded[-1])))
    # Compare boundary with normal sample-to-sample motion, allowing codec rounding.
    typical=float(np.quantile(np.max(np.abs(np.diff(decoded,axis=0)),axis=1),.999))
    if category=='amb': assert seam<=max(.005,typical*2),(path,seam,typical)
    return {'file':str(path.relative_to(HERE)).replace('\\','/'),'seconds':round(duration,5),'sampleRate':RATE,'channels':2,
            'peakDbFS':round(20*math.log10(max(peak,1e-12)),2),'rmsDbFS':round(20*math.log10(rms(decoded)),2),
            'leadingSilenceMs':round(lead*1000,2),'loopBoundaryDelta':round(seam,7),
            'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size}
LIMITS = {'confessional': .28, 'torch-snuff': .75, 'ballot-drop': .45}
def mix(parts, amb, limit=2.8):
    arrays=[]
    for key,filt,gain in parts:
        data=decode(CACHE/(key+'.wav'),filt)
        if amb:
            # Keep intermittent creaks sparse instead of repeating every few seconds.
            if key=='creak':
                event=excerpt(data,1.5); padded=np.zeros((25*RATE,2),np.float32);padded[6*RATE:6*RATE+len(event)]=event;data=padded
            data=loopify(data)
            data=normalize(data,.075,.6)*gain
        else: data=normalize(excerpt(data,limit),.18,.8)*gain
        arrays.append(data)
    length=max(map(len,arrays)); combined=np.zeros((length,2),np.float32)
    for a in arrays: combined[:len(a)]+=a
    return normalize(combined,.07 if amb else None,.82)
def main():
    global FFMPEG,CACHE
    ap=argparse.ArgumentParser();ap.add_argument('--sources',type=pathlib.Path,required=True);ap.add_argument('--blips',type=pathlib.Path,required=True);ap.add_argument('--ffmpeg')
    args=ap.parse_args();CACHE=args.sources;FFMPEG=args.ffmpeg or imageio_ffmpeg.get_ffmpeg_exe()
    metadata=json.loads((CACHE/'source-metadata.json').read_text(encoding='utf8'))
    for key, info in metadata.items():
        original=CACHE/(key+'.wav')
        if original.exists(): info['originalSha256']=hashlib.sha256(original.read_bytes()).hexdigest()
    report=[]
    for cat,table in [('amb',AMBIENCE),('sfx',SFX)]:
        for name,parts in table.items():
            path=HERE/cat/(name+'.ogg')
            row=encode(path,mix(parts,cat=='amb',LIMITS.get(name,2.8)),cat)
            row['sources']=[p[0] for p in parts];row['filters']=[p[1] for p in parts];row['processing']='90-second overlap-add seamless loop' if cat=='amb' else 'Audible-onset trim, event excerpt, 3ms attack/45ms release, peak limiting'
            if name in DESIGNED: row['note']=DESIGNED[name]
            report.append(row); print(row['file'],row['seconds'],flush=True)
    # dmochas: 001–010 mid, 011–020 low, 021–030 high. Use six originals in each register.
    for register,offset in [('high',20),('mid',0),('low',10)]:
        for i in range(1,7):
            filename='bleep%03d.wav'%(offset+i)
            candidates=[p for p in args.blips.rglob(filename) if '__MACOSX' not in str(p)]
            assert len(candidates)==1,(filename,candidates)
            x=normalize(excerpt(decode(candidates[0])),None,.7)
            row=encode(HERE/'voice'/(register+'-'+str(i)+'.ogg'),x,'voice')
            row.update(sources=['dmochas'],original=filename,processing='Original blip, silence trimmed, short edge fades and level matched; no voice cloning')
            report.append(row);print(row['file'],row['seconds'],flush=True)
    metadata['dmochas']={'title':'Text/Dialogue Bleeps Pack','author':'dmochas','page':'https://dmochas-assets.itch.io/dmochas-bleeps-pack','license':'CC-BY-4.0','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','attribution':'Text/Dialogue Bleeps Pack by dmochas, CC BY 4.0. Trimmed, faded and encoded to OGG for this project.'}
    (HERE/'SOURCES.json').write_text(json.dumps({'retrieved':'2026-10-11','sources':metadata,'assets':report},indent=2)+'\n',encoding='utf8')
    (HERE/'verification.json').write_text(json.dumps({'files':len(report),'totalBytes':sum(r['bytes'] for r in report),'ambienceSeconds':90,'checks':['decode','finite samples','non-silent','peak below 0 dBFS','ambience 60–180 seconds','effects/voices under 3 seconds','effects/voices under 30ms leading silence','ambience boundary continuity'],'listeningReview':'Not performed by automated processing; use preview.html to audition.'},indent=2)+'\n',encoding='utf8')
if __name__=='__main__':main()
