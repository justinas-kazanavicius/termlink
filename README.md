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

Claude Code's fullscreen UI (`"tui": "fullscreen"`) turns on mouse
reporting. While an app has the mouse, Ghostty only looks for links when
shift is held, so use **cmd+shift+click** there. Plain cmd+click never
reaches the link. To get plain cmd+click back, `export
CLAUDE_CODE_DISABLE_MOUSE=1`, at the cost of mouse scrolling in Claude Code.

Claude also has to print paths Ghostty can open. By default it writes
`path:42`, which fails. `claude/file-links.md` is a rule that makes it write
`dir/file.py` (line 42) instead. Install it with:

```sh
mkdir -p ~/.claude/rules
cp claude/file-links.md ~/.claude/rules/
```

Rules load when a session starts.

### The Claude Code mod

`claude-mod/` is a Claude Code mod that does `termlink`'s job inside the TUI.
It rewrites each reply as it is drawn: every path that exists on disk
(`foo.py`, `foo.py:42`, `` `foo.py` `` (line 42)) becomes a
`file:///abs/foo.py#L42` link. Code blocks, commands in backticks, URLs and
existing links are left alone. A relative path is tried against the
working directory first, then against the projects Claude has read, edited,
searched or `cd`ed into this session (the nearest folder holding `.git`),
the most recently used first. `/termlink-roots` lists them in the order they are tried.

- **cmd+shift+click** opens the file through Ghostty and the duti defaults,
  at the top (a `file://` URL carries no line VS Code reads).
- **Plain click** (fullscreen TUI) opens it at the line, via
  `open $TERMLINK_SCHEME://file/abs/foo.py:42`. It lands after a short pause:
  Claude Code waits to rule out a double-click first.

Links inside a reply may only be `file:`, `http:` or `https:`, which is why
cmd+shift+click can't carry the line and the plain click exists.

With the mod, Claude can write `path:42` again, so the rule above is optional.
Load it in every session by adding to `~/.claude/settings.json`:

```json
{ "env": { "CLAUDE_CODE_PLUGIN_DIRS": "~/Projects/termlink/claude-mod" } }
```

Run its tests with `claude plugin test claude-mod`.

## Caveats

- `termlink` is for your normal shell. It can't rewrite a TUI's output.
- Some Ghostty builds have an OSC 8 dispatch bug
  ([ghostty#11907](https://github.com/ghostty-org/ghostty/issues/11907))
  where the link renders but the click does nothing; update Ghostty if
  clicks are dead.
