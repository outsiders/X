var jison = require("jison");
var fs = require("fs");
var grammar = {
  "lex": {
    "macros": {
      "digit": "[0-9]",
			"letter": "[a-zA-Z]",
      "esc": "\\\\",
      "int": "-?(?:[0-9]|[1-9][0-9]+)",
      "exp": "(?:[eE][-+]?[0-9]+)",
      "frac": "(?:\\.[0-9]+)",
			"sp": "\\s*"
    },
    "rules": [
      ["\\#[^\\n\\r]*[\\n\\r]+", "return"],
      ["{sp}{int}{frac}?{exp}?\\b{sp}", 
			 "yytext = yytext.replace(/\\s/g, ''); return 'NUMBER';"],
      ["{sp}\"(?:{esc}[\"bfnrt/{esc}]|{esc}u[a-fA-F0-9]{4}|[^\"{esc}])*\"{sp}",
			 "yytext = yytext.replace(/^\\s*\"/, '').replace(/\"\\s*$/, ''); return 'STRING';"],
      ["{sp}\'(?:{esc}[\'bfnrt/{esc}]|{esc}u[a-fA-F0-9]{4}|[^\'{esc}])*\'{sp}",
			 "yytext = yytext.replace(/^\\s*\'/, '').replace(/\'\\s*$/, ''); return 'STRING';"],
			["{sp}\\$?{letter}({letter}|{digit})*{sp}\\:", 
			 "yytext = yytext.replace(/\\s/g, '').substr(0,yyleng-1); return 'PROPERTY'"],
			["{sp}\\$?{letter}({letter}|{digit})*{sp}", 
			 "yytext = yytext.replace(/\\s/g, '');return 'ID'"],
      ["{sp}\\.{sp}", "return '.'"],
      ["{sp}\\({sp}", "return '('"],
      ["{sp}\\){sp}", "return ')'"],
      ["{sp}\\[{sp}", "return '['"],
      ["{sp}\\]{sp}", "return ']'"],
      ["{sp}\\{{sp}", "return '{'"],
      ["{sp}\\}{sp}", "return '}'"],
      ["{sp}\\&{sp}", "return '&'"],
      ["{sp}\\|{sp}", "return '|'"],
      ["{sp}\\@{sp}", "return '@'"],
			["{sp}={sp}", "return '='"],
			["{sp}\\_{sp}", "return '_'"],
			["{sp}\\+{sp}", "return '+'"],
			["{sp}\\-{sp}", "return '-'"],
			["{sp}\\*{sp}", "return '*'"],
			["{sp}\\/{sp}", "return '/'"],
      ["{sp}\\?{sp}", "return '?'"],
      ["{sp}\\~{sp}", "return '~'"],
      ["{sp}\\`{sp}", "return '`'"],
      ["{sp}\\:{sp}", "return ':'"],
      ["{sp},{sp}", "return ','"],
      ["{sp};{sp}", "return ';'"]

    ]
  },
  "tokens": "STRING NUMBER PROPERTY ID . { } [ ] ( ) & | @ = _ + - * / ? ~ ` : , ; ",
	"operators": [
		["left", ","],
//		["left", "."],
//		["right", "RIGHTOPERATORID"],
//		["left", "LEFTOPERATORID"],
    ["right", "="],
    ["left", "*", "/"],
		["left", "+", "-"]
	],
  "start": "Artical",
  "bnf": {
		"Artical": [["Paragraph", "return $$ = ['_main', $1]"],
								["Definition", "return $$ = $1;"]
							 ],
		"Id": [[ "ID", "$$ = yytext"]],
		"Property": [[ "PROPERTY", "$$ = yytext"]],
    "Null": [[ "_", "$$ = ['_null']" ]],
    "String": [[ "STRING", "$$ = ['_string', yytext]" ]],
    "Number": [[ "NUMBER", "$$ = ['_number', Number(yytext)]" ]],
		"Paragraph": [[ "Sentence",  "if($1) $$ = ['_paragraph', [$1]]; else $$ = ['_paragraph', []];"],
									[ "Paragraph ; Sentence", "$$ = $1; if($3){$1[1].push($3);}"],
									[ "Paragraph ;", "$$ = $1;"]
								 ],
		"Sentence": [["Units", "$$ = $1;"],
								 ["Assign", "$$ = $1;"],
								 ["Internal", "$$ = $1"]
								],
		"Internal": [[ "` Id `", "yy.setlang($2); $$ = undefined"]],
		"Units": [["Unit", "$$ = ['_sentence', {config:{},content: [$1]}];"],
							["Units Unit", "$$ = $1; $1[1].content.push($2)"],
							["PropertyUnit", "var tmp = {}; tmp[$1[0]] = $1[1];$$ = ['_sentence', {config: tmp, content: []}];"],
							["Units PropertyUnit", "$$ = $1; $1[1].config[$2[0]] = $2[1]"]
						 ],
		"Assign": [["Assignable = Units", "$$ = ['_assign', [$1, $3]];"],
							 ["Array = Units", "$$ = ['_assign', [$1, $3]];"],
							 ["Assignable = Definition", "$$ = ['_assign', [$1, $3]]"]
							],
		"Unit": [["Value", "$$ = $1"],
						 ["Assignable", "$$ = $1"],
						 ["Operation", "$$ = $1;"],
						 ["( Units )", "$$ = $2;"],
						 ["{ Paragraph }", "$$ = $2;"]
						],
		"FunctionBlock": [["Units", "var c = $1[1].content; if(c.length == 1 && c[0][0] == '_paragraph') $$ = c[0]; else $$ = ['_paragraph', [$1]];"],
											["", "$$ = []"]
										 ],
		"Value": [["Null", "$$ = $1"], 
							["String", "$$ = $1"],
							["Number", "$$ = $1"]
						 ],
		"PropertyUnit": [["Property Unit", "$$ = [$1, $2]"]],
		"Assignable": [["Id", "$$ = ['_access', [$1]]"], 
									 ["( Units ) . Id", "$$ = ['_access', [$2, $5]]"],
									 ["Assignable . Id", "$$ = ['_access', [$1, $3]]"],
									 ["Assignable . [ Units ]", "$$ = ['_access', [$1, $4]]"]
									],
		"Array": [[" Unit , Unit", "$$ = ['_array', [$1, $3]]"],
							[" Array , Unit",  "$$ = $1; $1[1].push($3)"]
						 ],
		"Call": [["& BasicUnit ", "$$ = ['_call', $2];"]],
		"Definition": [["Dependencies ReturnStatement Arguments FunctionBlock", "$$ = ['_definiton', {deps: $1, return: $2, args: $3, content: $4}]"],
									 ["Dependencies Arguments FunctionBlock", "$$ = ['_definiton', {deps: $1, args: $2, content: $3}]"],
									 ["ReturnStatement Arguments FunctionBlock", "$$ = ['_definiton', {deps: {function: 1}, return: $1, args: $2, content: $3}]"],
									 ["Dependencies ReturnStatement FunctionBlock", "$$ = ['_definiton', {deps: $1, return: $2, args: {}, content: $3}]"],
									 ["Arguments FunctionBlock", "$$ = ['_definiton', {deps: {function: 1}, args: $1, content: $2}]"],
									 ["Dependencies FunctionBlock", "$$ = ['_definiton', {deps: $1, args: {}, content: $2}]"],
									 ["ReturnStatement FunctionBlock", "$$ = ['_definiton', {deps: {function:1}, return: $1, args: {}, content: $2}]"]
									],
		"ReturnStatement": [["~ Id", "$$ = $2;"]],
		"Dependencies": [[": DependencyArray", "$$ = $2;"]],
		"DependencyArray": [["Id", "$$ = {}; $$[$1] = 1"],
												["DependencyArray , Id", "$$ = $1; $1[$3] = 1"]
											 ],
		"Arguments": [["@ ArgumentArray", "$$=$2;"],
									["@ Null", "$$ = {}"]
								 ],
		"ArgumentElement": [["Id", "$$ = [$1, {}]"],
												["Property Id", "$$ = [$1, {type: $2}]"],
												["Property *", "$$ = [$1, {etc: 1}]"],
												["Id ? BasicUnit", "$$ = [$1, {default: $3}]"],
												["Property Id ? BasicUnit", "$$ = [$1, {type: $2, default: $4}]"]
												],
		"ArgumentArray": [["ArgumentElement", "$$={}; $$[$1[0]] = $1[1];"],
											["ArgumentArray , ArgumentElement", "$$=$1; $$[$3[0]] = $3[1]"]
											],
		"Operation": [[ "Unit + Unit", "$$ = ['_add', [$1, $3]]"]
								 ]
  }
};
var options = {};
var code = new jison.Generator(grammar, options).generate();
fs.writeFileSync(__dirname + '/parser.js', code);

