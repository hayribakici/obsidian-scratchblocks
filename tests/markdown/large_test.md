---
sb-lang: en
sb-scale: "1.3"
---

# Scratchblocks performance test

  

This file intentionally contains many Scratchblocks render targets. Open it in Obsidian Reading mode and Live Preview, then watch the developer console for `[scratchblocks]` timing logs.

  

Inline warmup: `sb say [Hello]` `sb move (10) steps` `sb turn cw (15) degrees` `sb wait (1) seconds` `sb change [score v] by (1)`.

  

```scratchblocks

when green flag clicked

set [score v] to [0]

repeat (10)

move (10) steps

turn cw (15) degrees

change [score v] by (1)

end

say [Done!] for (2) seconds

```

  

Inline group 01: `sb when green flag clicked` `sb say [Hello 01]` `sb repeat (10)` `sb broadcast [next v]` `sb if <touching [edge v]?> then`.

  

```scratchblocks

when I receive [next v]

repeat until <(score) > (50)>

if <touching [mouse-pointer v]?> then

say [caught]

else

move (5) steps

end

end

```

  

Inline group 02: `sb play sound [pop v] until done` `sb set [x v] to (0)` `sb change x by (10)` `sb glide (1) secs to x: (0) y: (0)` `sb stop [all v]`.

  

```scratchblocks

define draw square (size)
repeat (4)
move (size) steps
turn cw (90) degrees
end

when green flag clicked
erase all
draw square (50)
draw square (100)
```

  

Inline group 03: `sb ask [Name?] and wait` `sb say (answer)` `sb join [Hello ] (answer)` `sb length of [scratchblocks]` `sb letter (1) of [abc]`.

  

```scratchblocks

when green flag clicked

ask [What is your name?] and wait

if <(answer) = [Ada]> then

say [Hello Ada]

else

say (join [Hello ] (answer))

end

```

  

Inline group 04: `sb switch costume to [costume2 v]` `sb next costume` `sb set size to (100) %` `sb change size by (10)` `sb show`.

  

```scratchblocks

when this sprite clicked

repeat (20)

next costume

change size by (5)

wait (0.1) seconds

end

set size to (100) %

```

  

Inline group 05: `sb go to x: (0) y: (0)` `sb point in direction (90)` `sb point towards [mouse-pointer v]` `sb if on edge, bounce` `sb set rotation style [left-right v]`.

  

```scratchblocks

when green flag clicked

forever

point towards [mouse-pointer v]

move (3) steps

if on edge, bounce

end

```

  

Inline group 06: `sb create clone of [myself v]` `sb delete this clone` `sb when I start as a clone` `sb hide` `sb show`.

  

```scratchblocks

when green flag clicked

repeat (25)

create clone of [myself v]

wait (0.05) seconds

end

when I start as a clone

go to x: (pick random (-200) to (200)) y: (pick random (-150) to (150))

show

wait (2) seconds

delete this clone

```

  

Inline group 07: `sb pen down` `sb pen up` `sb set pen color to [#ff0000]` `sb change pen size by (1)` `sb stamp`.

  

```scratchblocks

when green flag clicked

erase all

pen down

repeat (36)

move (100) steps

turn cw (170) degrees

change pen size by (1)

end

pen up

```

  

Inline group 08: `sb <mouse down?>` `sb <key [space v] pressed?>` `sb (timer)` `sb reset timer` `sb (loudness)`.

  

```scratchblocks

when green flag clicked

reset timer

forever

if <key [space v] pressed?> then

say (timer)

end

end

```

  

Inline group 09: `sb set [message v] to [hello]` `sb add [thing] to [list v]` `sb delete (1) of [list v]` `sb item (1) of [list v]` `sb length of [list v]`.

  

```scratchblocks

when green flag clicked

delete all of [items v]

repeat (30)

add (pick random (1) to (100)) to [items v]

end

say (join [Items: ] (length of [items v]))

```

  

Inline group 10: `sb <(score) > (10)>` `sb <not <touching [edge v]?>>` `sb <(answer) contains [a]?>` `sb ((x position) + (y position))` `sb ((timer) mod (2))`.

  

```scratchblocks

when green flag clicked

forever

if <<(score) > (10)> and <not <touching [edge v]?>>> then

say [safe]

else

say [watch out]

end

end

```

  

Inline group 11: `sb broadcast [start v]` `sb broadcast [start v] and wait` `sb when I receive [start v]` `sb stop [this script v]` `sb wait until <mouse down?>`.

  

```scratchblocks

when green flag clicked

broadcast [start v] and wait

say [finished]

when I receive [start v]

repeat (15)

play sound [pop v] until done

end

```

  

Inline group 12: `sb define jump (height)` `sb jump (10)` `sb if <(height) > (0)> then` `sb change y by (height)` `sb change y by ((0) - (height))`.

  

```scratchblocks

define jump (height)

change y by (height)

wait (0.2) seconds

change y by ((0) - (height))

when green flag clicked

repeat (20)

jump (10)

end

```

  

Final inline burst: `sb say [Hello]` `sb say [Hello]` `sb say [Hello]` `sb say [Hello]` `sb say [Hello]` `sb move (10) steps` `sb move (10) steps` `sb move (10) steps` `sb turn cw (15) degrees` `sb turn ccw (15) degrees`.