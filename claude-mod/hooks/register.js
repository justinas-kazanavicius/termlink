"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
exports.register = void 0;
var editor_1 = require("./editor");
var linkify_1 = require("./linkify");
var roots_1 = require("./roots");
/**
 * Opens a link this mod drew in the editor TERMLINK_SCHEME names, at its line.
 *
 * Args:
 *   $: the engine interface.
 *   href: the pressed link's `file://` URL.
 */
function openAtLine($, href) {
    return __awaiter(this, void 0, void 0, function () {
        var target, _a, exitCode, stderr, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    target = (0, linkify_1.fromHref)(href);
                    if (target === undefined)
                        return [2 /*return*/];
                    _c = (_b = $.process).run;
                    _d = ['open'];
                    _e = editor_1.editorUrl;
                    return [4 /*yield*/, schemeOf($)];
                case 1: return [4 /*yield*/, _c.apply(_b, [_d.concat([_e.apply(void 0, [_f.sent(), target])])])];
                case 2:
                    _a = _f.sent(), exitCode = _a.exitCode, stderr = _a.stderr;
                    if (exitCode !== 0)
                        $.ui.toast("termlink: could not open ".concat(target.path, ": ").concat(stderr.trim()));
                    return [2 /*return*/];
            }
        });
    });
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
function noteRoots($, roots, tool, input) {
    return __awaiter(this, void 0, void 0, function () {
        var home, _i, _a, path, _b, _c, _d, root;
        var _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, $.env.get('HOME')];
                case 1:
                    home = (_e = (_f.sent())) !== null && _e !== void 0 ? _e : '';
                    _i = 0, _a = (0, roots_1.pathsOfToolUse)(tool, input, home);
                    _f.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 6];
                    path = _a[_i];
                    if (!!rootOf.has(path)) return [3 /*break*/, 4];
                    _c = (_b = rootOf).set;
                    _d = [path];
                    return [4 /*yield*/, (0, roots_1.projectRoot)(path, home, kindOf($))];
                case 3:
                    _c.apply(_b, _d.concat([_f.sent()]));
                    _f.label = 4;
                case 4:
                    root = rootOf.get(path);
                    if (root !== undefined)
                        roots.use(root);
                    _f.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Each path's project, looked up once: the history names the same files many times.
var rootOf = new Map();
var kindOf = function ($) { return function (path) { return __awaiter(void 0, void 0, void 0, function () { var _a; return __generator(this, function (_b) {
    switch (_b.label) {
        case 0: return [4 /*yield*/, $.fs.stat(path).catch(function () { return undefined; })];
        case 1: return [2 /*return*/, (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a.kind
            // A hit is kept; a miss is asked again after a while, since a turn may create the file.
        ];
    }
}); }); }; };
// A hit is kept; a miss is asked again after a while, since a turn may create the file.
var files = new Set();
var misses = new Map();
var MISS_TTL_MS = 10000;
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
function isFile($, path) {
    return __awaiter(this, void 0, void 0, function () {
        var missedAt, stat;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (files.has(path))
                        return [2 /*return*/, true];
                    missedAt = misses.get(path);
                    if (missedAt !== undefined && Date.now() - missedAt < MISS_TTL_MS)
                        return [2 /*return*/, false];
                    return [4 /*yield*/, $.fs.stat(path).catch(function () { return undefined; })];
                case 1:
                    stat = _a.sent();
                    if ((stat === null || stat === void 0 ? void 0 : stat.kind) !== 'file') {
                        misses.set(path, Date.now());
                        return [2 /*return*/, false];
                    }
                    files.add(path);
                    misses.delete(path);
                    return [2 /*return*/, true];
            }
        });
    });
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
function schemeOf($) {
    return __awaiter(this, void 0, void 0, function () {
        var wanted;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, $.env.get('TERMLINK_SCHEME')];
                case 1:
                    wanted = (_a = (_b.sent())) !== null && _a !== void 0 ? _a : 'vscode';
                    return [2 /*return*/, editor_1.SCHEMES.includes(wanted) ? wanted : 'vscode'];
            }
        });
    });
}
var register = function (on) {
    var roots = new roots_1.Roots();
    // The history is read on each load, so a reload or a resumed session starts with its roots.
    // It runs past the hook, so a long session never holds up its start.
    on('session.start', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, $.command.register({
                        name: 'termlink-roots',
                        description: 'List the folders termlink resolves relative paths against',
                    })];
                case 1:
                    _a.sent();
                    void (function () { return __awaiter(void 0, void 0, void 0, function () {
                        var _i, _a, message, _b, _c, use;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    _i = 0;
                                    return [4 /*yield*/, $.session.messages()];
                                case 1:
                                    _a = _d.sent();
                                    _d.label = 2;
                                case 2:
                                    if (!(_i < _a.length)) return [3 /*break*/, 7];
                                    message = _a[_i];
                                    _b = 0, _c = message.toolUses;
                                    _d.label = 3;
                                case 3:
                                    if (!(_b < _c.length)) return [3 /*break*/, 6];
                                    use = _c[_b];
                                    return [4 /*yield*/, noteRoots($, roots, use.tool, use.input)];
                                case 4:
                                    _d.sent();
                                    _d.label = 5;
                                case 5:
                                    _b++;
                                    return [3 /*break*/, 3];
                                case 6:
                                    _i++;
                                    return [3 /*break*/, 2];
                                case 7:
                                    $.ui.invalidate('ui.render');
                                    return [2 /*return*/];
                            }
                        });
                    }); })();
                    return [2 /*return*/, next(e)];
            }
        });
    }); });
    on('command.run', { command: 'termlink-roots' }, function ($) { return __awaiter(void 0, void 0, void 0, function () {
        var bases, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _b = (_a = roots).bases;
                    return [4 /*yield*/, $.session.cwd()];
                case 1:
                    bases = _b.apply(_a, [_c.sent()]);
                    return [2 /*return*/, { text: bases.map(function (base, at) { return "".concat(at + 1, ". ").concat(base); }).join('\n') }];
            }
        });
    }); });
    on('ui.render', { component: 'AssistantMessage' }, function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var cwd, home, _a, text, hrefs, _b, Box, Text, Markdown;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (e.props.isSummary)
                        return [2 /*return*/, next(e)];
                    return [4 /*yield*/, $.session.cwd()];
                case 1:
                    cwd = _d.sent();
                    return [4 /*yield*/, $.env.get('HOME')];
                case 2:
                    home = (_c = (_d.sent())) !== null && _c !== void 0 ? _c : '';
                    return [4 /*yield*/, (0, linkify_1.linkify)(e.props.text, roots.bases(cwd), home, function (path) { return isFile($, path); })];
                case 3:
                    _a = _d.sent(), text = _a.text, hrefs = _a.hrefs;
                    if (hrefs.length === 0)
                        return [2 /*return*/, next(e)
                            // Elsewhere the engine's own row draws the links, opened as the surface opens links.
                        ];
                    // Elsewhere the engine's own row draws the links, opened as the surface opens links.
                    if (e.surface !== 'terminal')
                        return [2 /*return*/, next(__assign(__assign({}, e), { props: __assign(__assign({}, e.props), { text: text }) }))];
                    _b = $.ui.resolve(e), Box = _b.Box, Text = _b.Text, Markdown = _b.Markdown;
                    return [2 /*return*/, (<Box flexDirection="row">
        <Box minWidth={2}>
          <Text>{e.props.isFirstOfReply ? '⏺' : ' '}</Text>
        </Box>
        <Box flexDirection="column" flexGrow={1}>
          <Markdown key={"termlink-".concat(e.requestId)} text={text} pressableLinks={hrefs.slice(0, 256)} onLinkPress={function (link) { return openAtLine($, link.href); }}/>
        </Box>
      </Box>)];
            }
        });
    }); });
    // A hook that throws is skipped, so a failed lookup never holds up the call.
    on('tool.call', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, noteRoots($, roots, e.tool, e)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, next(e)];
            }
        });
    }); });
};
exports.register = register;
