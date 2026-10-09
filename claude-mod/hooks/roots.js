"use strict";
// The project folders Claude has worked in this session, most recent first.
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
exports.Roots = void 0;
exports.pathsOfToolUse = pathsOfToolUse;
exports.projectRoot = projectRoot;
var MAX_ROOTS = 20;
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
function pathsOfToolUse(tool, input, home) {
    var _a, _b;
    var named = [];
    for (var _i = 0, _c = ['file_path', 'notebook_path', 'path']; _i < _c.length; _i++) {
        var key = _c[_i];
        var value = input[key];
        if (typeof value === 'string')
            named.push(value);
    }
    var command = input.command;
    if (tool === 'Bash' && typeof command === 'string') {
        for (var _d = 0, _e = command.matchAll(/(?:^|[;&|(]\s*)cd\s+(?:"([^"]+)"|'([^']+)'|([^\s;&|)]+))/g); _d < _e.length; _d++) {
            var match = _e[_d];
            named.push(((_b = (_a = match[1]) !== null && _a !== void 0 ? _a : match[2]) !== null && _b !== void 0 ? _b : match[3]));
        }
    }
    return named
        .map(function (path) { return (path.startsWith('~/') ? "".concat(home, "/").concat(path.slice(2)) : path); })
        .filter(function (path) { return path.startsWith('/'); });
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
function projectRoot(path, home, kindOf) {
    return __awaiter(this, void 0, void 0, function () {
        var kind, start, dir;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, kindOf(path)];
                case 1:
                    kind = _a.sent();
                    if (kind === undefined)
                        return [2 /*return*/, undefined];
                    start = kind === 'dir' ? path.replace(/\/+$/, '') : path.slice(0, path.lastIndexOf('/'));
                    dir = start;
                    _a.label = 2;
                case 2:
                    if (!dir.startsWith("".concat(home, "/"))) return [3 /*break*/, 5];
                    return [4 /*yield*/, kindOf("".concat(dir, "/.git"))];
                case 3:
                    if ((_a.sent()) !== undefined)
                        return [2 /*return*/, dir];
                    _a.label = 4;
                case 4:
                    dir = dir.slice(0, dir.lastIndexOf('/'));
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, start.startsWith("".concat(home, "/")) ? start : undefined];
            }
        });
    });
}
/**
 * The project folders seen, the most recently used first, at most 20.
 */
var Roots = /** @class */ (function () {
    function Roots() {
        this.recent = [];
    }
    /**
     * Moves a folder to the front, adding it when new.
     *
     * Args:
     *   root: the absolute folder.
     */
    Roots.prototype.use = function (root) {
        this.recent = __spreadArray([root], this.recent.filter(function (seen) { return seen !== root; }), true).slice(0, MAX_ROOTS);
    };
    /**
     * The folders to resolve a relative path against: `first`, then the rest.
     *
     * Args:
     *   first: the folder tried before any other, the session's working directory.
     *
     * Returns:
     *   The folders in the order to try them, without repeats.
     */
    Roots.prototype.bases = function (first) {
        return __spreadArray([first], this.recent.filter(function (root) { return root !== first; }), true);
    };
    return Roots;
}());
exports.Roots = Roots;
