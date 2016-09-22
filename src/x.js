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
	if(!config.targetDir) config.targetDir = ".";
	if(!config.baseDir) config.baseDir = config.projectDir;
	if(!config.deps) config.deps = {};
	
	self.global = {
		config: config,
		main: {}
	};
	self.scope = {};
	self.src = {};
	self.filelist = {};
	self.filecount = 0;
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
				rtn = rtn.concat(e);
			}
			return ['paragraph', rtn];
		},
		do: function(param, scope){
// core
//			console.log("!do")
//			console.log(JSON.stringify(param));
			var result = self.do(param, scope);
//			console.log(result);
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

	self.writefile();
}
X.prototype.gettype = function(){
}
X.prototype.do = function(arr, scope){
	self = this;
	var propcount = 0;
	var hash= {};
	var mainfunc = "";
	for(var i in arr){
		var form = arr[i][0];
		var param = arr[i][1];
		if(form == 'property'){
			hash[param[0]] = param[1];
			propcount ++;
		}else if(form == 'id'){
			var type = self.gettype(param);
			if(type == "function")
				mainfunc = param;
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
X.prototype.writefile = function(){
	var self = this;
	for(var key in self.filelist){
		var tfilename = self.global.config.targetDir + "/" + key;
		var config = self.filelist[key];

		var str = config.content;
		libFile.mkdirpSync(path.dirname(tfilename)); //to be acc
		if(fs.existsSync(tfilename))
					fs.unlinkSync(tfilename);
		self.filecount ++;
		var mode;
		if(config.exec){
					mode = 0555;
					str = "#!/usr/bin/env "+ config.exec + "\n" + str;
				}else{
							mode = 0444;
						}
		fs.writeFileSync(tfilename, str, {mode: mode});
	}
}
X.prototype.regfile = function(filename, config){
	var self = this;
	var rfile = path.relative(".", filename);
	if(!self.filelist[rfile]){
		self.filelist[rfile] = config;
		self.filelist[rfile].content = [config.content];
	}else{
		self.filelist[rfile].content.push(config.content);
	}
}
X.prototype.cmd = function(ast){
//	console.log('!cmd');
//	console.log(ast);
	var self = this;
	switch(ast[0]){
	case "writefile":
		for(var key in ast[1]){
			self.regfile(key, ast[1][key]);
		}
		return 1;
	case "paragraph":
		return self.cmd(ast[1][ast[1].length - 1]);
	case "hash":
		var hash = {};
		for(var key in ast[1]){
			hash[key] = self.cmd(ast[1][key]);
		}
		return hash;
	case "array": 
		var array = [];
		for(var i in ast[1]){
			array[i] = self.cmd(ast[1][i]);
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
//	console.log("!toes");
//	console.log(ast);
	var id = ast[0];
	if(self.internal[id]){
		rtn = self.internal[id](ast[1], scope);
	}else{
		rtn = ast;
	}
//	console.log("!toes return");
//	console.log(rtn);
	return rtn;
	
}

X.prototype.eval = function(ast, scope){
	var self = this;
	var rtn;
	if(!ast) return;
//	console.log("!eval");
//	console.log(ast);
//	console.log(scope);
	var id = ast[0];
	var config = self.global.config;
	//this lang
	if(scope.lang)
		 return self.gen(ast, scope.lang, scope);
//	if(rtn !== undefined) return rtn;
	//parent lang
	var pscope = scope;
	while(pscope.parent){
		pscope = pscope.parent;
		if(pscope.lag)
			return self.gen(ast, pscope.lang, scope);
	}
/*
	//x
	console.log("using x " + id);
	
	if(idcache[id])
		return self.evalidcache[id], scope);
	var xfile = config.dispDir + "/concept/" + id + ".x";
	if(fs.existsSync(xfile)){
		idcache[id] = self.cmd(self.parse(fs.readFileSync(xfile).toString()));
		return self.eval(idcache[id], scope);
	}
*/
	throw "no id: "+ id + " " + scope.lang;
}

X.prototype.parse = function(str){
	var self = this;
	if(str == "") return ['hash', {}];
	return self.parser.parse(str);
}
X.prototype.getconfig = function(lang){
	var self = this;
	var config = self.global.config;
	var langconfig;
	if(lang == "x"){
		return {};
	}
	if(idcache[lang]){
		langconfig = idcache[lang];
	}else{
		var xfile = config.dispDir + "/concept/" + lang + ".x";
		if(!fs.existsSync(xfile))
			throw "no lang: "+lang;
		var langast = self.parse(fs.readFileSync(xfile).toString());

		langconfig = idcache[lang] = self.cmd(self.toes(langast));

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
	return langconfig;
}
X.prototype.gen = function(ast, lang, scope, superflag){
//	console.log("!gen " + lang);
//	console.log(ast);
	var self = this;
	var config = self.global.config;
	var id = ast[0];
	var rtn;
	var langconfig = self.getconfig(lang);
	if(!superflag){
		var ttfile = config.dispDir + "/concept/" + id + "/" + lang + ".tt";
		if(fs.existsSync(ttfile)){
			var writefilename = "";
			var writeconfig = {};
			var str = tmpl.render({
				file: ttfile,
				extend: {
					eval: function(ast){
						return self.eval(ast, scope);
					},
					writefile: function(filename, config){
						writefilename = filename;
						if(typeof config == "string")
							writeconfig[config] = 1;
						else if(config)
							writeconfig = config;
					},
					super: function(){
						return self.gen(ast, lang, scope, 1);
					}
				}
			}, {
				argv: ast[1],
				scope: scope
			});

			if(writefilename){
				var tmprtn = {};
				writeconfig.content = str;
				tmprtn[writefilename] = writeconfig;
				return self.cmd(['writefile', tmprtn]);
			}else{
				return str;
			}
		}
	}
	if(langconfig.deps)
		for(var key in langconfig.deps){
			rtn = self.gen(ast, key, scope);
			if(rtn !== undefined) return rtn;
		}
}
