# termlink

Cmd+click file paths in [Ghostty](https://ghostty.org) (macOS) and have them
open in VS Code, at the right line when the tool printed one (`foo.py:88`
style).

Ghostty needs no config for this. It already cmd+clicks bare paths and URLs
out of the box. Two problems remain, and this repo fixes both:

1. Ghostty opens paths via the macOS "default app", so `.py` opens IDLE,
   `.json` opens Xcode, and so on, until you fix the file associations.
2. Ghostty's built-in matcher only sees the bare path. `foo.py:88` is not
   clickable, and its `link` regex config option is unimplemented. The fix is
   to have your tools emit OSC 8 hyperlinks (a terminal standard for "this
   text is a link") carrying a `vscode://file/<abs-path>:line:col` URL, which
   VS Code opens at the exact line.

## Step 1: point code file types at VS Code

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

## Step 2: install the `termlink` script

```sh
mkdir -p ~/.local/bin
cp termlink ~/.local/bin/termlink
chmod +x ~/.local/bin/termlink
```

It reads piped output, finds file paths that actually exist on disk
(relative ones resolve against the current directory), and wraps them in
OSC 8 links, preserving colours. Paths that do not exist are left alone.

## Step 3: shell wiring

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

## Usage

- Plain cmd+click on any bare path: opens in VS Code (via the duti defaults).
- `rg something`: results are clickable at the exact line and column.
- `tl <command>` or `<command> | tl`: any tool's paths become clickable,
  with line numbers when printed as `path:line` or `path:line:col`.

## Verifying

Run `./termlink-test` from the repo root and cmd+click each printed line.
Lines 1, 2, 4, 5 and 6 should open a file; line 3 (bare `path:line`) should
do nothing, which is exactly the gap `termlink` fills.

## Inside Claude Code

`termlink` can't rewrite Claude Code's output, so `claude-mod/` does its job
there: a Claude Code mod that turns every file path in Claude's replies into
a link.

### Install

Clone this repo, then load the mod in every session by adding its folder to
`~/.claude/settings.json` (merge into an existing `env` block):

```json
{ "env": { "CLAUDE_CODE_PLUGIN_DIRS": "~/Projects/termlink/claude-mod" } }
```

Adjust the path to where you cloned it. New sessions load it; a running one
reloads it whenever a file in the folder changes. `TERMLINK_SCHEME` from
Step 3 picks the editor, as for `termlink`.

### Clicking

Claude Code's fullscreen UI (`"tui": "fullscreen"`) holds the mouse, so
Ghostty only sees links with shift held.

- **Plain click** opens the file at the line, via
  `open $TERMLINK_SCHEME://file/abs/foo.py:42`. It lands after a short pause:
  Claude Code waits to rule out a double-click first.
- **cmd+shift+click** opens it through Ghostty and the duti defaults, at the
  top. Links inside a reply may only be `file:`, `http:` or `https:`, and a
  `file://` URL carries no line VS Code reads.

### What gets linked

Any path that exists on disk: `foo.py`, `foo.py:42`, `foo.py:42:7`,
`` `foo.py` `` (line 42), `./x`, `../x`, `/abs/x`, `~/x`, hidden files and
folders. Code blocks, commands in backticks, URLs and existing links are left
alone.

A relative path is tried against the working directory first, then against
the projects Claude has read, edited, searched or `cd`ed into this session
(the nearest folder holding `.git`), most recently used first. Run
`/termlink-roots` to list them in the order they are tried.

### Developing it

`claude plugin test claude-mod` runs its tests and `claude plugin validate
claude-mod` checks what it hooks. Run with `claude --debug` to see a hook that
was skipped and why.

### Without the mod

`claude/file-links.md` is a rule that makes Claude write paths Ghostty can
cmd+shift+click on its own: `dir/file.py` (line 42) rather than `path:42`,
which Ghostty does not match. The mod makes it unnecessary.

```sh
mkdir -p ~/.claude/rules
cp claude/file-links.md ~/.claude/rules/
```

To get plain cmd+click back instead of cmd+shift+click, `export
CLAUDE_CODE_DISABLE_MOUSE=1`, at the cost of mouse scrolling in Claude Code
(and the mod's plain click).

## Caveats

- `termlink` is for your normal shell. It can't rewrite a TUI's output;
  for Claude Code, use the mod.
- Some Ghostty builds have an OSC 8 dispatch bug
  ([ghostty#11907](https://github.com/ghostty-org/ghostty/issues/11907))
  where the link renders but the click does nothing; update Ghostty if
  clicks are dead.
