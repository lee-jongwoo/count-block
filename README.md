# Count Block

Count Block is an Obsidian plugin for editable plain-text blocks with a live count beneath them.

The block remains normal Markdown: edit its body in Live Preview or Source mode, and view the styled block in Reading mode. No content is stored outside the note.

````markdown
```count metric=neis-bytes limit=1500 label="Career activity"
Write plain text here.
```
````

## Metrics

- `neis-bytes`: NEIS-compatible byte counting
- `utf8-bytes`: standard UTF-8 byte length
- `words`: whitespace-separated words
- `characters`: Unicode code points, including whitespace
- `characters-no-spaces`: Unicode code points, excluding Unicode whitespace

Block options belong on the opening fence and are not included in the count:

- `metric=<metric-id>`
- `limit=<positive-integer>`
- `label="Custom label"`

Use the **Count Block: Insert count block** command to create a block or wrap selected text.

Invalid metrics, limits, or option names are shown in the footer. Top-level fenced blocks are supported in the initial release; nesting a count block inside a list or blockquote is not yet supported by the live editor footer.

### NEIS compatibility

`neis-bytes` follows the behavior of the [NEIS counter](https://hjh010501.github.io/neis-counter/): logical line breaks count as two bytes; its listed math, Greek, middle-dot, and curly-quote exceptions count as one byte; other characters use their UTF-8 byte length. CRLF and CR line endings are normalized to logical line breaks before counting.

## Development

```sh
npm install
npm test
npm run build
```

Copy `main.js`, `manifest.json`, and `styles.css` to a test vault's `.obsidian/plugins/count-block/` directory. Never develop against your primary vault.
