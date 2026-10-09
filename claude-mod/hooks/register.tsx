import type { EngineInterface, Register } from 'claude-code'

import { encodePath, fromHref, linkify } from './linkify'

const SCHEMES = ['vscode', 'vscode-insiders', 'cursor', 'file'] as const
type Scheme = (typeof SCHEMES)[number]

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
  const wanted = (await $.env.get('TERMLINK_SCHEME')) ?? 'vscode'
  const scheme: Scheme = (SCHEMES as readonly string[]).includes(wanted) ? (wanted as Scheme) : 'vscode'
  const location = `${target.line === undefined ? '' : `:${target.line}`}${target.column === undefined ? '' : `:${target.column}`}`
  const argv = scheme === 'file' ? ['open', target.path] : ['open', `${scheme}://file${encodePath(target.path)}${location}`]
  const { exitCode, stderr } = await $.process.run(argv)
  if (exitCode !== 0) $.ui.toast(`termlink: could not open ${target.path}: ${stderr.trim()}`)
}

export const register: Register = on => {
  // A hit is kept; a miss is asked again after a while, since a turn may create the file.
  const files = new Set<string>()
  const misses = new Map<string, number>()
  const MISS_TTL_MS = 10_000

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (e.props.isSummary) return next(e)

    const isFile = async (path: string) => {
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
    const cwd = await $.session.cwd()
    const home = (await $.env.get('HOME')) ?? ''
    const { text, hrefs } = await linkify(e.props.text, cwd, home, isFile)
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
}
