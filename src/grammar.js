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
      ["{sp},{sp}", "return ','"],
      ["{sp};{sp}", "return ';'"]
    ]
  },
  "tokens": "STRING NUMBER PROPERTY ID . { } [ ] ( ) & = + - * / , :",
	"operators": [
		["left", ","],
		["left", "."],
//		["right", "RIGHTOPERATORID"],
//		["left", "LEFTOPERATORID"],
    ["right", "="],
    ["left", "*", "/"],
		["left", "+", "-"]
	],
  "start": "Block",
  "bnf": {
		"Block": [["ExpressionList", "return $$ = $1"]],
		"Id": [[ "ID", "$$ = yytext"]],
		"Property": [[ "PROPERTY", "$$ = yytext"]],
    "Null": [[ "_", "$$ = {type:'null'}" ]],
    "String": [[ "STRING", "$$ = ['string', yytext]" ]],
    "Number": [[ "NUMBER", "$$ = ['number', Number(yytext)]" ]],
		"ExpressionList": [[ "Expression",  "$$ = ['expression', [yy.normalize($1)]];"],
											 [ "ExpressionList ; Expression", "$$ = $1; $1[1].push(yy.normalize($3));"],
											 [ "ExpressionList ;", "$$ = $1;"]
											],
		"Expression": [["Sentence", "$$ = $1;"],
									 ["Assign", "$$ = $1;"]
									],
		"Sentence": [["Unit", "$$ = ['sentence', [$1]];"],
							 ["Sentence Unit", "$$ = $1; $1[1].push($2)"]
							],
		"Assign": [["Assignable = Expression", "$$ = ['assign', $1, $3];"],
							 ["Array = Expression", "$$ = ['assign', $1, $3];"]
							],
		"Unit": [["BasicUnit", "$$= $1"],
						 ["PropertyUnit", "$$ = $1"],
						 ["Arguments", "$$ = $1"],
						 ["Operation", "$$ = $1;"]
						],
		"BasicUnit": [["Value", "$$ = $1"],
									["Assignable", "$$ = $1"],
									["Call", "$$ = [$1]"],
									["BracketUnit", "$$ = $1"]
								 ],
		"PropertyUnit": [["Property BasicUnit", "$$ = ['property', $1, $2]"]],
		"BracketUnit": [["{ Unit }", "$$ = [$2]"]],
		"Value": [["Null", "$$ = $1"], 
							["String", "$$ = $1"],
							["Number", "$$ = $1"]
						 ],		
		"Assignable": [["Id", "$$ = ['id', $1]"], 
									 ["BracketUnit . Id", "$$ = ['get', [$1, $3]]"],
									 ["BracketUnit [ BasicUnit ]", "$$ = ['get', [$1, $3]]"]
									],
		"Array": [[" BasicUnit , BasicUnit", "$$ = $1"],
							[" Array , BasicUnit",  "$$ = $1"]
						 ],
		"Call": [["& BasicUnit ", "$$ = $2;"]],
		"Arguments": [["@ Id", "$$ = ['arguments', [$2]]"],
									["Arguments , Id", "$$ = $1, $1[1].push($3)"]
								 ],
		"Operation": [[ "( Operation )", "$$ = $2"],
									[ "BasicUnit + BasicUnit", "$$ = ['add', [$1, $3]]"]
								 ]
  }
};
var options = {};
var code = new jison.Generator(grammar, options).generate();
fs.writeFileSync(__dirname + '/parser.js', code);

