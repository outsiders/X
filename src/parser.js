/* parser generated by jison 0.4.17 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,24],$V1=[1,29],$V2=[1,30],$V3=[1,31],$V4=[1,32],$V5=[1,4],$V6=[1,18],$V7=[1,19],$V8=[1,23],$V9=[1,28],$Va=[1,21],$Vb=[1,22],$Vc=[1,33],$Vd=[1,16,18],$Ve=[1,6,8,10,12,14,16,18,31,32,34,40,41,43],$Vf=[2,23],$Vg=[2,21],$Vh=[1,40],$Vi=[1,42],$Vj=[1,6,8,10,12,14,16,18,23,31,32,34,35,38,39,40,41,43,47],$Vk=[1,47],$Vl=[1,6,8,10,12,14,16,18,31,32,34,39,40,41,43],$Vm=[1,73],$Vn=[1,6,8,10,12,14,16,18,23,31,32,34,39,40,41,43],$Vo=[1,6,8,10,12,14,16,18,31,32,34,35,40,41,43];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"Artical":3,"Paragraph":4,"Id":5,"ID":6,"Property":7,"PROPERTY":8,"Null":9,"_":10,"String":11,"STRING":12,"Number":13,"NUMBER":14,"Sentence":15,";":16,"{":17,"}":18,"BasicSentence":19,"AssignSentence":20,"Unit":21,"Assignable":22,"=":23,"Array":24,"BasicUnit":25,"PropertyUnit":26,"Arguments":27,"Operation":28,"Value":29,"Call":30,"ParenthesetUnit":31,"`":32,"ParentheseUnit":33,"(":34,")":35,".":36,"[":37,"]":38,",":39,"&":40,"@":41,"ArgumentsArray":42,"~":43,"ArgumentsElement":44,"*":45,"?":46,"+":47,"$accept":0,"$end":1},
terminals_: {2:"error",6:"ID",8:"PROPERTY",10:"_",12:"STRING",14:"NUMBER",16:";",17:"{",18:"}",23:"=",31:"ParenthesetUnit",32:"`",34:"(",35:")",36:".",37:"[",38:"]",39:",",40:"&",41:"@",43:"~",45:"*",46:"?",47:"+"},
productions_: [0,[3,1],[5,1],[7,1],[9,1],[11,1],[13,1],[4,1],[4,3],[4,2],[4,3],[15,1],[15,1],[19,1],[19,2],[20,3],[20,3],[21,1],[21,1],[21,1],[21,1],[21,1],[25,1],[25,1],[25,1],[25,1],[25,3],[26,2],[33,3],[29,1],[29,1],[29,1],[22,1],[22,3],[22,4],[24,3],[24,3],[30,2],[27,2],[27,2],[27,2],[44,1],[44,2],[44,2],[44,3],[44,4],[42,1],[42,3],[28,3],[28,3]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
return this.$ = ['_main', $$[$0]]
break;
case 2: case 3:
this.$ = yytext
break;
case 4:
this.$ = ['_null']
break;
case 5:
this.$ = ['_string', yytext]
break;
case 6:
this.$ = ['_number', Number(yytext)]
break;
case 7:
this.$ = [$$[$0]];
break;
case 8:
this.$ = $$[$0-2]; $$[$0-2].push($$[$0]);
break;
case 9: case 10:
this.$ = $$[$0-1];
break;
case 11: case 12: case 20:
this.$ = $$[$0];
break;
case 13:
this.$ = ['_sentence', [$$[$0]]];
break;
case 14:
this.$ = $$[$0-1]; $$[$0-1][1].push($$[$0])
break;
case 15: case 16:
this.$ = ['_assign', [$$[$0-2], $$[$0]]];
break;
case 17:
this.$= $$[$0]
break;
case 18: case 19: case 21: case 22: case 23: case 25: case 29: case 30: case 31:
this.$ = $$[$0]
break;
case 24:
this.$ = [$$[$0]]
break;
case 26:
var tmp = {};tmp[$$[$0-1][0]]=$$[$0-1][1];this.$ = ['_raw', tmp];
break;
case 27:
this.$ = ['_property', [$$[$0-1], $$[$0]]]
break;
case 28: case 48:
this.$ = $$[$0-1]
break;
case 32:
this.$ = ['_id', $$[$0]]
break;
case 33:
this.$ = ['_get', [$$[$0-2], $$[$0]]]
break;
case 34:
this.$ = ['_get', [$$[$0-3], $$[$0-1]]]
break;
case 35:
this.$ = ['_array', [$$[$0-2], $$[$0]]]
break;
case 36:
this.$ = $$[$0-2]; $$[$0-2][1].push($$[$0])
break;
case 37:
this.$ = ['_call', $$[$0]];
break;
case 38:
this.$ = ['_arguments', $$[$0]]
break;
case 39:
this.$ = ['_arguments', {}]
break;
case 40:
this.$ = ['_return', $$[$0]]
break;
case 41:
this.$ = [$$[$0], {}]
break;
case 42:
this.$ = [$$[$0-1], {type: $$[$0]}]
break;
case 43:
this.$ = [$$[$0-1], {etc: 1}]
break;
case 44:
this.$ = [$$[$0-2], {default: $$[$0]}]
break;
case 45:
this.$ = [$$[$0-3], {type: $$[$0-2], default: $$[$0]}]
break;
case 46:
this.$={}; this.$[$$[$0][0]] = $$[$0][1];
break;
case 47:
this.$=$$[$0-2]; this.$[$$[$0][0]] = $$[$0][1]
break;
case 49:
this.$ = ['_add', [$$[$0-2], $$[$0]]]
break;
}
},
table: [{3:1,4:2,5:14,6:$V0,7:20,8:$V1,9:25,10:$V2,11:26,12:$V3,13:27,14:$V4,15:3,17:$V5,19:5,20:6,21:7,22:8,24:9,25:10,26:11,27:12,28:13,29:16,30:17,31:$V6,32:$V7,33:15,34:$V8,40:$V9,41:$Va,43:$Vb},{1:[3]},{1:[2,1],16:$Vc},o($Vd,[2,7]),{4:34,5:14,6:$V0,7:20,8:$V1,9:25,10:$V2,11:26,12:$V3,13:27,14:$V4,15:3,17:$V5,19:5,20:6,21:7,22:8,24:9,25:10,26:11,27:12,28:13,29:16,30:17,31:$V6,32:$V7,33:15,34:$V8,40:$V9,41:$Va,43:$Vb},o($Vd,[2,11],{25:10,26:11,27:12,28:13,5:14,33:15,29:16,30:17,7:20,9:25,11:26,13:27,21:35,24:36,22:37,6:$V0,8:$V1,10:$V2,12:$V3,14:$V4,31:$V6,32:$V7,34:$V8,40:$V9,41:$Va,43:$Vb}),o($Vd,[2,12]),o($Ve,[2,13]),o([1,6,8,10,12,14,16,18,31,32,34,39,40,41,43,47],$Vf,{23:[1,38]}),o($Ve,$Vg,{23:[1,39],39:$Vh}),o($Ve,[2,17],{39:[1,41],47:$Vi}),o($Ve,[2,18]),o($Ve,[2,19]),o($Ve,[2,20]),o($Vj,[2,32]),{36:[1,43],37:[1,44]},o($Vj,[2,22]),o($Vj,[2,24]),o($Vj,[2,25]),{5:14,6:$V0,7:20,8:$V1,9:25,10:$V2,11:26,12:$V3,13:27,14:$V4,21:45,22:37,24:36,25:10,26:11,27:12,28:13,29:16,30:17,31:$V6,32:$V7,33:15,34:$V8,40:$V9,41:$Va,43:$Vb},{5:14,6:$V0,9:25,10:$V2,11:26,12:$V3,13:27,14:$V4,22:37,25:46,29:16,30:17,31:$V6,32:$V7,33:15,34:$Vk,40:$V9},{5:51,6:$V0,7:52,8:$V1,9:49,10:$V2,42:48,44:50},{5:53,6:$V0},{5:14,6:$V0,9:25,10:$V2,11:26,12:$V3,13:27,14:$V4,22:37,25:55,28:54,29:16,30:17,31:$V6,32:$V7,33:15,34:$V8,40:$V9},o([1,6,8,10,12,14,16,18,23,31,32,34,35,38,39,40,41,43,46,47],[2,2]),o($Vj,[2,29]),o($Vj,[2,30]),o($Vj,[2,31]),{5:14,6:$V0,9:25,10:$V2,11:26,12:$V3,13:27,14:$V4,22:37,25:56,29:16,30:17,31:$V6,32:$V7,33:15,34:$Vk,40:$V9},o([6,10,12,14,31,32,34,40,45],[2,3]),o($Vj,[2,4]),o($Vj,[2,5]),o($Vj,[2,6]),o($Vd,[2,9],{19:5,20:6,21:7,22:8,24:9,25:10,26:11,27:12,28:13,5:14,33:15,29:16,30:17,7:20,9:25,11:26,13:27,15:57,6:$V0,8:$V1,10:$V2,12:$V3,14:$V4,31:$V6,32:$V7,34:$V8,40:$V9,41:$Va,43:$Vb}),{16:$Vc,18:[1,58]},o($Ve,[2,14]),o($Ve,$Vg,{39:$Vh}),o($Vj,$Vf),{5:14,6:$V0,7:20,8:$V1,9:25,10:$V2,11:26,12:$V3,13:27,14:$V4,19:59,21:7,22:37,24:36,25:10,26:11,27:12,28:13,29:16,30:17,31:$V6,32:$V7,33:15,34:$V8,40:$V9,41:$Va,43:$Vb},{5:14,6:$V0,7:20,8:$V1,9:25,10:$V2,11:26,12:$V3,13:27,14:$V4,19:60,21:7,22:37,24:36,25:10,26:11,27:12,28:13,29:16,30:17,31:$V6,32:$V7,33:15,34:$V8,40:$V9,41:$Va,43:$Vb},{5:14,6:$V0,9:25,10:$V2,11:26,12:$V3,13:27,14:$V4,22:37,25:61,29:16,30:17,31:$V6,32:$V7,33:15,34:$Vk,40:$V9},{5:14,6:$V0,9:25,10:$V2,11:26,12:$V3,13:27,14:$V4,22:37,25:62,29:16,30:17,31:$V6,32:$V7,33:15,34:$Vk,40:$V9},{5:14,6:$V0,9:25,10:$V2,11:26,12:$V3,13:27,14:$V4,22:37,25:63,29:16,30:17,31:$V6,32:$V7,33:15,34:$Vk,40:$V9},{5:64,6:$V0},{5:14,6:$V0,9:25,10:$V2,11:26,12:$V3,13:27,14:$V4,22:37,25:65,29:16,30:17,31:$V6,32:$V7,33:15,34:$Vk,40:$V9},{32:[1,66]},o($Ve,[2,27]),{5:14,6:$V0,9:25,10:$V2,11:26,12:$V3,13:27,14:$V4,22:37,25:67,29:16,30:17,31:$V6,32:$V7,33:15,34:$Vk,40:$V9},o($Ve,[2,38],{39:[1,68]}),o($Ve,[2,39]),o($Vl,[2,46]),o($Vl,[2,41],{46:[1,69]}),{5:70,6:$V0,45:[1,71]},o($Ve,[2,40]),{35:[1,72]},{35:$Vm,47:$Vi},o($Vj,[2,37]),o($Vd,[2,8]),o($Vd,[2,10]),o($Vd,[2,15],{25:10,26:11,27:12,28:13,5:14,33:15,29:16,30:17,7:20,9:25,11:26,13:27,21:35,24:36,22:37,6:$V0,8:$V1,10:$V2,12:$V3,14:$V4,31:$V6,32:$V7,34:$V8,40:$V9,41:$Va,43:$Vb}),o($Vd,[2,16],{25:10,26:11,27:12,28:13,5:14,33:15,29:16,30:17,7:20,9:25,11:26,13:27,21:35,24:36,22:37,6:$V0,8:$V1,10:$V2,12:$V3,14:$V4,31:$V6,32:$V7,34:$V8,40:$V9,41:$Va,43:$Vb}),o($Vn,[2,36]),o($Vn,[2,35]),o($Vo,[2,49]),o($Vj,[2,33]),{38:[1,74]},o($Vj,[2,26]),{35:$Vm},{5:51,6:$V0,7:52,8:$V1,44:75},{5:14,6:$V0,9:25,10:$V2,11:26,12:$V3,13:27,14:$V4,22:37,25:76,29:16,30:17,31:$V6,32:$V7,33:15,34:$Vk,40:$V9},o($Vl,[2,42],{46:[1,77]}),o($Vl,[2,43]),o($Vo,[2,48]),o([36,37],[2,28]),o($Vj,[2,34]),o($Vl,[2,47]),o($Vl,[2,44]),{5:14,6:$V0,9:25,10:$V2,11:26,12:$V3,13:27,14:$V4,22:37,25:78,29:16,30:17,31:$V6,32:$V7,33:15,34:$Vk,40:$V9},o($Vl,[2,45])],
defaultActions: {},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        var lex = function () {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        };
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return
break;
case 1:yy_.yytext = yy_.yytext.replace(/\s/g, ''); return 14;
break;
case 2:yy_.yytext = yy_.yytext.replace(/^\s*"/, '').replace(/"\s*$/, ''); return 12;
break;
case 3:yy_.yytext = yy_.yytext.replace(/^\s*'/, '').replace(/'\s*$/, ''); return 12;
break;
case 4:yy_.yytext = yy_.yytext.replace(/\s/g, '').substr(0,yy_.yyleng-1); return 8
break;
case 5:yy_.yytext = yy_.yytext.replace(/\s/g, '');return 6
break;
case 6:return 36
break;
case 7:return 34
break;
case 8:return 35
break;
case 9:return 37
break;
case 10:return 38
break;
case 11:return 17
break;
case 12:return 18
break;
case 13:return 40
break;
case 14:return '|'
break;
case 15:return 41
break;
case 16:return 23
break;
case 17:return 10
break;
case 18:return 47
break;
case 19:return '-'
break;
case 20:return 45
break;
case 21:return '/'
break;
case 22:return 46
break;
case 23:return 43
break;
case 24:return 32
break;
case 25:return 39
break;
case 26:return 16
break;
}
},
rules: [/^(?:\#[^\n\r]*[\n\r]+)/,/^(?:(\s*)(-?(?:[0-9]|[1-9][0-9]+))((?:\.[0-9]+))?((?:[eE][-+]?[0-9]+))?\b(\s*))/,/^(?:(\s*)"(?:(\\)["bfnrt/(\\)]|(\\)u[a-fA-F0-9]{4}|[^"(\\)])*"(\s*))/,/^(?:(\s*)'(?:(\\)['bfnrt/(\\)]|(\\)u[a-fA-F0-9]{4}|[^'(\\)])*'(\s*))/,/^(?:(\s*)\$?([a-zA-Z])(([a-zA-Z])|([0-9]))*(\s*)\:)/,/^(?:(\s*)\$?([a-zA-Z])(([a-zA-Z])|([0-9]))*(\s*))/,/^(?:(\s*)\.(\s*))/,/^(?:(\s*)\((\s*))/,/^(?:(\s*)\)(\s*))/,/^(?:(\s*)\[(\s*))/,/^(?:(\s*)\](\s*))/,/^(?:(\s*)\{(\s*))/,/^(?:(\s*)\}(\s*))/,/^(?:(\s*)\&(\s*))/,/^(?:(\s*)\|(\s*))/,/^(?:(\s*)\@(\s*))/,/^(?:(\s*)=(\s*))/,/^(?:(\s*)\_(\s*))/,/^(?:(\s*)\+(\s*))/,/^(?:(\s*)\-(\s*))/,/^(?:(\s*)\*(\s*))/,/^(?:(\s*)\/(\s*))/,/^(?:(\s*)\?(\s*))/,/^(?:(\s*)\~(\s*))/,/^(?:(\s*)\`(\s*))/,/^(?:(\s*),(\s*))/,/^(?:(\s*);(\s*))/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}