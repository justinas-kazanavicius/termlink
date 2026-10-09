"use strict";
// Which editor opens a file, and the URL that opens it there.
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCHEMES = void 0;
exports.editorUrl = editorUrl;
var linkify_1 = require("./linkify");
exports.SCHEMES = ['vscode', 'vscode-insiders', 'cursor', 'file'];
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
function editorUrl(scheme, target) {
    if (scheme === 'file')
        return "file://".concat((0, linkify_1.encodePath)(target.path));
    var location = "".concat(target.line === undefined ? '' : ":".concat(target.line)).concat(target.column === undefined ? '' : ":".concat(target.column));
    return "".concat(scheme, "://file").concat((0, linkify_1.encodePath)(target.path)).concat(location);
}
