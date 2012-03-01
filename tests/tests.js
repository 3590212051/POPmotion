//-------------------------------------------------------------------
module("API");
//-------------------------------------------------------------------

test("Basic availability", function () {
	ok(XRegExp, "XRegExp exists");
	ok(XRegExp.INSIDE_CLASS, "XRegExp.INSIDE_CLASS exists");
	ok(XRegExp.OUTSIDE_CLASS, "XRegExp.OUTSIDE_CLASS exists");
	ok(XRegExp.addToken, "XRegExp.addToken exists");
	ok(XRegExp.cache, "XRegExp.cache exists");
	ok(XRegExp.escape, "XRegExp.escape exists");
	ok(XRegExp.exec, "XRegExp.exec exists");
	ok(XRegExp.forEach, "XRegExp.forEach exists");
	ok(XRegExp.freezeTokens, "XRegExp.freezeTokens exists");
	ok(XRegExp.globalize, "XRegExp.globalize exists");
	ok(XRegExp.isRegExp, "XRegExp.isRegExp exists");
	ok(XRegExp.matchChain, "XRegExp.matchChain exists");
	ok(XRegExp.version, "XRegExp.version exists");
	ok(RegExp.prototype.apply, "RegExp.prototype.apply exists");
	ok(RegExp.prototype.call, "RegExp.prototype.call exists");
});

test("XRegExp", function () {
	var regex = new XRegExp("(?:)");
	var regexG = new XRegExp("(?:)", "g");
	var regexGIM = new XRegExp("(?:)", "gim");
	var regexX = new XRegExp("(?:)", "x");
	var regexCopy = new XRegExp(regex);
	var regexNamedCapture = new XRegExp("(?<name>a)\\k<name>");

	equal(new XRegExp("").source, new RegExp("").source, "Empty regex source (test 1)");
	equal(new XRegExp("(?:)").source, /(?:)/.source, "Empty regex source (test 2)");
	equal(new XRegExp().source, new RegExp().source, "undefined regex source");
	equal(new XRegExp(null).source, new RegExp(null).source, "null regex source");
	equal(new XRegExp(NaN).source, new RegExp(NaN).source, "NaN regex source");
	equal(new XRegExp(1).source, new RegExp(1).source, "numeric regex source");
	equal(new XRegExp({}).source, new RegExp({}).source, "object regex source");
	ok(!(new XRegExp("(?:)")).global, "Regex without flags");
	ok(regexG.global, "Regex with global flag");
	ok(regexGIM.global && regexGIM.ignoreCase && regexGIM.multiline, "Regex with multiple flags");
	ok(!regexX.extended, "x flag stripped");
	deepEqual(regex, XRegExp(regex), "Regex copy and original are alike");
	notEqual(regex, XRegExp(regex), "Regex copy is new instance");
	ok(XRegExp(new XRegExp(""))._xregexp, "Copied XRegExp preserves special properties");
	ok(!XRegExp(new RegExp(""))._xregexp, "Copied RegExp is not assigned special properties");
	equal(XRegExp(regexNamedCapture).exec("aa").name, "a", "Regex copy retains named capture properties");
	raises(function () {XRegExp(regex, "g");}, Error, "Regex copy with flag throws");
	ok(new XRegExp("(?:)") instanceof RegExp, "Result is instanceof RegExp");
	equal(new XRegExp("(?:)").constructor, RegExp, "Result's constructor is RegExp");

	// Don't test this, since future XRegExp might throw like modern browsers do with RegExp
	//ok(XRegExp("(?:)", "gg").global, "Regex with duplicate flags");

	// This might be a good test in the future, but for now, XRegExp
	// doesn't throw on unsupported flags since it would add some
	// complexity and overhead to keep track of any flags checked for in
	// custom tokens.
	//raises(function () {XRegExp("", "?");}, Error, "Unsupported flag throws");
});

test("XRegExp.version", function () {
	var parts = XRegExp.version.split(".");

	equal(typeof XRegExp.version, "string", "Version is a string");
	equal(parts.length, 3, "Version is three dot-delimited parts");
	ok(!(isNaN(+parts[0]) || isNaN(+parts[1]) || isNaN(+parts[2])), "Version parts are all numeric");
});

test("XRegExp.addToken", function () {
	XRegExp.addToken(/\x01/, function () {return "1";});
	XRegExp.addToken(/\x02/, function () {return "2";}, XRegExp.INSIDE_CLASS);
	XRegExp.addToken(/\x03/, function () {return "3";}, XRegExp.OUTSIDE_CLASS);
	XRegExp.addToken(/\x04/, function () {return "4";}, XRegExp.INSIDE_CLASS | XRegExp.OUTSIDE_CLASS);
	XRegExp.addToken(/\x05/, function () {return "5";}, XRegExp.OUTSIDE_CLASS, function () {return this.hasFlag("5");});
	XRegExp.addToken(/\x06/, function () {this.setFlag("m"); return "6";});

	ok(XRegExp("\x01").test("1"), "Default scope matches outside class");
	ok(!XRegExp("[\x01]").test("1"), "Default scope doesn't match inside class");
	ok(!XRegExp("\x02").test("2"), "Explicit INSIDE_CLASS scope doesn't match outside class");
	ok(XRegExp("[\x02]").test("2"), "Explicit INSIDE_CLASS scope matches inside class");
	ok(XRegExp("\x03").test("3"), "Explicit OUTSIDE_CLASS scope matches outside class");
	ok(!XRegExp("[\x03]").test("3"), "Explicit OUTSIDE_CLASS scope doesn't match inside class");
	ok(XRegExp("\x04").test("4"), "Explicit INSIDE_CLASS|OUTSIDE_CLASS scope matches outside class");
	ok(XRegExp("[\x04]").test("4"), "Explicit INSIDE_CLASS|OUTSIDE_CLASS scope matches inside class");
	ok(!XRegExp("\x05").test("5"), "Trigger with hasFlag skips token when flag is missing");
	ok(XRegExp("\x05", "5").test("5"), "Trigger with hasFlag uses token when flag is included");
	ok(XRegExp("\x06").multiline, "Handler with setFlag activates flag when used");
});

test("XRegExp.cache", function () {
	var cached1 = XRegExp.cache("(?:)");
	var cached2 = XRegExp.cache("(?:)");
	var regexWithFlags = XRegExp(". +\\1 1", "gimsx");

	ok(cached1 instanceof RegExp, "Returns RegExp");
	strictEqual(cached1, cached2, "References to separately cached patterns refer to same object");
	deepEqual(XRegExp.cache(". +\\1 1", "gimsx"), regexWithFlags, "Cached pattern plus flags");
});

test("XRegExp.escape", function () {
	equal(XRegExp.escape("[()*+?.\\^$|"), "\\[\\(\\)\\*\\+\\?\\.\\\\\\^\\$\\|", "Metacharacters are escaped");
	equal(XRegExp.escape("]{}-, #"), "\\]\\{\\}\\-\\,\\ \\#", "Occasional metacharacters are escaped");
	equal(XRegExp.escape("abc_<123>!"), "abc_<123>!", "Nonmetacharacters are not escaped");
});

test("XRegExp.exec", function () {
	var rX = /x/g;
	var rA = /a/g;
	var xregexp = XRegExp("(?<name>a)"); // tests expect this to be nonglobal and use named capture
	var str = "abcxdef";
	var match;

	ok(XRegExp.exec(str, rX, 2), "Pos test 1");

	ok(!XRegExp.exec(str, rX, 5), "Pos test 2");

	rX.lastIndex = 5;
	ok(XRegExp.exec(str, rX, 2), "Pos ignores lastIndex test 1");

	rX.lastIndex = 0;
	ok(!XRegExp.exec(str, rX, 5), "Pos ignores lastIndex test 2");

	rA.lastIndex = 5;
	ok(XRegExp.exec(str, rA), "Pos ignores lastIndex test 3 (pos defaults to 0)");

	ok(XRegExp.exec(str, rX, 0, false), "Explicit !anchored allows matching after pos");

	ok(!XRegExp.exec(str, rX, 0, true), "Anchored match fails if match possible after (but not at) pos");

	ok(XRegExp.exec(str, rX, 3, true), "Anchored match succeeds if match at pos");

	equal(XRegExp.exec(str, rX, 5), null, "Result of failure is null");

	deepEqual(XRegExp.exec(str, xregexp), ["a", "a"], "Result of successful match is array with backreferences");

	match = XRegExp.exec(str, xregexp);
	equal(match.name, "a", "Match result includes named capture properties");

	xregexp.lastIndex = 5;
	XRegExp.exec(str, xregexp);
	equal(xregexp.lastIndex, 5, "lastIndex of nonglobal regex left as is");

	rX.lastIndex = 0;
	XRegExp.exec(str, rX);
	equal(rX.lastIndex, 4, "lastIndex of global regex updated to end of match");

	rX.lastIndex = 5;
	XRegExp.exec(str, rX, 2, true);
	equal(rX.lastIndex, 0, "lastIndex of global regex updated to 0 after failure");

	equal(XRegExp.exec("abc", /x/, 5), null, "pos greater than string length results in failure");
});

test("XRegExp.forEach", function () {
	var str = "abc 123 def";
	var regex = XRegExp("(?<first>\\w)\\w*");
	var regexG = XRegExp("(?<first>\\w)\\w*", "g");

	deepEqual(XRegExp.forEach(str, regex, function (m) {this.push(m[0]);}, []), ["abc", "123", "def"], "Match strings with nonglobal regex");
	deepEqual(XRegExp.forEach(str, regexG, function (m) {this.push(m[0]);}, []), ["abc", "123", "def"], "Match strings with global regex");
	deepEqual(XRegExp.forEach(str, regex, function (m) {this.push(m.first);}, []), ["a", "1", "d"], "Named backreferences");
	deepEqual(XRegExp.forEach(str, regex, function (m) {this.push(m.index);}, []), [0, 4, 8], "Match indexes");
	deepEqual(XRegExp.forEach(str, regex, function (m, i) {this.push(i);}, []), [0, 1, 2], "Match numbers");
	deepEqual(XRegExp.forEach(str, regex, function (m, i, s) {this.push(s);}, []), [str, str, str], "Source strings");
	deepEqual(XRegExp.forEach(str, regex, function (m, i, s, r) {this.push(r);}, []), [regex, regex, regex], "Source regexes");

	var str2 = str;
	deepEqual(XRegExp.forEach(str2, regex, function (m, i, s) {this.push(s); s += s; str2 += str2;}, []), [str, str, str], "Source string manipulation in callback doesn't affect iteration");

	var regex2 = XRegExp(regex);
	deepEqual(XRegExp.forEach(str, regex2, function (m, i, s, r) {this.push(i); r = /x/; regex2 = /x/;}, []), [0, 1, 2], "Source regex manipulation in callback doesn't affect iteration");

	regexG.lastIndex = 4;
	deepEqual(XRegExp.forEach(str, regexG, function (m) {this.push(m[0]);}, []), ["abc", "123", "def"], "Iteration starts at pos 0, ignoring lastIndex");

	regex.lastIndex = 4;
	XRegExp.forEach(str, regex, function () {});
	equal(regex.lastIndex, 4, "lastIndex of nonglobal regex unmodified after iteration");

	regexG.lastIndex = 4;
	XRegExp.forEach(str, regexG, function () {});
	equal(regexG.lastIndex, 0, "lastIndex of global regex reset to 0 after iteration");
});

test("XRegExp.freezeTokens", function () {
	XRegExp.freezeTokens();

	raises(function () {XRegExp.addToken(/>>>/, function () {return "Z";});}, Error, "addToken throws after freeze");
	ok(!XRegExp(">>>").test("Z"), "Token not added");
});

test("XRegExp.globalize", function () {
	var hasNativeY = typeof RegExp.prototype.sticky !== "undefined";
	var regex = XRegExp("(?<name>a)\\k<name>", "im" + (hasNativeY ? "y" : ""));
	var globalCopy = XRegExp.globalize(regex);
	var globalOrig = XRegExp("(?:)", "g");

	notEqual(regex, globalCopy, "Copy is new instance");
	ok(globalCopy.global, "Copy is global");
	equal(regex.source, globalCopy.source, "Copy has same source");
	ok(regex.ignoreCase === globalCopy.ignoreCase && regex.multiline === globalCopy.multiline && regex.sticky === globalCopy.sticky, "Copy has same ignoreCase, multiline, and sticky properties");
	ok(globalCopy.exec("aa").name, "Copy retains named capture capabilities");
	ok(XRegExp.globalize(globalOrig).global, "Copy of global regex is global");
});

test("XRegExp.isRegExp", function () {
	ok(XRegExp.isRegExp(/(?:)/), "Regex built by regex literal is RegExp");

	ok(XRegExp.isRegExp(RegExp("(?:)")), "Regex built by RegExp is RegExp");

	ok(XRegExp.isRegExp(XRegExp("(?:)")), "Regex built by XRegExp is RegExp");

	ok(!XRegExp.isRegExp(undefined), "undefined is not RegExp");

	ok(!XRegExp.isRegExp(null), "null is not RegExp");

	ok(!XRegExp.isRegExp({}), "Object literal is not RegExp");

	ok(!XRegExp.isRegExp(function () {}), "Function literal is not RegExp");

	var fakeRegex = {};
	fakeRegex.constructor = RegExp;
	ok(!XRegExp.isRegExp(fakeRegex), "Object with assigned RegExp constructor is not RegExp");

	var tamperedRegex = /x/;
	tamperedRegex.constructor = {};
	ok(XRegExp.isRegExp(tamperedRegex), "RegExp with assigned Object constructor is RegExp");

	var iframe = document.createElement("iframe");
	iframe.width = iframe.height = iframe.border = 0; //iframe.style.display = "none";
	document.body.appendChild(iframe);
	frames[frames.length - 1].document.write("<script>var regex = /x/;<\/script>");
	ok(XRegExp.isRegExp(iframe.contentWindow.regex), "RegExp constructed in another frame is RegExp");
	iframe.parentNode.removeChild(iframe);
});

test("XRegExp.matchChain", function () {
	var html = '<html><img src="http://x.com/img.png"><script src="http://xregexp.com/path/file.ext"><img src="http://xregexp.com/path/to/img.jpg?x"><img src="http://xregexp.com/img2.gif"/></html>';
	var xregexpImgFileNames = XRegExp.matchChain(html, [
		{regex: /<img\b([^>]+)>/i, backref: 1}, // <img> tag attributes
		{regex: XRegExp('(?ix) \\s src=" (?<src> [^"]+ )'), backref: "src"}, // src attribute values
		{regex: XRegExp("^http://xregexp\\.com(/[^#?]+)", "i"), backref: 1}, // xregexp.com paths
		/[^\/]+$/ // filenames (strip directory paths)
	]);

	deepEqual(xregexpImgFileNames, ["img.jpg", "img2.gif"], "Four-level chain with plain regex and regex/backref objects (using named and numbered backrefs)");
	deepEqual(XRegExp.matchChain("x", [/x/, /y/]), [], "Empty array returned if no matches");
	raises(function () {XRegExp.matchChain(html, []);}, Error, "Empty chain regex throws error");
});

test("RegExp.prototype.apply", function () {
	var regex = /x/;

	deepEqual(regex.apply(null, ["x"]), regex.test("x"), "Apply with match same as test");
	deepEqual(regex.apply(null, ["y"]), regex.test("y"), "Apply without match same as test");
});

test("RegExp.prototype.call", function () {
	var regex = /x/;

	deepEqual(regex.call(null, "x"), regex.test("x"), "Call with match same as test");
	deepEqual(regex.call(null, "y"), regex.test("y"), "Call without match same as test");
});

//-------------------------------------------------------------------
module("Overriden natives");
//-------------------------------------------------------------------

test("RegExp.prototype.exec", function () {
	deepEqual(/x/.exec("a"), null, "Nonmatch returns null");

	deepEqual(/a/.exec("a"), ["a"], "Match returns array");

	deepEqual(/(a)/.exec("a"), ["a", "a"], "Match returns array with backreferences");

	deepEqual(/()??/.exec("a"), ["", undefined], "Backrefernces to nonparticipating capturing groups returned as undefined");

	equal(/a/.exec("12a").index, 2, "Match array has index set to match start");

	equal(/a/.exec("12a").input, "12a", "Match array has input set to target string");

	var regex = /x/;
	regex.exec("123x567");
	equal(regex.lastIndex, 0, "Nonglobal regex lastIndex is 0 after match");

	regex.lastIndex = 1;
	regex.exec("123x567");
	equal(regex.lastIndex, 1, "Nonglobal regex lastIndex is unmodified after match");

	regex.exec("abc");
	equal(regex.lastIndex, 1, "Nonglobal regex lastIndex is unmodified after failure");

	var regexG = /x/g;
	regexG.exec("123x567");
	equal(regexG.lastIndex, 4, "Global regex lastIndex is updated after match");

	regexG.lastIndex = 4;
	equal(regexG.exec("123x567"), null, "Global regex starts match at lastIndex");

	equal(regexG.lastIndex, 0, "Global regex lastIndex reset to 0 after failure");

	var regexZeroLength = /^/g;
	regexZeroLength.exec("abc");
	equal(regexZeroLength.lastIndex, 0, "Global regex lastIndex is not incremented after zero-length match");

	regexG.lastIndex = "3";
	deepEqual(regexG.exec("123x567"), ["x"], "lastIndex converted to integer (test 1)");

	regexG.lastIndex = "4";
	deepEqual(regexG.exec("123x567"), null, "lastIndex converted to integer (test 2)");

	deepEqual(/1/.exec(1), ["1"], "Numeric argument converted to string (test 1)");

	// in `try..catch` since this throws an error in IE in XRegExp 1.5.0 (fixed in 1.5.1)
	deepEqual(function () {try {return /1()/.exec(1);} catch (err) {return err;}}(), ["1", ""], "Numeric argument converted to string (test 2)");

	deepEqual(/null/.exec(null), ["null"], "null argument converted to string");

	// This is broken in old Firefox (tested v2.0; it works in v10), but not for any fault of XRegExp.
	// Uncomment this test if future XRegExp fixes it.
	//deepEqual(/undefined/.exec(), ["undefined"], "undefined argument converted to string");

	deepEqual(/NaN/.exec(NaN), ["NaN"], "NaN argument converted to string");

	raises(function () {RegExp.prototype.exec.call("\\d", "1");}, TypeError, "TypeError thrown when context is not type RegExp");
});

test("RegExp.prototype.test", function () {
	deepEqual(/x/.test("a"), false, "Nonmatch returns false");

	deepEqual(/a/.test("a"), true, "Match returns true");

	var regex = /x/;
	regex.test("123x567");
	equal(regex.lastIndex, 0, "Nonglobal regex lastIndex is 0 after match");

	regex.lastIndex = 1;
	regex.test("123x567");
	equal(regex.lastIndex, 1, "Nonglobal regex lastIndex is unmodified after match");

	regex.test("abc");
	equal(regex.lastIndex, 1, "Nonglobal regex lastIndex is unmodified after failure");

	var regexG = /x/g;
	regexG.test("123x567");
	equal(regexG.lastIndex, 4, "Global regex lastIndex is updated after match");

	regexG.lastIndex = 4;
	equal(regexG.test("123x567"), false, "Global regex starts match at lastIndex");

	equal(regexG.lastIndex, 0, "Global regex lastIndex reset to 0 after failure");

	var regexZeroLength = /^/g;
	regexZeroLength.test("abc");
	equal(regexZeroLength.lastIndex, 0, "Global regex lastIndex is not incremented after zero-length match");

	regexG.lastIndex = "3";
	deepEqual(regexG.test("123x567"), true, "lastIndex converted to integer (test 1)");

	regexG.lastIndex = "4";
	deepEqual(regexG.test("123x567"), false, "lastIndex converted to integer (test 2)");

	deepEqual(/1/.test(1), true, "Argument converted to string");
	raises(function () {RegExp.prototype.test.call("\\d", "1");}, TypeError, "TypeError thrown when context is not type RegExp");
});

test("String.prototype.match", function () {
	deepEqual("a".match(/x/), null, "Nonglobal regex: Nonmatch returns null");

	deepEqual("a".match(/a/), ["a"], "Nonglobal regex: Match returns array");

	deepEqual("a".match(/(a)/), ["a", "a"], "Nonglobal regex: Match returns array with backreferences");

	deepEqual("a".match(/()??/), ["", undefined], "Nonglobal regex: Backrefernces to nonparticipating capturing groups returned as undefined");

	equal("12a".match(/a/).index, 2, "Nonglobal regex: Match array has index set to match start");

	equal("12a".match(/a/).input, "12a", "Nonglobal regex: Match array has input set to target string");

	var regex = /x/;
	"123x567".match(regex);
	equal(regex.lastIndex, 0, "Nonglobal regex: lastIndex is 0 after match");

	regex.lastIndex = 1;
	"123x567".match(regex);
	equal(regex.lastIndex, 1, "Nonglobal regex: lastIndex is unmodified after match");

	"abc".match(regex);
	equal(regex.lastIndex, 1, "Nonglobal regex: lastIndex is unmodified after failure");

	var regexG = /x/g;
	"123x567".match(regexG);
	equal(regexG.lastIndex, 0, "Global regex: lastIndex is 0 after match");

	regexG.lastIndex = 4;
	deepEqual("123x567".match(regexG), ["x"], "Global regex: Search starts at pos zero despite lastIndex");

	regexG.lastIndex = 4;
	"abc".match(regexG);
	equal(regexG.lastIndex, 0, "Global regex: lastIndex reset to 0 after failure");

	deepEqual("1".match("^(1)"), ["1", "1"], "Argument converted to RegExp");

	deepEqual(String.prototype.match.call(1, /1/), ["1"], "Nonstring context is converted to string");
});

test("String.prototype.replace", function () {
	equal("xaaa".replace(/a/, "b"), "xbaa", "Basic nonglobal regex search");
	equal("xaaa".replace(/a/g, "b"), "xbbb", "Basic global regex search");
	equal("xaaa".replace("a", "b"), "xbaa", "Basic string search");
	equal("xaaa".replace(/a(a)/, "$1b"), "xaba", "Backreference $1 in replacement string");
	equal("xaaa".replace(/a(a)/, "$01b"), "xaba", "Backreference $01 in replacement string");
	equal("xaaa".replace(/a(a)/, "$001b"), "x$001ba", "$001 in replacement string");
	equal("xaaa".replace(/a()()()()()()()()()(a)/, "$10b"), "xaba", "Backreference $11 in replacement string");
	equal("xaaa".replace(/a()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()(a)/, "$99b"), "xaba", "Backreference $99 in replacement string");
	equal("xaaa".replace(/a()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()()(a)/, "$100b"), "x0ba", "$100 in replacement string");
	equal("xaaa".replace(/aa/, "$&b"), "xaaba", "Backreference $& in replacement string");
	equal("xaaa".replace(/aa/, "$'b"), "xaba", "Backreference $' in replacement string");
	equal("xaaa".replace(/aa/, "$`b"), "xxba", "Backreference $` in replacement string");
	equal("xaaa".replace(/aa/, "$$b"), "x$ba", "$$ in replacement string");
	equal("xaaa".replace(/aa/, "$0b"), "x$0ba", "$0 in replacement string");
	equal("xaaa".replace(/aa/, "$1b"), "x$1ba", "$1 in replacement string for regex with no backreference");
	equal("xaaa".replace("a(a)", "$1b"), "xaaa", "Parentheses in string search 1");
	equal("xa(a)a".replace("a(a)", "$1b"), "x$1ba", "Parentheses in string search 2");
	equal("xaaa".replace("aa", "$&b"), "xaaba", "Backreference $& in replacement string for string search");
	equal("xaaa".replace("aa", "$'b"), "xaba", "Backreference $' in replacement string for string search");
	equal("xaaa".replace("aa", "$`b"), "xxba", "Backreference $` in replacement string for string search");
	equal("xaaa".replace("aa", "$$b"), "x$ba", "$$ in replacement string for string search");
	equal("xaaa".replace("aa", "$0b"), "x$0ba", "$0 in replacement string for string search");
	equal("xaaa".replace(/a/, function () {return "b";}), "xbaa", "Nonglobal regex search with basic function replacement");
	equal("xaaa".replace(/a/g, function () {return "b";}), "xbbb", "Global regex search with basic function replacement");
	equal("xaaa".replace(/aa/, function ($0) {return $0 + "b";}), "xaaba", "Regex search with function replacement, using match");
	equal("xaaa".replace(/a(a)/, function ($0, $1) {return $1 + "b";}), "xaba", "Regex search with function replacement, using backreference 1");
	equal("xaaa".replace(/a(a)/, function ($0, $1) {return "$1b";}), "x$1ba", "Regex search with function replacement, using $1 in return string");
	equal("xaaa".replace(/a/, function () {return "$&b";}), "x$&baa", "Regex search with function replacement, using $& in return string");
	equal("xaaa".replace(/a/g, function ($0, pos) {return "" + pos;}), "x123", "Regex search with function replacement, using pos in return string");
	equal("xaaa".replace(/(a)/g, function ($0, $1, pos) {return "" + pos;}), "x123", "Regex (with capturing group) search with function replacement, using pos in return string");
	equal("xaaa".replace(/a/, function ($0, pos, str) {return str;}), "xxaaaaa", "Regex search with function replacement, using source string in return string");
	equal("xaaa".replace(/(a)/, function ($0, $1, pos, str) {return str;}), "xxaaaaa", "Regex (with capturing group) search with function replacement, using source string in return string");
	equal("xaaa".replace("a", function () {return "b";}), "xbaa", "String search with basic function replacement");
	equal("xaaa".replace("a", function ($0) {return $0;}), "xaaa", "String search with function replacement, using match");

	// This is broken in Safari (tested v5.1.2/7534.52.7), but not for any fault of XRegExp.
	// Uncomment this test if future XRegExp fixes it.
	//equal("xaaa".replace("a", function () {return "$&";}), "x$&aa", "String search with function replacement, using $& in return string");

	equal("xaaa".replace("a", function ($0, pos) {return "" + pos;}), "x1aa", "String search with function replacement, using pos in return string");
	equal("xaaa".replace("a", function ($0, pos, str) {return str;}), "xxaaaaa", "String search with function replacement, using source string in return string");
	equal(String.prototype.replace.call(100, /0/g, "x"), "1xx", "Number as context");
	equal(String.prototype.replace.call(100, /(0)/g, "$1x"), "10x0x", "Number as context with backreference $1 in replacement string");
	equal(String.prototype.replace.call(100, /0/g, function ($0) {return $0 + "x";}), "10x0x", "Number as context with function replacement");
	equal(String.prototype.replace.call(100, "0", "x"), "1x0", "String search with number as context");
	equal(String.prototype.replace.call(100, "0", "$&x"), "10x0", "String search with number as context, with backreference $& in replacement string");
	equal(String.prototype.replace.call(["a","b"], /,/g, "x"), "axb", "Array as context");
	equal("10x10".replace(10, "x"), "xx10", "Number as search (converted to string)");
	equal("xaaa,ba,b".replace(["a","b"], "x"), "xaaxa,b", "Array as search (converted to string)");
	equal("xaaa".replace(/a/g, 1.1), "x1.11.11.1", "Number as replacement (converted to string)");
	equal("xaaa".replace(/a/g, ["a","b"]), "xa,ba,ba,b", "Array as replacement (converted to string)");
	equal("100".replace(/0/, function ($0, pos, str) {return typeof str;}), "1string0", "typeof last argument in replacement function is string");
	equal(new String("100").replace(/0/, function ($0, pos, str) {return typeof str;}), "1string0", "typeof last argument in replacement function is string, when called on String as context");
	equal(String.prototype.replace.call(100, /0/, function ($0, pos, str) {return typeof str;}), "1string0", "typeof last argument in replacement function is string, when called on number as context");

	// in `try..catch` since this throws an error in XRegExp 1.5.0 (fixed in 1.5.1)
	equal(function () {try {return "xaaa".replace(/a/);} catch (err) {return err;}}(), "xundefinedaa", 'Replacement string is "undefined", when not provided');

	equal("xaaa".replace(), "xaaa", "Source returned when no replacement provided");

	var regex = /x/;
	"123x567".replace(regex, "_");
	equal(regex.lastIndex, 0, "Unaltered nonglobal regex lastIndex is 0 after match");

	regex.lastIndex = 1;
	"123x567".replace(regex, "_");
	equal(regex.lastIndex, 1, "Nonglobal regex lastIndex is unmodified after match");

	"abc".replace(regex, "_");
	equal(regex.lastIndex, 1, "Nonglobal regex lastIndex is unmodified after failure");

	var regexG = /x/g;
	"123x567".replace(regexG, "_");
	equal(regexG.lastIndex, 0, "Unaltered global regex lastIndex is 0 after match");

	regexG.lastIndex = 5;
	equal("123x567".replace(regexG, "_"), "123_567", "Global regex ignores lastIndex as start position");

	regexG.lastIndex = 5;
	"123x567".replace(regexG, "_");
	equal(regexG.lastIndex, 0, "Global regex lastIndex reset to 0");

	equal("x".replace(/x/, /x/), "/x/", "Regex search with RegExp replacement");

	// TODO: Add test(s) of lastIndex from within replacement functions
});

test("String.prototype.split", function () {
	// TODO: Add tests (basic functionality tests, not the long list from
	// the cross-browser fixes module)
});

//-------------------------------------------------------------------
module("Overriden natives extensions");
//-------------------------------------------------------------------

test("RegExp.prototype.exec", function () {
	equal(XRegExp("(?<name>a)").exec("a").name, "a", "Match array has named capture properties");
});

// RegExp.prototype.test is overridden but not extended by XRegExp
//test("RegExp.prototype.test", function () {});

test("String.prototype.match", function () {
	equal("a".match(XRegExp("(?<name>a)")).name, "a", "Match array has named capture properties");
});

test("String.prototype.replace", function () {
	// TODO: Add tests
});

// String.prototype.split is overridden but not extended by XRegExp
//test("String.prototype.split", function () {});

//-------------------------------------------------------------------
module("New syntax and flags");
//-------------------------------------------------------------------

test("Named capture", function () {
	// TODO: Add tests
});

test("Inline comments", function () {
	// TODO: Add tests
});

test("Leading mode modifier", function () {
	// TODO: Add tests
});

test("s flag (dotall mode)", function () {
	// TODO: Add tests
});

test("x flag (extended mode)", function () {
	// TODO: Add tests
});

//-------------------------------------------------------------------
module("Cross-browser fixes");
//-------------------------------------------------------------------

test("Nonparticipating capture values", function () {
	// TODO: Add tests
});

test("RegExp.prototype.lastIndex", function () {
	// TODO: Add tests
});

test("String.prototype.split with regex separator", function () {
	// Some of these tests are not known to fail in any browser, but many
	// fail in at least one version of one browser

	deepEqual("".split(), [""]);
	deepEqual("".split(/./), [""]);
	deepEqual("".split(/.?/), []);
	deepEqual("".split(/.??/), []);
	deepEqual("ab".split(/a*/), ["", "b"]);
	deepEqual("ab".split(/a*?/), ["a", "b"]);
	deepEqual("ab".split(/(?:ab)/), ["", ""]);
	deepEqual("ab".split(/(?:ab)*/), ["", ""]);
	deepEqual("ab".split(/(?:ab)*?/), ["a", "b"]);
	deepEqual("test".split(""), ["t", "e", "s", "t"]);
	deepEqual("test".split(), ["test"]);
	deepEqual("111".split(1), ["", "", "", ""]);
	deepEqual("test".split(/(?:)/, 2), ["t", "e"]);
	deepEqual("test".split(/(?:)/, -1), ["t", "e", "s", "t"]);
	deepEqual("test".split(/(?:)/, undefined), ["t", "e", "s", "t"]);
	deepEqual("test".split(/(?:)/, null), []);
	deepEqual("test".split(/(?:)/, NaN), []);
	deepEqual("test".split(/(?:)/, true), ["t"]);
	deepEqual("test".split(/(?:)/, "2"), ["t", "e"]);
	deepEqual("test".split(/(?:)/, "two"), []);
	deepEqual("a".split(/-/), ["a"]);
	deepEqual("a".split(/-?/), ["a"]);
	deepEqual("a".split(/-??/), ["a"]);
	deepEqual("a".split(/a/), ["", ""]);
	deepEqual("a".split(/a?/), ["", ""]);
	deepEqual("a".split(/a??/), ["a"]);
	deepEqual("ab".split(/-/), ["ab"]);
	deepEqual("ab".split(/-?/), ["a", "b"]);
	deepEqual("ab".split(/-??/), ["a", "b"]);
	deepEqual("a-b".split(/-/), ["a", "b"]);
	deepEqual("a-b".split(/-?/), ["a", "b"]);
	deepEqual("a-b".split(/-??/), ["a", "-", "b"]);
	deepEqual("a--b".split(/-/), ["a", "", "b"]);
	deepEqual("a--b".split(/-?/), ["a", "", "b"]);
	deepEqual("a--b".split(/-??/), ["a", "-", "-", "b"]);
	deepEqual("".split(/()()/), []);
	deepEqual(".".split(/()()/), ["."]);
	deepEqual(".".split(/(.?)(.?)/), ["", ".", "", ""]);
	deepEqual(".".split(/(.??)(.??)/), ["."]);
	deepEqual(".".split(/(.)?(.)?/), ["", ".", undefined, ""]);
	deepEqual("A<B>bold</B>and<CODE>coded</CODE>".split(/<(\/)?([^<>]+)>/), ["A", undefined, "B", "bold", "/", "B", "and", undefined, "CODE", "coded", "/", "CODE", ""]);
	deepEqual("test".split(/(.?)/), ["","t","","e","","s","","t",""]);
	deepEqual("tesst".split(/(s)*/), ["t", undefined, "e", "s", "t"]);
	deepEqual("tesst".split(/(s)*?/), ["t", undefined, "e", undefined, "s", undefined, "s", undefined, "t"]);
	deepEqual("tesst".split(/(s*)/), ["t", "", "e", "ss", "t"]);
	deepEqual("tesst".split(/(s*?)/), ["t", "", "e", "", "s", "", "s", "", "t"]);
	deepEqual("tesst".split(/(?:s)*/), ["t", "e", "t"]);
	deepEqual("tesst".split(/(?=s+)/), ["te", "s", "st"]);
	deepEqual("test".split("t"), ["", "es", ""]);
	deepEqual("test".split("es"), ["t", "t"]);
	deepEqual("test".split(/t/), ["", "es", ""]);
	deepEqual("test".split(/es/), ["t", "t"]);
	deepEqual("test".split(/(t)/), ["", "t", "es", "t", ""]);
	deepEqual("test".split(/(es)/), ["t", "es", "t"]);
	deepEqual("test".split(/(t)(e)(s)(t)/), ["", "t", "e", "s", "t", ""]);
	deepEqual(".".split(/(((.((.??)))))/), ["", ".", ".", ".", "", "", ""]);
	deepEqual(".".split(/(((((.??)))))/), ["."]);
	deepEqual("a b c d".split(" ", -(Math.pow(2, 32) - 1)), ["a"]); // very large negative number test by Brian O
});

test("Regular expression syntax", function () {
	// TODO: Add tests
});

test("Replacement text syntax", function () {
	// TODO: Add tests
});

test("Type conversion", function () {
	// these are duplicated from String.prototype.replace tests in the overridden natives module
	equal(new String("100").replace(/0/, function ($0, pos, str) {return typeof str;}), "1string0", "String.prototype.replace: typeof last argument in replacement function is string, when called on String as context");
	equal(String.prototype.replace.call(100, /0/, function ($0, pos, str) {return typeof str;}), "1string0", "String.prototype.replace: typeof last argument in replacement function is string, when called on number as context");

	// TODO: Add tests
});

