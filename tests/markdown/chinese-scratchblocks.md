---
sb-lang: zh_cn
sb-scale: 1.2
---

# Chinese Scratchblocks Markdown Test

This file checks a larger Simplified Chinese Scratchblocks note with local markdown settings.
The prose stays in English so test failures and fixture intent remain easy to scan.

## Motion, control, and looks

This script starts with the green flag, moves the sprite, reacts to a condition,
and broadcasts a completion message.

```scratchblocks
当 @greenFlag 被点击
将 [分数 v] 设为 (0)
移到 x: (0) y: (0)
重复执行 (10) 次
  移动 (10) 步
  将 [分数 v] 增加 (1)
  如果 <碰到 [边缘 v] ?> 那么
    碰到边缘就反弹
    右转 @turnRight (15) 度
  否则
    说 [我继续走。] (1) 秒
  end
end
广播 [完成 v]
```

## Broadcast receiver

This script reacts to the broadcast and uses sound and costume blocks.

```scratchblocks
当接收到 [完成 v]
播放声音 [掌声 v] 等待播完
下一个造型
说 [完成了！] (2) 秒
停止所有声音
```

## Waiting and keyboard input

This script waits until the space key is pressed and then moves in a square.

```scratchblocks
当 @greenFlag 被点击
等待 <按下 [空格 v] 键?>
重复执行 (4) 次
  移动 (50) 步
  右转 @turnRight (90) 度
end
说 [正方形完成。] (2) 秒
```

## Inline code

The inline renderer should pick up Simplified Chinese text from local frontmatter:
`sb 当 @greenFlag 被点击`

It should also handle a short Chinese command inline:
`sb 说 [你好！]`
