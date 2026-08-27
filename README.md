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

## Caveats

- Inside full-screen TUIs that capture the mouse (Claude Code included),
  Ghostty never sees the hover, so only links the app itself emits as OSC 8
  survive. `termlink` is for your normal shell.
- Some Ghostty builds have an OSC 8 dispatch bug
  ([ghostty#11907](https://github.com/ghostty-org/ghostty/issues/11907))
  where the link renders but the click does nothing; update Ghostty if
  clicks are dead.
