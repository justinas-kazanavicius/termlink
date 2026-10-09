// Which editor opens a file, and the URL that opens it there.

import { encodePath, type Target } from './linkify'

export const SCHEMES = ['vscode', 'vscode-insiders', 'cursor', 'file'] as const
export type Scheme = (typeof SCHEMES)[number]

/**
 * Builds the URL that opens a target in an editor, at its line where the scheme takes one.
 *
 * Args:
 *   scheme: the editor's URL scheme, or `file` for the default app.
 *   target: the absolute path and optional line and column.
 *
 * Returns:
 *   `vscode://file/abs/path:42:7`, or `file:///abs/path` for `file`.
 */
export function editorUrl(scheme: Scheme, target: Target): string {
  if (scheme === 'file') return `file://${encodePath(target.path)}`
  const location = `${target.line === undefined ? '' : `:${target.line}`}${target.column === undefined ? '' : `:${target.column}`}`
  return `${scheme}://file${encodePath(target.path)}${location}`
}
