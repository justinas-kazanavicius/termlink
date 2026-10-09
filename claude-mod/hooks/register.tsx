import type { EngineInterface, Register } from 'claude-code'

import { editorUrl, type Scheme, SCHEMES } from './editor'
import { fromHref, linkify } from './linkify'
import { pathsOfToolUse, projectRoot, Roots } from './roots'

/**
 * Opens a link this mod drew in the editor TERMLINK_SCHEME names, at its line.
 *
 * Args:
 *   $: the engine interface.
 *   href: the pressed link's `file://` URL.
 */
async function openAtLine($: EngineInterface, href: string): Promise<void> {
  const target = fromHref(href)
  if (target === undefined) return
  const { exitCode, stderr } = await $.process.run(['open', editorUrl(await schemeOf($), target)])
  if (exitCode !== 0) $.ui.toast(`termlink: could not open ${target.path}: ${stderr.trim()}`)
}

/**
 * Notes the projects a tool call works in as the most recently used roots.
 *
 * Args:
 *   $: the engine interface.
 *   roots: the roots to update.
 *   tool: the tool's name.
 *   input: the arguments the model gave it.
 */
async function noteRoots($: EngineInterface, roots: Roots, tool: string, input: Record<string, unknown>): Promise<void> {
  const home = (await $.env.get('HOME')) ?? ''
  for (const path of pathsOfToolUse(tool, input, home)) {
    if (!rootOf.has(path)) rootOf.set(path, await projectRoot(path, home, kindOf($)))
    const root = rootOf.get(path)
    if (root !== undefined) roots.use(root)
  }
}

// Each path's project, looked up once: the history names the same files many times.
const rootOf = new Map<string, string | undefined>()

const kindOf = ($: EngineInterface) => async (path: string) => (await $.fs.stat(path).catch(() => undefined))?.kind

// A hit is kept; a miss is asked again after a while, since a turn may create the file.
const files = new Set<string>()
const misses = new Map<string, number>()
const MISS_TTL_MS = 10_000

/**
 * Whether a path is a file, remembered as described above.
 *
 * Args:
 *   $: the engine interface.
 *   path: an absolute path.
 *
 * Returns:
 *   True for a file.
 */
async function isFile($: EngineInterface, path: string): Promise<boolean> {
  if (files.has(path)) return true
  const missedAt = misses.get(path)
  if (missedAt !== undefined && Date.now() - missedAt < MISS_TTL_MS) return false
  const stat = await $.fs.stat(path).catch(() => undefined)
  if (stat?.kind !== 'file') {
    misses.set(path, Date.now())
    return false
  }
  files.add(path)
  misses.delete(path)
  return true
}

/**
 * Reads the editor TERMLINK_SCHEME names, `vscode` when unset or unknown.
 *
 * Args:
 *   $: the engine interface.
 *
 * Returns:
 *   The scheme.
 */
async function schemeOf($: EngineInterface): Promise<Scheme> {
  const wanted = (await $.env.get('TERMLINK_SCHEME')) ?? 'vscode'
  return (SCHEMES as readonly string[]).includes(wanted) ? (wanted as Scheme) : 'vscode'
}

export const register: Register = on => {
  const roots = new Roots()

  // The history is read on each load, so a reload or a resumed session starts with its roots.
  // It runs past the hook, so a long session never holds up its start.
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'termlink-roots',
      description: 'List the folders termlink resolves relative paths against',
    })
    void (async () => {
      for (const message of await $.session.messages()) {
        for (const use of message.toolUses) await noteRoots($, roots, use.tool, use.input)
      }
      $.ui.invalidate('ui.render')
    })()
    return next(e)
  })

  on('command.run', { command: 'termlink-roots' }, async $ => {
    const bases = roots.bases(await $.session.cwd())
    return { text: bases.map((base, at) => `${at + 1}. ${base}`).join('\n') }
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (e.props.isSummary) return next(e)

    const cwd = await $.session.cwd()
    const home = (await $.env.get('HOME')) ?? ''
    const { text, hrefs } = await linkify(e.props.text, roots.bases(cwd), home, path => isFile($, path))
    if (hrefs.length === 0) return next(e)

    // Elsewhere the engine's own row draws the links, opened as the surface opens links.
    if (e.surface !== 'terminal') return next({ ...e, props: { ...e.props, text } })

    const { Box, Text, Markdown } = $.ui.resolve(e)
    return (
      <Box flexDirection="row">
        <Box minWidth={2}>
          <Text>{e.props.isFirstOfReply ? '⏺' : ' '}</Text>
        </Box>
        <Box flexDirection="column" flexGrow={1}>
          <Markdown
            key={`termlink-${e.requestId}`}
            text={text}
            pressableLinks={hrefs.slice(0, 256)}
            onLinkPress={link => openAtLine($, link.href)}
          />
        </Box>
      </Box>
    )
  })

  // A hook that throws is skipped, so a failed lookup never holds up the call.
  on('tool.call', async ($, e, next) => {
    await noteRoots($, roots, e.tool, e as unknown as Record<string, unknown>)
    return next(e)
  })
}
