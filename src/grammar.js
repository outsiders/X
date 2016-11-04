var jison = require("jison");
var fs = require("fs");
var grammar = {
  "lex": {
    "macros": {
      "digit": "[0-9]",
			"letter": "[a-zA-Z_]",
      "esc": "\\\\",
      "int": "-?(?:[0-9]|[1-9][0-9]+)",
      "exp": "(?:[eE][-+]?[0-9]+)",
      "frac": "(?:\\.[0-9]+)",
			"sp": "\\s*"
    },
    "rules": [
      ["\\#[^\\n\\r]*[\\n\\r]+", "return"],
			["for", "return 'FOR'"],
			["if", "return 'IF'"],
			["else", "return 'ELSE'"],
      ["{sp}{int}{frac}?{exp}?\\b{sp}", 
			 "yytext = yytext.replace(/\\s/g, ''); return 'NUMBER';"],
      ["{sp}\"(?:{esc}[\"bfnrt/{esc}]|{esc}u[a-fA-F0-9]{4}|[^\"{esc}])*\"{sp}",
			 "yytext = yytext.replace(/^\\s*\"/, '').replace(/\"\\s*$/, ''); return 'STRING';"],
      ["{sp}\'(?:{esc}[\'bfnrt/{esc}]|{esc}u[a-fA-F0-9]{4}|[^\'{esc}])*\'{sp}",
			 "yytext = yytext.replace(/^\\s*\'/, '').replace(/\'\\s*$/, ''); return 'STRING';"],
			["{sp}\\$?{letter}({letter}|{digit})*{sp}\\:", 
			 "yytext = yytext.replace(/^\\s*/, '').replace(/\\s*\:$/g, ''); return 'PROPERTY'"],
			["{sp}\\$?{letter}({letter}|{digit})*{sp}", 
			 "yytext = yytext.replace(/\\s/g, '');return 'ID'"],
			["{sp}\\&\\&{sp}", "return '&&'"],
			["{sp}\\|\\|{sp}", "return '||'"],
      ["{sp}>={sp}", "return '>='"],
      ["{sp}<={sp}", "return '<='"],
			["{sp}=={sp}", "return '=='"],
			["{sp}\\!={sp}", "return '!='"],
      ["{sp}\\!{sp}", "return '!'"],
			["{sp}\\+={sp}", "return '+='"],
			["{sp}\\-={sp}", "return '-='"],
			["{sp}\\*={sp}", "return '*='"],
			["{sp}\\/={sp}", "return '/='"],
      ["{sp}->{sp}", "return '->'"],
      ["{sp}=>{sp}", "return '=>'"],
      ["{sp}\\&{sp}", "return '&'"],
      ["{sp}\\|{sp}", "return '|'"],
      ["{sp}\\@{sp}", "return '@'"],
			["{sp}\\_{sp}", "return '_'"],
      ["{sp}\\.{sp}", "return '.'"],
      ["{sp}\\({sp}", "return '('"],
      ["{sp}\\){sp}", "return ')'"],
      ["{sp}\\[{sp}", "return '['"],
      ["{sp}\\]{sp}", "return ']'"],
      ["{sp}\\{{sp}", "return '{'"],
      ["{sp}\\}{sp}", "return '}'"],
			["{sp}\\+{sp}", "return '+'"],
			["{sp}\\-{sp}", "return '-'"],
			["{sp}\\*{sp}", "return '*'"],
			["{sp}\\/{sp}", "return '/'"],
      ["{sp}>{sp}", "return '>'"],
      ["{sp}<{sp}", "return '<'"],
			["{sp}={sp}", "return '='"],
      ["{sp}\\?{sp}", "return '?'"],
      ["{sp}\\%{sp}", "return '%'"],
      ["{sp}\\~{sp}", "return '~'"],
      ["{sp}\\`{sp}", "return '`'"],
      ["{sp}\\:{sp}", "return ':'"],
      ["{sp},{sp}", "return ','"],
      ["{sp};{sp}", "return ';'"]
    ]
  },
  "tokens": "FOR IF ELSE STRING NUMBER PROPERTY ID . { } [ ] ( ) & | && || @ = _ + - * / > < != == >= <= += -= *= /= ? ! % ~ ` : , ; -> =>",
	"operators": [
		["left", ","],
    ["right", "=", "+=", "-=", "*=", "/="],
		["left", "||"],
		["left", "&&"],
		["left", "!=", "=="],
		["left", "<", ">", "<=", ">="],
		["left", "+", "-"],
    ["left", "*", "/", "%"],
		["right", "!"]
	],
  "start": "Artical",
  "bnf": {
		"Artical": [["Paragraph", "return $$ = ['_main', $1]"],
								["Definition", "return $$ = $1;"],
								["Internal", "return $$ = ['_main', []];"],
								["Internal Paragraph", "return $$ = ['_main', $2];"]
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
								 ["For", "$$ = $1;"],
								 ["If", "$$ = $1;"]
								],
		"For": [["FOR ( Sentence ; Sentence ; Sentence ) FunctionBlock", "$$ = ['_for', {start: $3, end: $5, inc: $7, content: $9}]"],
						["FOR Assignable ArrayUnit FunctionBlock", "$$ = ['_foreach', {array: $3, element: $2, content: $4}]"],
						["FOR Assignable , Assignable ArrayUnit FunctionBlock", "$$ = ['_foreach', {array: $5, element: $2, index: $4, content: $6}]"]
					 ],
		"If": [["IF Unit FunctionBlock", "$$=['_if', {condition:$2, content:$3}]"],
					 ["IF Unit FunctionBlock ELSE FunctionBlock", "$$=['_if',{condition: $2, content: $3, else: $5}]"]
					],
		"Internal": [[ "` Paragraph `", "yy.eval($2[1]); $$ = undefined"]],
		"Units": [["PreUnits", "$$ = $1"],
							["PreUnits ContentDefinition", "$$ = $1; $1[1].content.push($2)"]
						 ],
		"PreUnits": [["Unit", "$$ = ['_sentence', {config:{},content: [$1]}];"],
								 ["PreUnits Unit", "$$ = $1; $1[1].content.push($2)"],
								 ["PropertyUnit", "$$ = ['_sentence', {config: {}, content: []}]; $$[1].config[$1[0]] = $1[1];"],
								 ["PreUnits PropertyUnit", "$$ = $1; $1[1].config[$2[0]] = $2[1]"]
								],
		"Assign": [["Assignable = Units", "$$ = ['_assign', [$1, $3]];"],
							 ["Assignable = Array", "$$ = ['_assign', [$1, $3]];"],
							 ["Array = Units", "$$ = ['_assign', [$1, $3]];"],
							 ["Array = Array", "$$ = ['_assign', [$1, $3]];"],
							 ["Assignable = Definition", "$$ = ['_assign', [$1, $3]]"],
							 ["Assignable += Units", "$$ = ['_assign', [$1, ['_op', ['add', $1, $3]]]];"]
							],
		"Unit": [["Value", "$$ = $1"],
						 ["Assignable", "$$ = $1"],
						 ["Operation", "$$ = $1;"],
						 ["( Units )", "$$ = $2;"],
						 ["( Definition )", "$$ = $2;"],
						 ["{ Paragraph }", "$$ = $2;"]
						],
		"FunctionBlock": [["Units", "var c = $1[1].content; if(c.length == 1 && c[0][0] == '_paragraph'){ $$ = c[0]; }else{ $$ = ['_paragraph', [$1]]; }"]],
		"Value": [["Null", "$$ = $1"], 
							["String", "$$ = $1"],
							["Number", "$$ = $1"]
						 ],
		"PropertyUnit": [["Property Unit", "$$ = [$1, $2]"],
										 ["String : Unit", "$$ = [$1, $3]"]
										],
		"Assignable": [["Id", "$$ = ['_access', [$1]]"], 
									 ["( Units ) . Id", "$$ = ['_access', [$2, $5]]"],
									 ["Assignable . Id", "$$ = ['_access', [$1, $3]]"],
									 ["Assignable [ Units ]", "$$ = ['_access', [$1, $3]]"]
									],
		"ArrayUnit": [["Unit", "$$ = $1"],
									["Array", "$$ = $1"]
								 ],
		"Array": [[" Unit , Unit", "$$ = ['_array', [$1, $3]]"],
							[" Array , Unit",  "$$ = $1; $1[1].push($3)"]
						 ],
		"Definition": [["EmptyDefinition", "$$=$1;$1[1].content = []"],
									 ["ContentDefinition", "$$=$1"]
									],
		"ContentDefinition": [["EmptyDefinition FunctionBlock", "$$= $1;$1[1].content = $2;"]
												 ],
		"EmptyDefinition": [["Dependencies ReturnStatement Arguments", "$$ = ['_definiton', {deps: $1, return: $2, args: $3}]"],
												["Dependencies Arguments", "$$ = ['_definiton', {deps: $1, args: $2}]"],
												["ReturnStatement Arguments", "$$ = ['_definiton', {deps: {function: 1}, return: $1, args: $2}]"],
												["Dependencies ReturnStatement", "$$ = ['_definiton', {deps: $1, return: $2, args: {}}]"],
												["Arguments", "$$ = ['_definiton', {deps: {function: 1}, args: $1}]"],
												["Dependencies", "$$ = ['_definiton', {deps: $1, args: {}}]"],
												["ReturnStatement", "$$ = ['_definiton', {deps: {function:1}, return: $1, args: {}}]"]
											 ],
		"ReturnStatement": [["~ Id", "$$ = $2;"]],
		"Dependencies": [["& DependencyArray", "$$ = $2;"]],
		"DependencyArray": [["Id", "$$ = {}; $$[$1] = 1"],
												["DependencyArray , Id", "$$ = $1; $1[$3] = 1"]
											 ],
		"Arguments": [["@ ArgumentArray", "$$=$2;"],
									["@ Null", "$$ = {}"]
								 ],
		"ArgumentElement": [["Id", "$$ = [$1, {}]"],
												["Property Id", "$$ = [$1, {type: $2}]"],
												["Property *", "$$ = [$1, {etc: 1}]"],
												["Property ? Unit", "$$ = [$1, {default: $3}]"],
												["Property Id ? Unit", "$$ = [$1, {type: $2, default: $4}]"],
												["Id => Unit", "$$ = [$1, {default: $3, static: 1}]"]
												],
		"ArgumentArray": [["ArgumentElement", "$$={}; $$[$1[0]] = $1[1];"],
											["ArgumentArray , ArgumentElement", "$$=$1; $$[$3[0]] = $3[1]"]
											],
		"Operation": [["Unit + Unit", "$$ = ['_op', ['add', $1, $3]]"],
									["Unit < Unit", "$$ = ['_op', ['lt', $1, $3]]"],
									["Unit > Unit", "$$ = ['_op', ['gt', $1, $3]]"],
									["Unit == Unit", "$$ = ['_op', ['eq', $1, $3]]"],
									["Unit >= Unit", "$$ = ['_op', ['ge', $1, $3]]"],
									["Unit <= Unit", "$$ = ['_op', ['le', $1, $3]]"],
									["Unit && Unit", "$$ = ['_op', ['and', $1, $3]]"],
									["Unit || Unit", "$$ = ['_op', ['or', $1, $3]]"]

								 ]
  }
};
var options = {};
var code = new jison.Generator(grammar, options).generate();
fs.writeFileSync(__dirname + '/parser.js', code);

