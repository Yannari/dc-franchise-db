import os, glob

files = glob.glob("assets/avatars/*.png")
names = sorted(os.path.splitext(os.path.basename(f))[0] for f in files)
print("const ICONS = [")
for n in names:
    print(f'  "{n}",')
print("];")
