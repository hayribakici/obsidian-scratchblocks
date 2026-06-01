# Obsidian-Scratchblocks

Render `scratchblocks` code blocks in Obsidian.

````suggestion
```scratchblock
when green flag clicked
```
````

will be rendered as:

<img width="120" height="66" alt="Bildschirmfoto 2026-05-14 um 23 08 25" src="https://github.com/user-attachments/assets/3d2dd87c-7a26-4ef8-96dd-0d8d1570006d" />

Checkout the [Scratch documentation](https://en.scratch-wiki.info/wiki/Block_Plugin/Syntax) on how to write Scratch code.

Both `scratchblock` and `scratchblocks` code fences are supported.

### Inline `scratchblocks`

Use `sb <scratchcode>` in order to display inline scratchblocks code with a `sb` prefix.

So writing 

~~~suggestion
OMG, I guess a `sb when green flag clicked` snuck itself into the text.
~~~

will be rendered as:

> OMG, I guess a <img width="54" height="30" alt="Bildschirmfoto 2026-05-14 um 23 08 25" src="https://github.com/user-attachments/assets/3d2dd87c-7a26-4ef8-96dd-0d8d1570006d" /> snuck itself into the text.

#### How to improve readability with inline code

In the current implementation, the inline code may appear somewhat smaller than surrounding text. 

The reason the blocks appear smaller is that the internal scale used inline is different than the scale used for codeblocks. However, using CSS snippets, it can be partially adjusted to fit the user's font and line spacing. ([CSS snippets are described here](https://obsidian.md/help/snippets), but better managed via plugins such as [SnipDock](https://community.obsidian.md/plugins/snipdock).)

CSS such as this:
```css
.scratchblocks-inline-rendered svg {
  display:inline-block;
  height:45px; /* Adjust this to your desired overall height */
  margin-top: -15px; /* Adjust to pull text back into the line spacing */
  margin-bottom: -15px; /* top and bottom */*
  vertical-align: middle; /* makes it even */
}
```
 can turn scratchblock that are small relative to the main text:

<img width="1008" height="92" alt="image" src="https://github.com/user-attachments/assets/08238991-3a9d-4616-b61f-b126014a964b" />

 into blocks that are more readable:
 
<img width="1342" height="92" alt="image" src="https://github.com/user-attachments/assets/a80e4024-cd02-406f-bc08-fc7c316f8812" />

Note that this is only a workaround, and nested text may still be smaller than desired because of necessary padding inserted by scratchblocks itself. 

- Without styling, the text is small at all levels. Note that the height gets larger.

<img width="274" height="246" alt="image" src="https://github.com/user-attachments/assets/a6f43c62-f628-4eaa-96e0-69bc5b676155" />

- Styling improves this, but within limits. The text gets smaller the more nesting one applies while the overall height stays the same.

<img width="305" height="237" alt="image" src="https://github.com/user-attachments/assets/dd9feb82-271f-4106-8ab0-ba398aa10b26" />

This code shows the effect on line height and font size in a paragraph.

```
Level 1 `sb not <>` with lots of extra text and stuff to get onto next line. Level 2 `sb not <not <>>` with lots of extra text and stuff to get onto next line. Level 3 `sb not <not <not <>>>` with lots of extra text and stuff to get onto next line. Level 4 `sb not <not <not <not <>>>>` with lots of extra text and stuff to get onto next line. Level 5 `sb not <not <not < not < not <> > > > >` with lots of extra text and stuff to get onto next line. Level 6 `sb not <not <not < not < not < not <> > > > > >` with lots of extra text and stuff to get onto next line. Level 7 `sb not <not <not < not < not < not < not <> > > > > > >` with lots of extra text and stuff to get onto next line. Level 8 `sb not <not <not < not < not < not < not < not <> > > > > > > >` with lots of extra text and stuff to get onto next line. Level 9 `sb not <not <not < not < not < not < not < not <not <>> > > > > > > >` with lots of extra text and stuff to get onto next line.  Level 10 `sb not <not <not < not < not < not < not < not <not <not <>>> > > > > > > >` with lots of extra text and stuff to get onto next line. Level 11 `sb not <not <not < not < not < not < not < not <not <not <not <>>>> > > > > > > >` with lots of extra text and stuff to get onto next line. Level 12 `sb not <not <not < not < not < not < not < not <not <not <not <not <>>>>> > > > > > > >` with lots of extra text and stuff to get onto next line.
```

- without styling line height varies according to height of image:
<img width="2908" height="522" alt="image" src="https://github.com/user-attachments/assets/b20abbb5-c0a4-4c29-b752-0e03c53816d0" />

- with styling line height is consistent:
<img width="2886" height="462" alt="image" src="https://github.com/user-attachments/assets/c475421b-2f7d-409c-b22b-26c3a3f7cb4f" />

Which is better may depend on the context.

## Under the hood

It exposes the `scratchblocks` [library](https://scratchblocks.github.io/) at the top level of Obsidian so you can use it inside templater or other code running plugins.

## Contributing

To make changes to this plugin, first ensure you have the dependencies installed.

```bash
npm install
```

### Development

To start building the plugin with what mode enabled run the following command:

```bash
npm run dev
```

_Note: If you haven't already installed the hot-reload-plugin you'll be prompted to. You need to enable that plugin in your obsidian vault before hot-reloading will start. You might need to refresh your plugin list for it to show up._

### Releasing

To start a release build run the following command:

```bash
npm run build
```

### Credits

This is a fork from [shabegom/obsidian-scratchblocks](https://github.com/shabegom/obsidian-scratchblocks/), which renders scratchblocks codeblocks into the [Obsidian](https://obsidian.md) editor. Since that repository hasn't been maintained, this repository tries to fill its shoes.

---

<sub>This plugin was generated by [create-obsidian-plugin](https://www.npmjs.com/package/create-obsidian-plugin)</sub>
