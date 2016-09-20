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
			var rtn;
			for(var i in param){
				rtn = self.eval(param[i], scope);
			}
			return rtn;
		},
		do: function(param, scope){
// core
			var result = self.do(param, scope);
			return self.eval(result, scope);
		},
		assign: function(param, scope){
			return scope[self.eval(param[0], scope)] = self.eval(param[1], scope);
		},
		scope: function(param, scope){
			var newscope = {
				parentScope: scope
			}
			return self.eval(param, newscope);
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
	var rtn = self.parse(fs.readFileSync(main).toString());
	if(!self.scope.lang) self.scope.lang = "nodejs";
	return self.eval(rtn, self.scope);
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
		return ['hash', hash];
	return arr[arr.length - 1];
}
X.prototype.compile= function(ast, yy){
	self = this;
//call by parser

	return ast;
}
X.prototype.convert = function(ast){
	console.log('!convert');
	console.log(ast);
	var self = this;
	switch(ast[0]){
	case "hash":
		var hash = {};
		for(var key in ast[1]){
			hash[key] = self.convert(ast[1][key]);
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
X.prototype.eval = function(ast, scope){
	var self = this;
	var rtn;
	if(!ast) return;
	console.log("!eval");
	console.log(ast);
	console.log(scope);
	var id = ast[0];
	var config = self.global.config;
	if(self.internal[id])
		return self.internal[id](ast[1], scope);
	if(scope.lang)
		 rtn = self.gen(ast, scope.lang);

	if(rtn !== undefined) return rtn;

	var pscope = scope;
	while(pscope.parent){
		pscope = pscope.parent;
		rtn = self.gen(ast, pscope.lang);
		if(rtn !== undefined) return rtn;
	}
	
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
	return self.parser.parse(str);
}

X.prototype.gen = function(ast, lang){
	console.log("!gen");
	console.log(ast);
	console.log(lang);
	var self = this;
	var config = self.global.config;
	var id = ast[0];
	var rtn;
	var langconfig = {};
	if(lang == "xinternal") 
		return self.convert(ast);
	if(lang != "x"){
		if(idcache[lang]){
			langconfig = idcache[lang];
		}else{
			var xfile = config.dispDir + "/concept/" + lang + ".x";
			if(!fs.existsSync(xfile))
				throw "no lang: "+lang;
			var langast = self.parse(fs.readFileSync(xfile).toString());
			langconfig = idcache[lang] = self.eval(langast, {
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
	if(fs.existsSync(ttfile))
		return tmpl.render(ttfile, {
			argv: ast[1]
		});
	if(langconfig.deps)
		for(var key in langconfig.deps){
			rtn = self.gen(ast, key);
			if(rtn !== undefined) return rtn;
		}
}
