---
sb-lang: de
sb-scale: 1.2
---

# German Scratchblocks Markdown Test

This file checks a larger German Scratchblocks note with local markdown settings.
The prose stays in English so test failures and fixture intent remain easy to scan.

## Motion, control, and looks

This script starts with the green flag, moves the sprite, reacts to a condition,
and broadcasts a completion message.

```scratchblocks
Wenn @greenFlag angeklickt wird
setze [Punkte v] auf (0)
gehe zu x: (0) y: (0)
wiederhole (10) mal
  gehe (10) er Schritt
  ändere [Punkte v] um (1)
  falls <wird [Rand v] berührt?>, dann
    pralle vom Rand ab
    drehe dich @turnRight um (15) Grad
  sonst
    sage [Ich laufe weiter.] für (1) Sekunden
  end
end
sende [fertig v] an alle
```

## Broadcast receiver

This script reacts to the broadcast and uses sound and costume blocks.

```scratchblocks
Wenn ich [fertig v] empfange
spiele Klang [Applaus v] ganz
wechsle zum nächsten Kostüm
sage [Geschafft!] für (2) Sekunden
stoppe alle Klänge
```

## Waiting and keyboard input

This script waits until the space key is pressed and then moves in a square.

```scratchblocks
Wenn @greenFlag angeklickt wird
warte bis <Taste [Leertaste v] gedrückt?>
wiederhole (4) mal
  gehe (50) er Schritt
  drehe dich @turnRight um (90) Grad
end
sage [Quadrat fertig.] für (2) Sekunden
```

## Inline code

The inline renderer should pick up German text from local frontmatter:
`sb Wenn @greenFlag angeklickt wird`

It should also handle a short German command inline:
`sb sage [Hallo!]`
