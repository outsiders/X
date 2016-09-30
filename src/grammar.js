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
  "tokens": "STRING NUMBER PROPERTY ID . { } [ ] ( ) & = + - * / , : ~ ? `",
	"operators": [
		["left", ","],
		["left", "."],
//		["right", "RIGHTOPERATORID"],
//		["left", "LEFTOPERATORID"],
    ["right", "="],
    ["left", "*", "/"],
		["left", "+", "-"]
	],
  "start": "Artical",
  "bnf": {
		"Artical": [["Paragraph", "return $$ = $1"]],
		"Id": [[ "ID", "$$ = yytext"]],
		"Property": [[ "PROPERTY", "$$ = yytext"]],
    "Null": [[ "_", "$$ = {type:'null'}" ]],
    "String": [[ "STRING", "$$ = ['string', yytext]" ]],
    "Number": [[ "NUMBER", "$$ = ['number', Number(yytext)]" ]],
		"Paragraph": [[ "Sentence",  "$$ = ['paragraph', [$1]];"],
									[ "Paragraph ; Sentence", "$$ = $1; $1[1].push($3);"],
									[ "Paragraph ;", "$$ = $1;"],
									[ "{ Paragraph }", "$$ = $2;"]
								 ],
		"Sentence": [["DoSentence", "$$ = $1;"],
								 ["AssignSentence", "$$ = $1;"]
								],
		"DoSentence": [["Unit", "$$ = ['do', [$1]];"],
									 ["DoSentence Unit", "$$ = $1; $1[1].push($2)"]
									],
		"AssignSentence": [["Assignable = DoSentence", "$$ = ['assign', [$1, $3[1]]];"],
											 ["Array = DoSentence", "$$ = ['assign', [$1, $3[1]]];"]
											],
		"Unit": [["BasicUnit", "$$= $1"],
						 ["PropertyUnit", "$$ = $1"],
						 ["Arguments", "$$ = $1"],
						 ["Operation", "$$ = $1;"],
						 ["Array", "$$ = $1"]
						],
		"BasicUnit": [["Value", "$$ = $1"],
									["Assignable", "$$ = $1"],
									["Call", "$$ = [$1]"],
									["ParenthesetUnit", "$$ = $1"],
									[ "` Unit `", "var tmp = {};tmp[$2[0]]=$2[1];$$ = ['raw', tmp];"]
								 ],
		"PropertyUnit": [["Property BasicUnit", "$$ = ['property', [$1, $2]]"]],
		"ParentheseUnit": [["( BasicUnit )", "$$ = $2"]],
		"Value": [["Null", "$$ = $1"], 
							["String", "$$ = $1"],
							["Number", "$$ = $1"]
						 ],		
		"Assignable": [["Id", "$$ = ['id', $1]"], 
									 ["ParentheseUnit . Id", "$$ = ['get', [$1, $3]]"],
									 ["ParentheseUnit [ BasicUnit ]", "$$ = ['get', [$1, $3]]"]
									],
		"Array": [[" BasicUnit , BasicUnit", "$$ = ['array', [$1, $3]]"],
							[" Array , BasicUnit",  "$$ = $1; $1[1].push($3)"]
						 ],
		"Call": [["& BasicUnit ", "$$ = ['do', $2];"]],
		"Arguments": [["@ ArgumentsArray", "$$ = ['arguments', $2]"],
									["~ Id", "$$ = ['returnclaim', $2]"]
								 ],
		"ArgumentsElement": [["Id", "$$ = [$1, {type:'auto'}]"],
												 ["Property Id", "$$ = [$1, {type: $2}]"],
												 ["Id ? BasicUnit", "$$ = [$1, {type: 'auto', default: $3}]"],
												 ["Property Id ? BasicUnit", "$$ = [$1, {type: $2, default: $4}]"]
												],
		"ArgumentsArray": [["ArgumentsElement", "$$={}; $$[$1[0]] = $1[1];"],
											 ["ArgumentsArray , ArgumentsElement", "$$=$1; $$[$3[0]] = $3[1]"]
											],
		"Operation": [[ "( Operation )", "$$ = $2"],
									[ "BasicUnit + BasicUnit", "$$ = ['add', [$1, $3]]"]
								 ]
  }
};
var options = {};
var code = new jison.Generator(grammar, options).generate();
fs.writeFileSync(__dirname + '/parser.js', code);

