// The project folders Claude has worked in this session, most recent first.

const MAX_ROOTS = 20

/**
 * The absolute paths a tool call names: a file it reads or writes, a folder it
 * searches, a folder a shell command `cd`s into.
 *
 * Args:
 *   tool: the tool's name.
 *   input: the arguments the model gave it.
 *   home: the user's home directory, for `~/` paths.
 *
 * Returns:
 *   The absolute paths, in the order the call names them.
 */
export function pathsOfToolUse(tool: string, input: Record<string, unknown>, home: string): string[] {
  const named: string[] = []
  for (const key of ['file_path', 'notebook_path', 'path']) {
    const value = input[key]
    if (typeof value === 'string') named.push(value)
  }
  const command = input.command
  if (tool === 'Bash' && typeof command === 'string') {
    for (const match of command.matchAll(/(?:^|[;&|(]\s*)cd\s+(?:"([^"]+)"|'([^']+)'|([^\s;&|)]+))/g)) {
      named.push((match[1] ?? match[2] ?? match[3])!)
    }
  }
  return named
    .map(path => (path.startsWith('~/') ? `${home}/${path.slice(2)}` : path))
    .filter(path => path.startsWith('/'))
}

/**
 * Finds the project a path lies in: the nearest folder above it holding `.git`,
 * else the folder the path is in.
 *
 * Args:
 *   path: an absolute path to a file or folder.
 *   home: the user's home directory; the walk stops below it.
 *   kindOf: the kind of what a path leads to, or undefined when nothing is there.
 *
 * Returns:
 *   The project folder, or undefined for a path that is gone, or that lies in
 *   no project below home.
 */
export async function projectRoot(
  path: string,
  home: string,
  kindOf: (path: string) => Promise<'file' | 'dir' | 'other' | undefined>,
): Promise<string | undefined> {
  const kind = await kindOf(path)
  if (kind === undefined) return undefined
  const start = kind === 'dir' ? path.replace(/\/+$/, '') : path.slice(0, path.lastIndexOf('/'))
  for (let dir = start; dir.startsWith(`${home}/`); dir = dir.slice(0, dir.lastIndexOf('/'))) {
    if ((await kindOf(`${dir}/.git`)) !== undefined) return dir
  }
  return start.startsWith(`${home}/`) ? start : undefined
}

/**
 * The project folders seen, the most recently used first, at most 20.
 */
export class Roots {
  private recent: string[] = []

  /**
   * Moves a folder to the front, adding it when new.
   *
   * Args:
   *   root: the absolute folder.
   */
  use(root: string): void {
    this.recent = [root, ...this.recent.filter(seen => seen !== root)].slice(0, MAX_ROOTS)
  }

  /**
   * The folders to resolve a relative path against: `first`, then the rest.
   *
   * Args:
   *   first: the folder tried before any other, the session's working directory.
   *
   * Returns:
   *   The folders in the order to try them, without repeats.
   */
  bases(first: string): string[] {
    return [first, ...this.recent.filter(root => root !== first)]
  }
}
