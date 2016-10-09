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
      ["{sp},{sp}", "return ','"],
      ["{sp};{sp}", "return ';'"]

    ]
  },
  "tokens": "STRING NUMBER PROPERTY ID . { } [ ] ( ) & = + - * / , : ~ ? ` _",
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
		"Artical": [["Paragraph", "return $$ = ['_main', $1]"]],
		"Id": [[ "ID", "$$ = yytext"]],
		"Property": [[ "PROPERTY", "$$ = yytext"]],
    "Null": [[ "_", "$$ = ['_null']" ]],
    "String": [[ "STRING", "$$ = ['_string', yytext]" ]],
    "Number": [[ "NUMBER", "$$ = ['_number', Number(yytext)]" ]],
		"Paragraph": [[ "Sentence",  "if($1) $$ = [$1]; else $$ = [];"],
									[ "Paragraph ; Sentence", "$$ = $1; if($3){$1.push($3);}"],
									[ "Paragraph ;", "$$ = $1;"]
								 ],
		"Sentence": [["BasicSentence", "$$ = $1;"],
								 ["AssignSentence", "$$ = $1;"],
								 ["Internal", "$$ = $1"]
								],
		"Internal": [[ "` Id `", "yy.scope._lang = $2; $$ = undefined"]],
		"BasicSentence": [["Unit", "$$ = ['_sentence', [$1]];"],
											["BasicSentence Unit", "$$ = $1; $1[1].push($2)"]
										 ],
		"AssignSentence": [["Assignable = BasicSentence", "$$ = ['_assign', [$1, $3]];"],
											 ["Array = BasicSentence", "$$ = ['_assign', [$1, $3]];"]
											],
		"Unit": [["BasicUnit", "$$= $1"],
						 ["PropertyUnit", "$$ = $1"],
						 ["Arguments", "$$ = $1"],
						 ["Operation", "$$ = $1;"],
						 ["Array", "$$ = $1"]
						],
		"BasicUnit": [["Value", "$$ = $1"],
									["ParentheseUnit", "$$ = $1"],
									[ "{ Paragraph }", "$$ = ['_paragraph', $2];"],
									["Assignable", "$$ = $1"],
									["Call", "$$ = [$1]"]
								 ],
		"PropertyUnit": [["Property BasicUnit", "$$ = ['_property', [$1, $2]]"],
										 ["Property Array", "$$ = ['_property', [$1, $2]]"]],
		"ParentheseUnit": [["( Sentence )", "$$ = ['_normalize', $2]"]
											],
		"Value": [["Null", "$$ = $1"], 
							["String", "$$ = $1"],
							["Number", "$$ = $1"]
						 ],		
		"Assignable": [["Id", "$$ = ['_id', $1]"], 
									 ["Id . Id", "$$ = ['_access', [$1, $3]]"],
									 ["Id [ BasicUnit ]", "$$ = ['_access', [$1, $3]]"],
									 ["ParentheseUnit . Id", "$$ = ['_access', [$1, $3]]"],
									 ["ParentheseUnit [ BasicUnit ]", "$$ = ['_access', [$1, $3]]"]
									],
		"Array": [[" BasicUnit , BasicUnit", "$$ = ['_array', [$1, $3]]"],
							[" Array , BasicUnit",  "$$ = $1; $1[1].push($3)"]
						 ],
		"Call": [["& BasicUnit ", "$$ = ['_call', $2];"]],
		"Arguments": [["@ ArgumentsArray", "$$ = ['_arguments', $2]"],
									["@ Null", "$$ = ['_arguments', {}]"],
									["Arguments ~ Id", "$$ = $1; $$[1]['_return'] = $3;"]
								 ],
		"ArgumentsElement": [["Id", "$$ = [$1, {}]"],
												 ["Property Id", "$$ = [$1, {type: $2}]"],
												 ["Property *", "$$ = [$1, {etc: 1}]"],
												 ["Id ? BasicUnit", "$$ = [$1, {default: $3}]"],
												 ["Property Id ? BasicUnit", "$$ = [$1, {type: $2, default: $4}]"]
												],
		"ArgumentsArray": [["ArgumentsElement", "$$={}; $$[$1[0]] = $1[1];"],
											 ["ArgumentsArray , ArgumentsElement", "$$=$1; $$[$3[0]] = $3[1]"]
											],
		"Operation": [[ "BasicUnit + BasicUnit", "$$ = ['_add', [$1, $3]]"]
								 ]
  }
};
var options = {};
var code = new jison.Generator(grammar, options).generate();
fs.writeFileSync(__dirname + '/parser.js', code);

