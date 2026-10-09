// Finds file paths in markdown and turns the ones that exist into file:// links.

export type Target = { path: string; line?: number; column?: number }

export type Linked = { text: string; hrefs: string[] }

// A dot may lead a segment, so hidden files and folders (`.claude`, `.gitignore`) match.
const SEG = String.raw`\.?[\w@+-](?:[\w.@+-]*[\w@+-])?`
const PATH = String.raw`(?:~|\.{1,2})?/?${SEG}(?:/${SEG})*`
const LOC = String.raw`(?::(\d+)(?::(\d+))?)?`
const LINE_NOTE = String.raw`(\s*\(line (\d+)\))?`

// Alternatives in order: links and URLs (left alone), a code span holding only a path,
// any other code span (left alone), a bare path.
const TOKEN = new RegExp(
  [
    String.raw`\[[^\]\n]*\]\([^)\n]*\)`,
    String.raw`[a-zA-Z][\w+.-]*://[^\s)>]+`,
    String.raw`\x60(${PATH})${LOC}\x60${LINE_NOTE}`,
    String.raw`\x60[^\x60\n]*\x60`,
    String.raw`(?<![\w/.~@+:-])(${PATH})${LOC}${LINE_NOTE}`,
  ].join('|'),
  'g',
)

const FENCE = /^ {0,3}(`{3,}|~{3,})/

/**
 * Whether a token could name a file: it has a slash, ends in an extension, or is a dotfile.
 *
 * Args:
 *   path: the token as written.
 *
 * Returns:
 *   True when it is worth asking the filesystem about.
 */
export function looksLikePath(path: string): boolean {
  return path.includes('/') || /\.[A-Za-z][A-Za-z0-9]{0,9}$/.test(path) || /^\.[\w-]+$/.test(path)
}

/**
 * Resolves a path as written against the working directory and home.
 *
 * Args:
 *   path: relative, absolute or `~/` path.
 *   cwd: the session's working directory.
 *   home: the user's home directory.
 *
 * Returns:
 *   The absolute path with `.` and `..` segments folded.
 */
export function resolvePath(path: string, cwd: string, home: string): string {
  const joined = path.startsWith('/') ? path : path.startsWith('~/') ? `${home}/${path.slice(2)}` : `${cwd}/${path}`
  const parts: string[] = []
  for (const part of joined.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') parts.pop()
    else parts.push(part)
  }
  return `/${parts.join('/')}`
}

/**
 * Percent-encodes each segment of an absolute path, parentheses included.
 *
 * Args:
 *   path: the absolute path.
 *
 * Returns:
 *   The path, safe inside a URL and a markdown link destination.
 */
export function encodePath(path: string): string {
  return path
    .split('/')
    .map(part => encodeURIComponent(part).replace(/\(/g, '%28').replace(/\)/g, '%29'))
    .join('/')
}

/**
 * Builds the link a target is written as: a file URL, the line in its fragment.
 *
 * Args:
 *   target: the absolute path and optional line and column.
 *
 * Returns:
 *   `file:///abs/path#L42C8`, the fragment only when a line is known.
 */
export function toHref(target: Target): string {
  const encoded = encodePath(target.path)
  const fragment = target.line === undefined ? '' : `#L${target.line}${target.column === undefined ? '' : `C${target.column}`}`
  return `file://${encoded}${fragment}`
}

/**
 * Reads a link this module wrote back into its target.
 *
 * Args:
 *   href: a `file://` URL as `toHref` builds it.
 *
 * Returns:
 *   The target, or undefined for any other link.
 */
export function fromHref(href: string): Target | undefined {
  const match = /^file:\/\/([^#]+)(?:#L(\d+)(?:C(\d+))?)?$/.exec(href)
  if (match === null) return undefined
  const [, encoded, line, column] = match
  return {
    path: decodeURIComponent(encoded!),
    line: line === undefined ? undefined : Number(line),
    column: column === undefined ? undefined : Number(column),
  }
}

/**
 * Rewrites every path in the markdown that exists on disk as a link to it.
 *
 * Fenced code blocks, existing links and URLs are left as written. A path in a
 * code span keeps its backticks inside the link. A `(line N)` note after a path
 * stays as text and gives the link its line.
 *
 * Args:
 *   markdown: the reply's text.
 *   cwd: the session's working directory.
 *   home: the user's home directory.
 *   isFile: whether an absolute path is a file.
 *
 * Returns:
 *   The rewritten text and the hrefs it now holds, in order, without repeats.
 */
export async function linkify(
  markdown: string,
  cwd: string,
  home: string,
  isFile: (path: string) => Promise<boolean>,
): Promise<Linked> {
  const hrefs: string[] = []
  const out: string[] = []
  let fence: string | undefined
  let prose: string[] = []

  const flush = async () => {
    if (prose.length > 0) out.push(await linkifyProse(prose.join('\n'), cwd, home, isFile, hrefs))
    prose = []
  }

  for (const line of markdown.split('\n')) {
    const opener = FENCE.exec(line)?.[1]
    if (fence === undefined && opener !== undefined) {
      await flush()
      fence = opener[0]!.repeat(opener.length)
      out.push(line)
    } else if (fence !== undefined) {
      if (line.trim().startsWith(fence)) fence = undefined
      out.push(line)
    } else {
      prose.push(line)
    }
  }
  await flush()

  return { text: out.join('\n'), hrefs }
}

async function linkifyProse(
  text: string,
  cwd: string,
  home: string,
  isFile: (path: string) => Promise<boolean>,
  hrefs: string[],
): Promise<string> {
  const pieces: string[] = []
  let at = 0
  for (const match of text.matchAll(TOKEN)) {
    const [whole, spanPath, spanLine, spanCol, spanNote, spanNoteLine, barePath, bareLine, bareCol, bareNote, bareNoteLine] =
      match
    const path = spanPath ?? barePath
    if (path === undefined || !looksLikePath(path)) continue

    const absolute = resolvePath(path, cwd, home)
    if (!(await isFile(absolute))) continue

    const isSpan = spanPath !== undefined
    const line = (isSpan ? spanLine ?? spanNoteLine : bareLine ?? bareNoteLine) ?? undefined
    const column = isSpan ? spanCol : bareCol
    const note = (isSpan ? spanNote : bareNote) ?? ''
    const label = whole.slice(0, whole.length - note.length)
    const href = toHref({
      path: absolute,
      line: line === undefined ? undefined : Number(line),
      column: column === undefined ? undefined : Number(column),
    })

    pieces.push(text.slice(at, match.index), `[${label}](${href})`, note)
    at = match.index + whole.length
    if (!hrefs.includes(href)) hrefs.push(href)
  }
  pieces.push(text.slice(at))
  return pieces.join('')
}
