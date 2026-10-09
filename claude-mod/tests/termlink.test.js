"use strict";
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var testing_1 = require("claude-code/testing");
var linkify_1 = require("../hooks/linkify");
var editor_1 = require("../hooks/editor");
var roots_1 = require("../hooks/roots");
var CWD = '/repo';
var HOME = '/home/me';
var FILES = new Set([
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
]);
var isFile = function (path) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    return [2 /*return*/, FILES.has(path)];
}); }); };
var run = function (text) { return (0, linkify_1.linkify)(text, [CWD], HOME, isFile); };
(0, testing_1.describe)('linkify', function () {
    (0, testing_1.test)('links an existing bare path with its line', function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, text, hrefs;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, run('see libs/a.py:42 for it')];
                case 1:
                    _a = _b.sent(), text = _a.text, hrefs = _a.hrefs;
                    (0, testing_1.expect)(text).toBe('see [libs/a.py:42](file:///repo/libs/a.py#L42) for it');
                    (0, testing_1.expect)(hrefs).toEqual(['file:///repo/libs/a.py#L42']);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, testing_1.test)('keeps a code span inside the link and reads a (line N) note', function () { return __awaiter(void 0, void 0, void 0, function () {
        var text;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, run('open `libs/a.py` (line 7), and `./README.md`.')];
                case 1:
                    text = (_a.sent()).text;
                    (0, testing_1.expect)(text).toBe('open [`libs/a.py`](file:///repo/libs/a.py#L7) (line 7), and [`./README.md`](file:///repo/README.md).');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, testing_1.test)('takes line and column', function () { return __awaiter(void 0, void 0, void 0, function () {
        var text;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, run('libs/a.py:3:9')];
                case 1:
                    text = (_a.sent()).text;
                    (0, testing_1.expect)(text).toBe('[libs/a.py:3:9](file:///repo/libs/a.py#L3C9)');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, testing_1.test)('resolves home paths', function () { return __awaiter(void 0, void 0, void 0, function () {
        var hrefs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, run('in ~/notes.md')];
                case 1:
                    hrefs = (_a.sent()).hrefs;
                    (0, testing_1.expect)(hrefs).toEqual(['file:///home/me/notes.md']);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, testing_1.test)('links hidden files and folders', function () { return __awaiter(void 0, void 0, void 0, function () {
        var hrefs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, run('see ~/.claude/rules/x.md:3 and .gitignore')];
                case 1:
                    hrefs = (_a.sent()).hrefs;
                    (0, testing_1.expect)(hrefs).toEqual(['file:///home/me/.claude/rules/x.md#L3', 'file:///repo/.gitignore']);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, testing_1.test)('leaves missing files, plain words, links, URLs and commands alone', function () { return __awaiter(void 0, void 0, void 0, function () {
        var input, _a, text, hrefs;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    input = [
                        'missing libs/b.py and e.g. Node.js',
                        '[libs/a.py](https://example.com/libs/a.py)',
                        'https://github.com/x/libs/a.py',
                        'run `uv run pytest libs/a.py` now',
                    ].join('\n');
                    return [4 /*yield*/, run(input)];
                case 1:
                    _a = _b.sent(), text = _a.text, hrefs = _a.hrefs;
                    (0, testing_1.expect)(text).toBe(input);
                    (0, testing_1.expect)(hrefs).toEqual([]);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, testing_1.test)('leaves fenced code blocks alone', function () { return __awaiter(void 0, void 0, void 0, function () {
        var input, text;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    input = 'before libs/a.py\n```\nlibs/a.py:1\n```\nafter';
                    return [4 /*yield*/, run(input)];
                case 1:
                    text = (_a.sent()).text;
                    (0, testing_1.expect)(text).toBe('before [libs/a.py](file:///repo/libs/a.py)\n```\nlibs/a.py:1\n```\nafter');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, testing_1.test)('drops trailing punctuation from the path', function () { return __awaiter(void 0, void 0, void 0, function () {
        var text;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, run('It is in README.md.')];
                case 1:
                    text = (_a.sent()).text;
                    (0, testing_1.expect)(text).toBe('It is in [README.md](file:///repo/README.md).');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, testing_1.test)('lists each href once', function () { return __awaiter(void 0, void 0, void 0, function () {
        var hrefs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, run('README.md and README.md')];
                case 1:
                    hrefs = (_a.sent()).hrefs;
                    (0, testing_1.expect)(hrefs).toEqual(['file:///repo/README.md']);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, testing_1.test)('href round-trips through spaces and parentheses', function () { return __awaiter(void 0, void 0, void 0, function () {
        var target;
        return __generator(this, function (_a) {
            target = { path: '/repo/my dir/(x).ts', line: 4, column: 2 };
            (0, testing_1.expect)((0, linkify_1.toHref)(target)).toBe('file:///repo/my%20dir/%28x%29.ts#L4C2');
            (0, testing_1.expect)((0, linkify_1.fromHref)((0, linkify_1.toHref)(target))).toEqual(target);
            (0, testing_1.expect)((0, linkify_1.fromHref)('https://example.com')).toBe(undefined);
            return [2 /*return*/];
        });
    }); });
    (0, testing_1.test)('tries a relative path against each base in order', function () { return __awaiter(void 0, void 0, void 0, function () {
        var twoBases, cwdFirst;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, linkify_1.linkify)('claude-mod/tsconfig.json', [CWD, '/third', '/other'], HOME, isFile)];
                case 1:
                    twoBases = _a.sent();
                    (0, testing_1.expect)(twoBases.hrefs).toEqual(['file:///third/claude-mod/tsconfig.json']);
                    return [4 /*yield*/, (0, linkify_1.linkify)('README.md', [CWD, '/other'], HOME, isFile)];
                case 2:
                    cwdFirst = _a.sent();
                    (0, testing_1.expect)(cwdFirst.hrefs).toEqual(['file:///repo/README.md']);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, testing_1.test)('folds dot segments', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            (0, testing_1.expect)((0, linkify_1.resolvePath)('../x/./y.py', '/a/b', HOME)).toBe('/a/x/y.py');
            return [2 /*return*/];
        });
    }); });
});
(0, testing_1.describe)('roots', function () {
    (0, testing_1.test)('reads the paths a tool call names', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            (0, testing_1.expect)((0, roots_1.pathsOfToolUse)('Read', { file_path: '/a/b.py' }, HOME)).toEqual(['/a/b.py']);
            (0, testing_1.expect)((0, roots_1.pathsOfToolUse)('Grep', { pattern: 'x', path: '~/proj' }, HOME)).toEqual(['/home/me/proj']);
            (0, testing_1.expect)((0, roots_1.pathsOfToolUse)('Bash', { command: 'cd ~/proj && ls; cd "/s p" ; cd rel' }, HOME)).toEqual([
                '/home/me/proj',
                '/s p',
            ]);
            return [2 /*return*/];
        });
    }); });
    (0, testing_1.test)('finds the nearest git folder, else the folder itself', function () { return __awaiter(void 0, void 0, void 0, function () {
        var tree, kindOf, _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    tree = {
                        '/home/me/proj/.git': 'dir',
                        '/home/me/proj/src/a.py': 'file',
                        '/home/me/notes/n.md': 'file',
                        '/tmp/x.py': 'file',
                    };
                    kindOf = function (path) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, tree[path]];
                    }); }); };
                    _a = testing_1.expect;
                    return [4 /*yield*/, (0, roots_1.projectRoot)('/home/me/proj/src/a.py', HOME, kindOf)];
                case 1:
                    _a.apply(void 0, [_e.sent()]).toBe('/home/me/proj');
                    _b = testing_1.expect;
                    return [4 /*yield*/, (0, roots_1.projectRoot)('/home/me/notes/n.md', HOME, kindOf)];
                case 2:
                    _b.apply(void 0, [_e.sent()]).toBe('/home/me/notes');
                    _c = testing_1.expect;
                    return [4 /*yield*/, (0, roots_1.projectRoot)('/tmp/x.py', HOME, kindOf)];
                case 3:
                    _c.apply(void 0, [_e.sent()]).toBe(undefined);
                    _d = testing_1.expect;
                    return [4 /*yield*/, (0, roots_1.projectRoot)('/home/me/gone.py', HOME, kindOf)];
                case 4:
                    _d.apply(void 0, [_e.sent()]).toBe(undefined);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, testing_1.test)('puts the most recently used root first, after the working directory', function () { return __awaiter(void 0, void 0, void 0, function () {
        var roots;
        return __generator(this, function (_a) {
            roots = new roots_1.Roots();
            roots.use('/a');
            roots.use('/b');
            roots.use('/a');
            roots.use('/repo');
            (0, testing_1.expect)(roots.bases('/repo')).toEqual(['/repo', '/a', '/b']);
            return [2 /*return*/];
        });
    }); });
});
(0, testing_1.test)('the file scheme opens with no line', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        (0, testing_1.expect)((0, editor_1.editorUrl)('file', { path: '/a b.py', line: 3 })).toBe('file:///a%20b.py');
        (0, testing_1.expect)((0, editor_1.editorUrl)('cursor', { path: '/a b.py', line: 3, column: 2 })).toBe('cursor://file/a%20b.py:3:2');
        return [2 /*return*/];
    });
}); });
var stubHost = function (on, opened) {
    on('session.cwd', function () { return ({ value: CWD }); });
    on('env.get', function ($, e) { return ({ value: e.name === 'HOME' ? HOME : e.name === 'TERMLINK_SCHEME' ? 'vscode' : undefined }); });
    on('session.messages', function () { return ({ value: [] }); });
    on('fs.stat', function ($, e) {
        if (e.path === '/home/me/other/.git')
            return { value: { kind: 'dir', size: 0, mtimeMs: 0, isLink: false } };
        if (!FILES.has(e.path))
            return { deny: 'ENOENT' };
        return { value: { kind: 'file', size: 1, mtimeMs: 0, isLink: false } };
    });
    on('process.run', function ($, e) {
        opened.push(__spreadArray([], e.argv, true));
        return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } };
    });
};
var PROPS = { text: 'look at libs/a.py:42', isFirstOfReply: true };
(0, testing_1.test)('a plain click on a terminal link opens the editor at the line', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var opened, ui, markdown;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                opened = [];
                stubHost(on, opened);
                return [4 /*yield*/, $.ui.mount({ plugin: 'termlink', surface: 'terminal', component: 'AssistantMessage', props: PROPS })];
            case 1:
                ui = _a.sent();
                return [4 /*yield*/, ui.find({ type: 'Markdown' })];
            case 2:
                markdown = _a.sent();
                (0, testing_1.expect)(markdown === null || markdown === void 0 ? void 0 : markdown.props.text).toBe('look at [libs/a.py:42](file:///repo/libs/a.py#L42)');
                return [4 /*yield*/, ui.press({ key: markdown.key, link: { href: 'file:///repo/libs/a.py#L42' } })];
            case 3:
                _a.sent();
                (0, testing_1.expect)(opened).toEqual([['open', 'vscode://file/repo/libs/a.py:42']]);
                return [4 /*yield*/, ui.unmount()];
            case 4:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('a reply with no paths is left to the engine', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var ui, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                stubHost(on, []);
                on('ui.render', function () { return ({ type: 'Text', props: {}, children: ['engine'] }); });
                return [4 /*yield*/, $.ui.mount({
                        plugin: 'termlink',
                        surface: 'terminal',
                        component: 'AssistantMessage',
                        props: { text: 'nothing here', isFirstOfReply: true },
                    })];
            case 1:
                ui = _b.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, ui.find({ type: 'Markdown' })];
            case 2:
                _a.apply(void 0, [_b.sent()]).toBe(undefined);
                return [4 /*yield*/, ui.unmount()];
            case 3:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('a relative path resolves in a project a tool call worked in', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var ui, markdown;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                stubHost(on, []);
                on('tool.call', function () { return ({ result: { content: 'ok' } }); });
                return [4 /*yield*/, $.tool.call({ tool: 'Read', file_path: '/home/me/other/README.md' })];
            case 1:
                _a.sent();
                return [4 /*yield*/, $.ui.mount({
                        plugin: 'termlink',
                        surface: 'terminal',
                        component: 'AssistantMessage',
                        props: { text: 'see claude-mod/tsconfig.json', isFirstOfReply: true },
                    })];
            case 2:
                ui = _a.sent();
                return [4 /*yield*/, ui.find({ type: 'Markdown' })];
            case 3:
                markdown = _a.sent();
                (0, testing_1.expect)(markdown === null || markdown === void 0 ? void 0 : markdown.props.text).toBe('see [claude-mod/tsconfig.json](file:///home/me/other/claude-mod/tsconfig.json)');
                return [4 /*yield*/, ui.unmount()];
            case 4:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
