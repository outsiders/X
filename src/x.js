var parser = require("./parser");
var fs = require("fs");
var path = require("path");
var libString = require("../lib/js/string");
var libArray = require("../lib/js/array");
var libObject = require("../lib/js/object");
var libFile = require("../lib/nodejs/file");
var sync = require("../lib/js/sync");
var log = require("../lib/nodejs/log");
var tmpl = require("./tmpl");
/*
function: 

 definition:

 	argv: [],
 	lang: [],

 invoke:
 	with array -> argv
 	with hash -> as local scope

 scope:
 	 

*/
module.exports = X;
var idcache = {};
var ttcache = {};
function X(config){
	var self = this;
	if(!config) config = {};
	self.keyCounts = {};//for default instance
	self.deps = {};
	if(!config.dispDir) config.dispDir = path.resolve(__dirname + "/..");
	if(!config.projectDir) config.projectDir = ".";
	if(!config.baseDir) config.baseDir = config.projectDir;
	if(!config.deps) config.deps = {};
	
	self.global = {
		config: config,
		main: {}
	};
	self.scope = {};
	self.src = {};
	self.filelist = {};
	self.parser = parser;
	self.parser.parser.yy= {
		compile: function(ast){
			var yy = this;
			if(!yy.lang) yy.lang = "nodejs";
			return self.compile(ast, yy);
		},
		normalize: function(arr){
			return self.normalize(arr);
		}
	}
	self.internal = {
		raw: function(param){
			return param;
		},
		paragraph: function(param, scope){
			var rtn = [];
			for(var i in param){
				var e = self.toes(param[i], scope);
				console.log("!e")
				console.log(e);
				rtn = rtn.concat(e);
			}
			return ['paragraph', rtn];
		},
		do: function(param, scope){
// core
			var result = self.do(param, scope);
			return self.toes(result, scope);
		},
		scope: function(param, scope){
			var newscope = {
				parentScope: scope
			}
			return ['scope', self.toes(param, newscope)];
		},
		assign: function(param, scope){
			var rtn = [];
			var tobeassigned = self.toes(param[1], scope)[0];
			if(param[0][0] == 'id' && !scope[param[0][1]]){
				scope[param[0][1]] = tobeassigned[0];
				rtn.push(['newvar', param[0][1]]);
			}
			rtn.push(['assign', [param[0], tobeassigned]]);
			return rtn;
		},
		env: {string: 1},
		argv: {string: 1},
		lang: {string: 1}
	} 

}
X.prototype.exec = function(main, argv){
	var self = this;
	var config = self.global.config;
	self.global.argv = argv || [];
	var ast = self.parse(fs.readFileSync(main).toString());
	var es = self.toes(ast, self.scope);
	console.log("!es");
	console.log(es);
	if(!self.scope.lang)
		self.scope.lang = "nodejs"
	var result = self.eval(es, self.scope);
	console.log("!result");
	console.log(result);
}
X.prototype.do = function(arr, scope){
	self = this;
	var propcount = 0;
	var hash= {};
	for(var i in arr){
		if(arr[i][0] == 'property'){
			hash[arr[i][1][0]] = arr[i][1][1];
			propcount ++;
		}
	}
	if(propcount == arr.length)
		return [['hash', hash]];
	return [arr[arr.length - 1]];
}
X.prototype.compile= function(ast, yy){
	self = this;
//call by parser

	return ast;
}
X.prototype.xinternal = function(ast){
	console.log('!xinternal');
	console.log(ast);
	var self = this;
	switch(ast[0]){
	case "paragraph":
		return self.xinternal(ast[1][ast[1].length - 1]);
	case "hash":
		var hash = {};
		for(var key in ast[1]){
			hash[key] = self.xinternal(ast[1][key]);
		}
		return hash;
	case "array": 
		var array = [];
		for(var i in ast[1]){
			array[i] = self.convert(ast[1][i]);
		}
		return array;
	case "string":
	case "number":
		return ast[1];
	case "null":
		return null;
	default:
		return undefined;
	}

}
X.prototype.impl = function(scope){
	var self = this;
	return scope;
}
X.prototype.toes = function(ast, scope){
	var self = this;
	var rtn;
	if(!ast) return;
	console.log("!toes");
	console.log(ast);
	console.log(scope);
	var id = ast[0];
	if(self.internal[id]){
		rtn = self.internal[id](ast[1], scope);
	}else{
		rtn = ast;
	}
	return rtn;
	
}
X.prototype.eval = function(ast, scope){
	var self = this;
	var rtn;
	if(!ast) return;
	console.log("!eval");
	console.log(ast);
	console.log(scope);
	var id = ast[0];
	var config = self.global.config;
	if(scope.lang == 'xinternal')
		return self.xinternal(ast, scope);
	if(scope.lang)
		 rtn = self.gen(ast, scope.lang, scope);

	if(rtn !== undefined) return rtn;
	
	var pscope = scope;
	while(pscope.parent){
		pscope = pscope.parent;
		rtn = self.gen(ast, pscope.lang, scope);
		if(rtn !== undefined) return rtn;
	}
	//native
	if(idcache[id])
		return self.eval(idcache[id], scope);
	var xfile = config.dispDir + "/concept/" + id + ".x";
	if(fs.existsSync(xfile)){
		idcache[id] = self.parse(fs.readFileSync(xfile).toString());
		return self.eval(idcache[id], scope);
	}
	throw "no id: "+ id;
}

X.prototype.parse = function(str){
	var self = this;
	if(str == "") return ['hash', {}];
	return self.parser.parse(str);
}

X.prototype.gen = function(ast, lang, scope){
	console.log("!gen");
	console.log(ast);
	console.log(lang);
	var self = this;
	var config = self.global.config;
	var id = ast[0];
	var rtn;
	var langconfig = {};
	if(lang != "x"){
		if(idcache[lang]){
			langconfig = idcache[lang];
		}else{
			var xfile = config.dispDir + "/concept/" + lang + ".x";
			if(!fs.existsSync(xfile))
				throw "no lang: "+lang;
			var langast = self.parse(fs.readFileSync(xfile).toString());
			langconfig = idcache[lang] = self.eval(self.toes(langast), {
				lang: "xinternal"
			});
			var tmpdeps = langconfig.deps;
			langconfig.deps = {};
			if(typeof tmpdeps == "string")
				langconfig.deps[tmpdeps] = 1;
			else if(libObject.isArray(tmpdeps)) 
				for(var i in tmpdeps)
					langconfig.deps[tmpdeps[i]] = 1;
			else
				langconfig.deps = tmpdeps;
		}
	}

	var ttfile = config.dispDir + "/concept/" + id + "/" + lang + ".tt";
	if(fs.existsSync(ttfile)){
		var str = tmpl.render({
			file: ttfile,
			extend: {
				eval: function(ast){
					return self.eval(ast, scope);
				}
			}
		}, {
			argv: ast[1],
			scope: scope
		});
		return str;
	}
	if(langconfig.deps)
		for(var key in langconfig.deps){
			console.log(key);
			rtn = self.gen(ast, key, scope);
			if(rtn !== undefined) return rtn;
		}
}
