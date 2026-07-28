' Launches serve.py silently in the background (no console window).
' Put a shortcut to this file in your Startup folder to auto-run at login:
'   1. Press Win+R, type  shell:startup  and press Enter.
'   2. Copy this file (or a shortcut to it) into that folder.
' Then serve.py is always running after you log in.
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = "C:\Users\yanna\OneDrive\Documents\GitHub\dc-franchise-db"
sh.Run "pythonw serve.py", 0, False
