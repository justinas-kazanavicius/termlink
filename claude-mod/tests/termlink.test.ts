import { describe, expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { fromHref, linkify, resolvePath, toHref } from '../hooks/linkify'
import { editorUrl } from '../hooks/editor'
import { pathsOfToolUse, projectRoot, Roots } from '../hooks/roots'

const CWD = '/repo'
const HOME = '/home/me'
const FILES = new Set([
  '/repo/libs/a.py',
  '/repo/README.md',
  '/repo/.gitignore',
  '/home/me/notes.md',
  '/home/me/.claude/rules/x.md',
  '/repo/my dir/x.ts',
  '/other/claude-mod/tsconfig.json',
  '/third/claude-mod/tsconfig.json',
  '/home/me/other/README.md',
  '/home/me/other/claude-mod/tsconfig.json',
])
const isFile = async (path: string) => FILES.has(path)
const run = (text: string) => linkify(text, [CWD], HOME, isFile)

describe('linkify', () => {
  test('links an existing bare path with its line', async () => {
    const { text, hrefs } = await run('see libs/a.py:42 for it')
    expect(text).toBe('see [libs/a.py:42](file:///repo/libs/a.py#L42) for it')
    expect(hrefs).toEqual(['file:///repo/libs/a.py#L42'])
  })

  test('keeps a code span inside the link and reads a (line N) note', async () => {
    const { text } = await run('open `libs/a.py` (line 7), and `./README.md`.')
    expect(text).toBe(
      'open [`libs/a.py`](file:///repo/libs/a.py#L7) (line 7), and [`./README.md`](file:///repo/README.md).',
    )
  })

  test('takes line and column', async () => {
    const { text } = await run('libs/a.py:3:9')
    expect(text).toBe('[libs/a.py:3:9](file:///repo/libs/a.py#L3C9)')
  })

  test('resolves home paths', async () => {
    const { hrefs } = await run('in ~/notes.md')
    expect(hrefs).toEqual(['file:///home/me/notes.md'])
  })

  test('links hidden files and folders', async () => {
    const { hrefs } = await run('see ~/.claude/rules/x.md:3 and .gitignore')
    expect(hrefs).toEqual(['file:///home/me/.claude/rules/x.md#L3', 'file:///repo/.gitignore'])
  })

  test('leaves missing files, plain words, links, URLs and commands alone', async () => {
    const input = [
      'missing libs/b.py and e.g. Node.js',
      '[libs/a.py](https://example.com/libs/a.py)',
      'https://github.com/x/libs/a.py',
      'run `uv run pytest libs/a.py` now',
    ].join('\n')
    const { text, hrefs } = await run(input)
    expect(text).toBe(input)
    expect(hrefs).toEqual([])
  })

  test('leaves fenced code blocks alone', async () => {
    const input = 'before libs/a.py\n```\nlibs/a.py:1\n```\nafter'
    const { text } = await run(input)
    expect(text).toBe('before [libs/a.py](file:///repo/libs/a.py)\n```\nlibs/a.py:1\n```\nafter')
  })

  test('drops trailing punctuation from the path', async () => {
    const { text } = await run('It is in README.md.')
    expect(text).toBe('It is in [README.md](file:///repo/README.md).')
  })

  test('lists each href once', async () => {
    const { hrefs } = await run('README.md and README.md')
    expect(hrefs).toEqual(['file:///repo/README.md'])
  })

  test('href round-trips through spaces and parentheses', async () => {
    const target = { path: '/repo/my dir/(x).ts', line: 4, column: 2 }
    expect(toHref(target)).toBe('file:///repo/my%20dir/%28x%29.ts#L4C2')
    expect(fromHref(toHref(target))).toEqual(target)
    expect(fromHref('https://example.com')).toBe(undefined)
  })

  test('tries a relative path against each base in order', async () => {
    const twoBases = await linkify('claude-mod/tsconfig.json', [CWD, '/third', '/other'], HOME, isFile)
    expect(twoBases.hrefs).toEqual(['file:///third/claude-mod/tsconfig.json'])
    const cwdFirst = await linkify('README.md', [CWD, '/other'], HOME, isFile)
    expect(cwdFirst.hrefs).toEqual(['file:///repo/README.md'])
  })

  test('folds dot segments', async () => {
    expect(resolvePath('../x/./y.py', '/a/b', HOME)).toBe('/a/x/y.py')
  })
})

describe('roots', () => {
  test('reads the paths a tool call names', async () => {
    expect(pathsOfToolUse('Read', { file_path: '/a/b.py' }, HOME)).toEqual(['/a/b.py'])
    expect(pathsOfToolUse('Grep', { pattern: 'x', path: '~/proj' }, HOME)).toEqual(['/home/me/proj'])
    expect(pathsOfToolUse('Bash', { command: 'cd ~/proj && ls; cd "/s p" ; cd rel' }, HOME)).toEqual([
      '/home/me/proj',
      '/s p',
    ])
  })

  test('finds the nearest git folder, else the folder itself', async () => {
    const tree: Record<string, 'file' | 'dir'> = {
      '/home/me/proj/.git': 'dir',
      '/home/me/proj/src/a.py': 'file',
      '/home/me/notes/n.md': 'file',
      '/tmp/x.py': 'file',
    }
    const kindOf = async (path: string) => tree[path]
    expect(await projectRoot('/home/me/proj/src/a.py', HOME, kindOf)).toBe('/home/me/proj')
    expect(await projectRoot('/home/me/notes/n.md', HOME, kindOf)).toBe('/home/me/notes')
    expect(await projectRoot('/tmp/x.py', HOME, kindOf)).toBe(undefined)
    expect(await projectRoot('/home/me/gone.py', HOME, kindOf)).toBe(undefined)
  })

  test('puts the most recently used root first, after the working directory', async () => {
    const roots = new Roots()
    roots.use('/a')
    roots.use('/b')
    roots.use('/a')
    roots.use('/repo')
    expect(roots.bases('/repo')).toEqual(['/repo', '/a', '/b'])
  })
})

test('the file scheme opens with no line', async () => {
  expect(editorUrl('file', { path: '/a b.py', line: 3 })).toBe('file:///a%20b.py')
  expect(editorUrl('cursor', { path: '/a b.py', line: 3, column: 2 })).toBe('cursor://file/a%20b.py:3:2')
})

const stubHost = (on: On, opened: string[][], isOpenMissing = false) => {
  on('session.cwd', () => ({ value: CWD }))
  on('env.get', ($, e) => ({ value: e.name === 'HOME' ? HOME : e.name === 'TERMLINK_SCHEME' ? 'vscode' : undefined }))
  on('session.messages', () => ({ value: [] }))
  on('fs.stat', ($, e) => {
    if (e.path === '/home/me/other/.git') return { value: { kind: 'dir', size: 0, mtimeMs: 0, isLink: false } }
    if (!FILES.has(e.path)) return { deny: 'ENOENT' }
    return { value: { kind: 'file', size: 1, mtimeMs: 0, isLink: false } }
  })
  on('process.run', ($, e) => {
    if (isOpenMissing && e.argv[0] === 'open') return { deny: 'not found' }
    opened.push([...e.argv])
    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
}

const PROPS = { text: 'look at libs/a.py:42', isFirstOfReply: true }

test('a plain click on a terminal link opens the editor at the line', async ($, on) => {
  const opened: string[][] = []
  stubHost(on, opened)
  const ui = await $.ui.mount({ plugin: 'termlink', surface: 'terminal', component: 'AssistantMessage', props: PROPS })
  const markdown = await ui.find({ type: 'Markdown' })
  expect(markdown?.props.text).toBe('look at [libs/a.py:42](file:///repo/libs/a.py#L42)')
  await ui.press({ key: markdown!.key!, link: { href: 'file:///repo/libs/a.py#L42' } })
  expect(opened).toEqual([['open', 'vscode://file/repo/libs/a.py:42']])
  await ui.unmount()
})

test('a reply with no paths is left to the engine', async ($, on) => {
  stubHost(on, [])
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['engine'] }))
  const ui = await $.ui.mount({
    plugin: 'termlink',
    surface: 'terminal',
    component: 'AssistantMessage',
    props: { text: 'nothing here', isFirstOfReply: true },
  })
  expect(await ui.find({ type: 'Markdown' })).toBe(undefined)
  await ui.unmount()
})

test('a relative path resolves in a project a tool call worked in', async ($, on) => {
  stubHost(on, [])
  on('tool.call', () => ({ result: { content: 'ok' } }))
  await $.tool.call({ tool: 'Read', file_path: '/home/me/other/README.md' })
  const ui = await $.ui.mount({
    plugin: 'termlink',
    surface: 'terminal',
    component: 'AssistantMessage',
    props: { text: 'see claude-mod/tsconfig.json', isFirstOfReply: true },
  })
  const markdown = await ui.find({ type: 'Markdown' })
  expect(markdown?.props.text).toBe('see [claude-mod/tsconfig.json](file:///home/me/other/claude-mod/tsconfig.json)')
  await ui.unmount()
})

test('a click falls back to xdg-open where open cannot start', async ($, on) => {
  const opened: string[][] = []
  stubHost(on, opened, true)
  const ui = await $.ui.mount({ plugin: 'termlink', surface: 'terminal', component: 'AssistantMessage', props: PROPS })
  const markdown = await ui.find({ type: 'Markdown' })
  await ui.press({ key: markdown!.key!, link: { href: 'file:///repo/libs/a.py#L42' } })
  expect(opened).toEqual([['xdg-open', 'vscode://file/repo/libs/a.py:42']])
  await ui.unmount()
})

test('the system prompt gets the file-links section on the terminal only', async ($, on) => {
  on('prompt.compose', () => ({ sections: [{ id: 'intro', text: 'hi', scope: 'shared' }] }))
  const base = { model: 'm', promptModel: 'm', tools: [], outputStyle: null, traits: [] }
  const terminal = await $.prompt.compose({ ...base, surfaces: ['terminal'] })
  expect(terminal.sections.map(section => section.id)).toEqual(['intro', 'termlink:file-links'])
  const headless = await $.prompt.compose({ ...base, surfaces: [] })
  expect(headless.sections.map(section => section.id)).toEqual(['intro'])
})
