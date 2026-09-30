# File references that Ghostty can cmd+click

This overrides the default "reference code as `file_path:line_number`" style.

Ghostty 1.3 opens a path on cmd+click only when the matched text is a file
that exists, resolved against the shell's working directory. Two common forms
break that, and its `link` config for custom matchers is not implemented yet:

- `path:42` is matched including `:42`, the lookup fails, and nothing opens.
- A bare filename with no slash, like `MEMORY.md`, is not detected at all.

So when referencing a file in replies:

- Write the path relative to the working directory, and include a slash:
  `room-finder/app.py`, or `./MEMORY.md` for a file at the top level.
- Keep the line number out of the path. Put it after a space: `room-finder/app.py` (line 42).
- Files outside the working directory: use the absolute path, same rules.
