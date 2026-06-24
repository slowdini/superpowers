# VHS tape for the slow-powers CLI demo (see README hero GIF).
# Regenerate with:  bun run demo   (which runs:  vhs assets/demo/tdd.tape)
# Paths are relative to the repo root, where vhs is invoked.
#
# The pacing/content lives in the actor script (tdd-playback.sh); this tape is
# just the "camera": canvas, font, and terminal theme.

Output assets/demo/tdd-demo.gif
Set Shell bash

# Terminal theme: Synthpunk Neon Dark — github.com/samiamorwas/synthpunk
# (VHS takes a named theme or inline JSON, not a file path, so it is inlined here.)
Set Theme { "name": "Synthpunk Neon Dark", "background": "#0F0620", "foreground": "#E8E0F0", "cursor": "#D040FF", "selection": "#123A52", "black": "#060210", "red": "#FF3A50", "green": "#40FF80", "yellow": "#FFE040", "blue": "#A060FF", "magenta": "#FF2A8A", "cyan": "#00E8F0", "white": "#B8A8D0", "brightBlack": "#8878A0", "brightRed": "#FF6173", "brightGreen": "#66FF99", "brightYellow": "#FFE666", "brightBlue": "#B380FF", "brightMagenta": "#FF55A1", "brightCyan": "#27F8FF", "brightWhite": "#E8E0F0" }

Set FontSize 19
Set Width 1080
Set Height 900
Set Padding 30
Set Framerate 24
Set TypingSpeed 0ms

Hide
Type "bash assets/demo/tdd-playback.sh"
Enter
Sleep 300ms
Show
Sleep 15s
