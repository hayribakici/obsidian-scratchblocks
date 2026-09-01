---
sb-lang: it
sb-scale: 1.2
---

# Italian Scratchblocks Markdown Test

This file checks a larger Italian Scratchblocks note with local markdown settings.
The prose stays in English so test failures and fixture intent remain easy to scan.

## Motion, control, and looks

This script starts with the green flag, moves the sprite, reacts to a condition,
and broadcasts a completion message.

```scratchblocks
quando si clicca su @greenFlag
porta [punti v] a (0)
vai a x: (0) y: (0)
ripeti (10)  volte
  fai (10) passi
  cambia [punti v] di (1)
  se <sta toccando [bordo v]> allora
    rimbalza quando tocchi il bordo
    ruota @turnRight di (15) gradi
  altrimenti
    dire [Continuo a camminare.] per (1) secondi
  end
end
invia a tutti [fine v]
```

## Broadcast receiver

This script reacts to the broadcast and uses sound and costume blocks.

```scratchblocks
quando ricevo [fine v]
riproduci suono [applauso v] e attendi la fine
passa al costume seguente
dire [Fatto!] per (2) secondi
ferma tutti i suoni
```

## Waiting and keyboard input

This script waits until the space key is pressed and then moves in a square.

```scratchblocks
quando si clicca su @greenFlag
attendi fino a quando <tasto [spazio v] premuto>
ripeti (4)  volte
  fai (50) passi
  ruota @turnRight di (90) gradi
end
dire [Quadrato completato.] per (2) secondi
```

## Inline code

The inline renderer should pick up Italian text from local frontmatter:
`sb quando si clicca su @greenFlag`

It should also handle a short Italian command inline:
`sb dire [Ciao!]`
