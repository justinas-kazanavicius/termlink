# termlink

Click a file path in your terminal and it opens in your editor, at the line
when one is printed (`foo.py:88`). Two independent parts:

- **A Claude Code mod** that links the file paths in Claude's replies. One
  line to install, nothing else to set up.
- **A shell setup** for everything else you run: a filter that turns paths in
  any command's output into links, and the file associations that make
  cmd+click open your editor. Written for [Ghostty](https://ghostty.org) on
  macOS.

## Claude Code mod

At the Claude Code prompt:

```
/plugin install termlink --marketplace justinas-kazanavicius/termlink
```

Answer `y` to add the marketplace, then pick the user scope. It is active at
once.

Every path in Claude's replies that exists on disk becomes a link:

- **Plain click** opens the file in your editor at the line. It lands after
  a short pause, while Claude Code rules out a double-click.
- **cmd+shift+click** (Ghostty, iTerm2 and other terminals with OSC 8 links)
  opens the file with your system's default app, at the top: a link inside a
  reply can only be a `file://` URL, which carries no line.

The mod also tells Claude how to write paths so they link: as they are on
disk, absolute for files outside the working directory.

### Requirements

- Claude Code with mod support (tested on 2.1.295; the mod API is early
  access and may change).
- Fullscreen mode for the single click (`"tui": "fullscreen"` in
  `~/.claude/settings.json`). Run `/termlink-fullscreen` to turn it on; the
  mod also says so once, the first time it links a path outside fullscreen.
  Without it, cmd+click still opens the file, without the line.
- VS Code by default. Set `TERMLINK_SCHEME` to `cursor`, `vscode-insiders`
  or `file` (your default app, no line) before starting Claude Code.
- macOS opens links with `open`, Linux with `xdg-open`.

### What the install covers

| Piece | Installed by `/plugin install`? |
|---|---|
| Links in Claude's replies, plain click at the line | Yes |
| Instructions to Claude on writing paths | Yes |
| `/termlink-roots`, `/termlink-fullscreen` | Yes |
| Editor choice (`TERMLINK_SCHEME`) | No; VS Code unless set |
| Default apps for cmd+shift+click (Step 1 below) | No |
| Links in your own shell's output (Steps 2 and 3) | No |

### What gets linked

Any path that exists on disk: `foo.py`, `foo.py:42`, `foo.py:42:7`,
`` `foo.py` `` (line 42), `./x`, `../x`, `/abs/x`, `~/x`, hidden files and
folders. Code blocks, commands in backticks, URLs and existing links are left
alone. Tool output (Bash, Grep) is not linked: Claude Code draws it itself and
refuses the escape codes a link needs.

A relative path is tried against the working directory first, then against
the projects Claude has read, edited, searched or `cd`ed into this session
(the nearest folder holding `.git`), most recently used first. Run
`/termlink-roots` to list them in the order they are tried.

### Developing it

To run the mod from a clone, so edits load as you save them, add its folder
to `~/.claude/settings.json` (merge into an existing `env` block):

```json
{ "env": { "CLAUDE_CODE_PLUGIN_DIRS": "~/Projects/termlink/claude-mod" } }
```

`claude plugin test claude-mod` runs its tests and `claude plugin validate
claude-mod` checks what it hooks. Run with `claude --debug` to see a hook that
was skipped and why. Bump `version` in `claude-mod/.claude-plugin/plugin.json`
with each change, or installed copies will not update.

### Without the mod

`claude/file-links.md` is a rule that makes Claude write paths Ghostty can
cmd+shift+click on its own: `dir/file.py` (line 42) rather than `path:42`,
which Ghostty does not match.

```sh
mkdir -p ~/.claude/rules
cp claude/file-links.md ~/.claude/rules/
```

To get plain cmd+click back instead of cmd+shift+click, `export
CLAUDE_CODE_DISABLE_MOUSE=1`, at the cost of mouse scrolling in Claude Code
(and the mod's plain click).

## Shell setup (Ghostty, macOS)

Ghostty already cmd+clicks bare paths and URLs out of the box. Two problems
remain:

1. Ghostty opens paths via the macOS "default app", so `.py` opens IDLE,
   `.json` opens Xcode, and so on, until you fix the file associations.
2. Ghostty's built-in matcher only sees the bare path. `foo.py:88` is not
   clickable, and its `link` regex config option is unimplemented. The fix is
   to have your tools emit OSC 8 hyperlinks (a terminal standard for "this
   text is a link") carrying a `vscode://file/<abs-path>:line:col` URL, which
   VS Code opens at the exact line.

### Step 1: point code file types at VS Code

```sh
brew install duti
for ext in py ts tsx js mjs json yaml yml md toml sh zsh css log rs go; do
  duti -s com.microsoft.VSCode "$ext" all
done
```

Swap the bundle id for your editor (`com.todesktop.230313mzl4w4u92` for
Cursor). One caveat: `.ts` shares its file type with MPEG-2 video, so `.ts`
video files open in VS Code too after this.

This alone makes cmd+click on bare paths work.

### Step 2: install the `termlink` script

```sh
mkdir -p ~/.local/bin
cp termlink ~/.local/bin/termlink
chmod +x ~/.local/bin/termlink
```

It reads piped output, finds file paths that actually exist on disk
(relative ones resolve against the current directory), and wraps them in
OSC 8 links, preserving colours. Paths that do not exist are left alone.

### Step 3: shell wiring

Add to `~/.zshrc` (make sure `~/.local/bin` is on your PATH):

```sh
# ── Ghostty cmd+click file links ───────────────────────
# Ghostty opens bare paths but not `path:42`, and its `link` regex config is
# unimplemented, so tools have to emit OSC 8 hyperlinks themselves.
export TERMLINK_SCHEME=vscode   # cursor | vscode-insiders | file
alias rg='rg --hyperlink-format=vscode://file{path}:{line}:{column}'
# `tl pytest -q` runs a command under a pty (keeping colour) and links its paths;
# `... | tl` filters a pipe.
tl() {
  if (( $# )); then
    script -q /dev/null "$@" | termlink
    return $pipestatus[1]
  fi
  termlink
}
```

The `rg` alias uses ripgrep's native hyperlink support, so grep results are
line-accurate links with no wrapper needed. For everything else, either pipe
(`pytest -q | tl`) or wrap (`tl pytest -q`, which keeps colours because it
runs under a pseudo-terminal).

### Usage

- Plain cmd+click on any bare path: opens in VS Code (via the duti defaults).
- `rg something`: results are clickable at the exact line and column.
- `tl <command>` or `<command> | tl`: any tool's paths become clickable,
  with line numbers when printed as `path:line` or `path:line:col`.

### Verifying

Run `./termlink-test` from the repo root and cmd+click each printed line.
Lines 1, 2, 4, 5 and 6 should open a file; line 3 (bare `path:line`) should
do nothing, which is exactly the gap `termlink` fills.

## Caveats

- `termlink` is for your normal shell. It can't rewrite a TUI's output;
  for Claude Code, use the mod.
- Some Ghostty builds have an OSC 8 dispatch bug
  ([ghostty#11907](https://github.com/ghostty-org/ghostty/issues/11907))
  where the link renders but the click does nothing; update Ghostty if
  clicks are dead.
