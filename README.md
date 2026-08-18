# Count Block

Count Block is an Obsidian plugin for editable plain-text blocks with a live count beneath them.

The block remains normal Markdown. In Live Preview and Source mode, the editable code block is enhanced with a count footer; Reading mode enhances Obsidian's native rendered code block with the same footer. No content is stored outside the note.

````markdown
```count metric=neis-bytes limit=1500
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

Use the **Count Block: Insert count block** command to create a block or wrap selected text.

In Live Preview and Source mode, choose a metric from the footer to update the block's `metric=` option. Click the numeric count to copy its unformatted value. Reading mode keeps the metric name static but also supports click-to-copy.

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
