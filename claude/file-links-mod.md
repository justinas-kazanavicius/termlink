# File references the termlink mod can link

The termlink mod turns every path in a reply that exists on disk into a link,
so the usual `path:42` style works. Two things it cannot recover:

- A path relative to a folder other than the working directory resolves only
  if Claude has worked in that project this session. For any file outside the
  working directory, write the absolute path (or `~/...`).
- A path that does not exist on disk stays plain text, so name files exactly.
