from pathlib import Path

DRY_RUN = False  # set to False to actually rename

folder = Path(".")
for p in folder.iterdir():
    if not p.is_file():
        continue

    name = p.name
    if "_" not in name:
        continue

    before = name.split("_", 1)[0]
    new_name = before + p.suffix  # keep extension
    target = folder / new_name

    # Handle collisions by adding -2, -3, ...
    if target.exists() and target.name != p.name:
        i = 2
        while True:
            candidate = folder / f"{before}-{i}{p.suffix}"
            if not candidate.exists():
                target = candidate
                break
            i += 1

    if target.name == p.name:
        continue

    if DRY_RUN:
        print(f"Would rename: {p.name} -> {target.name}")
    else:
        p.rename(target)
        print(f"Renamed: {p.name} -> {target.name}")

print(f"Done. (DRY_RUN={DRY_RUN})")
