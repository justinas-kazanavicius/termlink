"use strict";
// Finds file paths in markdown and turns the ones that exist into file:// links.
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.looksLikePath = looksLikePath;
exports.resolvePath = resolvePath;
exports.encodePath = encodePath;
exports.toHref = toHref;
exports.fromHref = fromHref;
exports.linkify = linkify;
exports.findFile = findFile;
// A dot may lead a segment, so hidden files and folders (`.claude`, `.gitignore`) match.
var SEG = String.raw(templateObject_1 || (templateObject_1 = __makeTemplateObject([".?[w@+-](?:[w.@+-]*[w@+-])?"], ["\\.?[\\w@+-](?:[\\w.@+-]*[\\w@+-])?"])));
var PATH = String.raw(templateObject_2 || (templateObject_2 = __makeTemplateObject(["(?:~|.{1,2})?/?", "(?:/", ")*"], ["(?:~|\\.{1,2})?/?", "(?:/", ")*"])), SEG, SEG);
var LOC = String.raw(templateObject_3 || (templateObject_3 = __makeTemplateObject(["(?::(d+)(?::(d+))?)?"], ["(?::(\\d+)(?::(\\d+))?)?"])));
var LINE_NOTE = String.raw(templateObject_4 || (templateObject_4 = __makeTemplateObject(["(s*(line (d+)))?"], ["(\\s*\\(line (\\d+)\\))?"
    // Alternatives in order: links and URLs (left alone), a code span holding only a path,
    // any other code span (left alone), a bare path.
])));
// Alternatives in order: links and URLs (left alone), a code span holding only a path,
// any other code span (left alone), a bare path.
var TOKEN = new RegExp([
    String.raw(templateObject_5 || (templateObject_5 = __makeTemplateObject(["[[^]\n]*]([^)\n]*)"], ["\\[[^\\]\\n]*\\]\\([^)\\n]*\\)"]))),
    String.raw(templateObject_6 || (templateObject_6 = __makeTemplateObject(["[a-zA-Z][w+.-]*://[^s)>]+"], ["[a-zA-Z][\\w+.-]*://[^\\s)>]+"]))),
    String.raw(templateObject_7 || (templateObject_7 = __makeTemplateObject(["`(", ")", "`", ""], ["\\x60(", ")", "\\x60", ""])), PATH, LOC, LINE_NOTE),
    String.raw(templateObject_8 || (templateObject_8 = __makeTemplateObject(["`[^`\n]*`"], ["\\x60[^\\x60\\n]*\\x60"]))),
    String.raw(templateObject_9 || (templateObject_9 = __makeTemplateObject(["(?<![w/.~@+:-])(", ")", "", ""], ["(?<![\\w/.~@+:-])(", ")", "", ""])), PATH, LOC, LINE_NOTE),
].join('|'), 'g');
var FENCE = /^ {0,3}(`{3,}|~{3,})/;
/**
 * Whether a token could name a file: it has a slash, ends in an extension, or is a dotfile.
 *
 * Args:
 *   path: the token as written.
 *
 * Returns:
 *   True when it is worth asking the filesystem about.
 */
function looksLikePath(path) {
    return path.includes('/') || /\.[A-Za-z][A-Za-z0-9]{0,9}$/.test(path) || /^\.[\w-]+$/.test(path);
}
/**
 * Resolves a path as written against the working directory and home.
 *
 * Args:
 *   path: relative, absolute or `~/` path.
 *   base: the folder a relative path is resolved against.
 *   home: the user's home directory.
 *
 * Returns:
 *   The absolute path with `.` and `..` segments folded.
 */
function resolvePath(path, base, home) {
    var joined = path.startsWith('/') ? path : path.startsWith('~/') ? "".concat(home, "/").concat(path.slice(2)) : "".concat(base, "/").concat(path);
    var parts = [];
    for (var _i = 0, _a = joined.split('/'); _i < _a.length; _i++) {
        var part = _a[_i];
        if (part === '' || part === '.')
            continue;
        if (part === '..')
            parts.pop();
        else
            parts.push(part);
    }
    return "/".concat(parts.join('/'));
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
function encodePath(path) {
    return path
        .split('/')
        .map(function (part) { return encodeURIComponent(part).replace(/\(/g, '%28').replace(/\)/g, '%29'); })
        .join('/');
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
function toHref(target) {
    var encoded = encodePath(target.path);
    var fragment = target.line === undefined ? '' : "#L".concat(target.line).concat(target.column === undefined ? '' : "C".concat(target.column));
    return "file://".concat(encoded).concat(fragment);
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
function fromHref(href) {
    var match = /^file:\/\/([^#]+)(?:#L(\d+)(?:C(\d+))?)?$/.exec(href);
    if (match === null)
        return undefined;
    var encoded = match[1], line = match[2], column = match[3];
    return {
        path: decodeURIComponent(encoded),
        line: line === undefined ? undefined : Number(line),
        column: column === undefined ? undefined : Number(column),
    };
}
/**
 * Rewrites every path in the markdown that exists on disk as a link to it.
 *
 * Fenced code blocks, existing links and URLs are left as written. A path in a
 * code span keeps its backticks inside the link. A `(line N)` note after a path
 * stays as text and gives the link its line. A relative path links to the
 * first base it names a file under.
 *
 * Args:
 *   markdown: the reply's text.
 *   bases: the folders a relative path is tried against, in order.
 *   home: the user's home directory.
 *   isFile: whether an absolute path is a file.
 *
 * Returns:
 *   The rewritten text and the hrefs it now holds, in order, without repeats.
 */
function linkify(markdown, bases, home, isFile) {
    return __awaiter(this, void 0, void 0, function () {
        var hrefs, out, fence, prose, flush, _i, _a, line, opener_1;
        var _this = this;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    hrefs = [];
                    out = [];
                    prose = [];
                    flush = function () { return __awaiter(_this, void 0, void 0, function () {
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    if (!(prose.length > 0)) return [3 /*break*/, 2];
                                    _b = (_a = out).push;
                                    return [4 /*yield*/, linkifyProse(prose.join('\n'), bases, home, isFile, hrefs)];
                                case 1:
                                    _b.apply(_a, [_c.sent()]);
                                    _c.label = 2;
                                case 2:
                                    prose = [];
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    _i = 0, _a = markdown.split('\n');
                    _c.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 5];
                    line = _a[_i];
                    opener_1 = (_b = FENCE.exec(line)) === null || _b === void 0 ? void 0 : _b[1];
                    if (!(fence === undefined && opener_1 !== undefined)) return [3 /*break*/, 3];
                    return [4 /*yield*/, flush()];
                case 2:
                    _c.sent();
                    fence = opener_1[0].repeat(opener_1.length);
                    out.push(line);
                    return [3 /*break*/, 4];
                case 3:
                    if (fence !== undefined) {
                        if (line.trim().startsWith(fence))
                            fence = undefined;
                        out.push(line);
                    }
                    else {
                        prose.push(line);
                    }
                    _c.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5: return [4 /*yield*/, flush()];
                case 6:
                    _c.sent();
                    return [2 /*return*/, { text: out.join('\n'), hrefs: hrefs }];
            }
        });
    });
}
/**
 * Finds the file a path names: as written when anchored, else under each base.
 *
 * Args:
 *   path: the path as written.
 *   bases: the folders a relative path is tried against, in order.
 *   home: the user's home directory.
 *   isFile: whether an absolute path is a file.
 *
 * Returns:
 *   The absolute path of the first file found, or undefined.
 */
function findFile(path, bases, home, isFile) {
    return __awaiter(this, void 0, void 0, function () {
        var isAnchored, _i, _a, base, absolute;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    isAnchored = path.startsWith('/') || path.startsWith('~/');
                    _i = 0, _a = isAnchored ? bases.slice(0, 1) : bases;
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    base = _a[_i];
                    absolute = resolvePath(path, base, home);
                    return [4 /*yield*/, isFile(absolute)];
                case 2:
                    if (_b.sent())
                        return [2 /*return*/, absolute];
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, undefined];
            }
        });
    });
}
function linkifyProse(text, bases, home, isFile, hrefs) {
    return __awaiter(this, void 0, void 0, function () {
        var pieces, at, _i, _a, match, whole, spanPath, spanLine, spanCol, spanNote, spanNoteLine, barePath, bareLine, bareCol, bareNote, bareNoteLine, path, absolute, isSpan, line, column, note, label, href;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    pieces = [];
                    at = 0;
                    _i = 0, _a = text.matchAll(TOKEN);
                    _d.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    match = _a[_i];
                    whole = match[0], spanPath = match[1], spanLine = match[2], spanCol = match[3], spanNote = match[4], spanNoteLine = match[5], barePath = match[6], bareLine = match[7], bareCol = match[8], bareNote = match[9], bareNoteLine = match[10];
                    path = spanPath !== null && spanPath !== void 0 ? spanPath : barePath;
                    if (path === undefined || !looksLikePath(path))
                        return [3 /*break*/, 3];
                    return [4 /*yield*/, findFile(path, bases, home, isFile)];
                case 2:
                    absolute = _d.sent();
                    if (absolute === undefined)
                        return [3 /*break*/, 3];
                    isSpan = spanPath !== undefined;
                    line = (_b = (isSpan ? spanLine !== null && spanLine !== void 0 ? spanLine : spanNoteLine : bareLine !== null && bareLine !== void 0 ? bareLine : bareNoteLine)) !== null && _b !== void 0 ? _b : undefined;
                    column = isSpan ? spanCol : bareCol;
                    note = (_c = (isSpan ? spanNote : bareNote)) !== null && _c !== void 0 ? _c : '';
                    label = whole.slice(0, whole.length - note.length);
                    href = toHref({
                        path: absolute,
                        line: line === undefined ? undefined : Number(line),
                        column: column === undefined ? undefined : Number(column),
                    });
                    pieces.push(text.slice(at, match.index), "[".concat(label, "](").concat(href, ")"), note);
                    at = match.index + whole.length;
                    if (!hrefs.includes(href))
                        hrefs.push(href);
                    _d.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    pieces.push(text.slice(at));
                    return [2 /*return*/, pieces.join('')];
            }
        });
    });
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
