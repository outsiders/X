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
  arguments: type, default
  return: ~

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
//	if(!config.projectDir) config.projectDir = ".";
//	if(!config.targetDir) config.targetDir = ".";
//	if(!config.baseDir) config.baseDir = config.projectDir;
	if(!config.deps) config.deps = {};
	
	self.global = {
		config: config,
		main: {}
	};
	self.scope = {
		indent: 0
	};
	self.src = {};
	self.filelist = {};
	self.filecount = 0;
	self.parser = parser;
	self.parser.parser.yy= {
// not used
		normalize: function(arr){
			return self.normalize(arr);
		}
	}
	self.internal = {
		env: {string: 1},
		argv: {string: 1},
		lang: {string: 1}
	} 

}
X.prototype.exec = function(main, argv){
	var self = this;
	var config = self.global.config;
	if(!config.targetDir) config.targetDir = path.dirname(main);
	self.global.argv = argv || [];
// first step parse ast
	var ast = self.parse(fs.readFileSync(main).toString());
	log.i("parse done");
// then normalize ast
	var es = self.normalize(ast, self.scope);
	log.i("normalize done");
	if(!self.scope.lang)
		self.scope.lang = "nodejs"
// finally eval 
	var result = self.eval(es, self.scope);
	log.i("eval done");
	self.writefile();
	log.i("writefile done");
}

X.prototype.parse = function(str){
	var self = this;
	if(str == "") return ['hash', {}];
	return self.parser.parse(str);
}

X.prototype.normalize = function(ast, scope){
	var self = this;
	var rtn;
//	if(!ast || typeof ast != 'object') return ast;
	var id = ast[0];
	var param = ast[1];
	switch(id){
	case "raw": 
		return param;
	case "paragraph": {
		rtn = [];
		for(var i in param){
			var e = self.normalize(param[i], scope);
			rtn = rtn.concat(e);
		}
		return ['paragraph', rtn];
	};
	case "do":
		return self.do(param, scope);
	case "assign":
		rtn = [];
		var tobeassigned = self.do(param[1], scope, {assign: 1});
		if(param[0][0] == 'id' && !scope[param[0][1]]){
			scope[param[0][1]] = {
				type: tobeassigned[0],
				local: 1
			};
			rtn.push(['newvar', param[0][1]]);
		}
		rtn.push(['assign', [param[0], tobeassigned]]);
		return rtn;
	default:
		return ast;
	}
}
X.prototype.do = function(arr, scope, doconfig){
	if(!doconfig) doconfig= {};
	var self = this;
	var core, coredef;
	var param = {};
	var maini = 0;
	var propertyc = 0;
//get mainfunc
	for(var i in arr){
		var e = arr[i];
		if(e[0] == 'arguments'){ 
			//if has arguments, it is a function definition
			core = "function";
			param.arguments = e[1];
			param.content = [];
			maini = i;
			break;
		} 
		if(e[0] == 'id'){
			//if still not found main, try every e
			//if is an id, get its definiton
			var iddef = self.getid(e[1], scope);
			if(iddef.local){
				// if it is a local id, call the function or check next
				if(iddef.type == "function"){
					core = "call";
					param.id = e[1];
					maini = i;
					coredef = iddef;
					break;
				}else{
					continue;
				}
			}
			if(iddef.type == "function"){
				core = e[1];				
				maini = i;
				coredef = iddef;
				break;
			}
		}
	}

	switch(core){
		case "function": {
			for(var i in arr){
				var e = arr[i];
				if(e[0] == 'property'){ //e[1]: ['a', ['number', 1]]
					param.content.push(self.normalize(arr[i]));
				}else if(e[0] == 'arguments'){ 
					continue;
				}else if(e[0] == 'paragraph'){
					param.content.concat(self.normalize(arr[i])[1]);
				}else{
					param.content.push(self.normalize(arr[i]));
				}
			}
			var clen = param.content.length;
			if(param.content[clen-1][0] != "return"){
				param.content[clen-1] = ['return', param.content[clen-1]];
			}
			break;
		}
		case "call": {
			for(var i in arr){
				var e = arr[i];
				if(e[0] == 'property'){ //e[1]: ['a', ['number', 1]]
					param[e[1][0]] = self.normalize(e[1][1]);
				}else{
					
				}
			}
			break;
		}
		default: {
			for(var i in arr){
				var e = arr[i];
				if(e[0] == 'property'){ //e[1]: ['a', ['number', 1]]
					param[e[1][0]] = self.normalize(e[1][1]);
					propertyc ++;
				}
			}
			break;
		}		
	}
	if(!core){
		if(propertyc >0){
			if(propertyc != arr.length)
				throw "wrong hash";
			core = "hash";
		}else if(!doconfig.assign){
			core = "print";
			param = arr;
		}else if(arr.length == 1){
			core = arr[0][0];
			param = arr[0][1];
		}else{
			log.e(arr);
			throw "syntax error";
		}
	}
	return [[core, param]];
}

X.prototype.getid = function(param, scope){
	var self = this;
	if(scope[param]) return scope[param];
	var config = self.getxid(param);
	if(!config) return {"new": 1};//new id
	return config;
}
X.prototype.getxid = function(lang){
	var self = this;
	var config = self.global.config;
	if(lang == "x"){
		return {};
	}
	if(idcache[lang]){
		return idcache[lang];
	}
	var xfile = config.dispDir + "/concept/" + lang + ".x";
	if(!fs.existsSync(xfile))
		throw "no lang: "+lang;
	var langast = self.parse(fs.readFileSync(xfile).toString());
	var xconfig = idcache[lang] = self.x2jsobj(self.normalize(langast));

	var tmpdeps = xconfig.deps;
	xconfig.deps = {};
	if(typeof tmpdeps == "string")
		xconfig.deps[tmpdeps] = 1;
	else if(libObject.isArray(tmpdeps)) 
		for(var i in tmpdeps)
			xconfig.deps[tmpdeps[i]] = 1;
	else
		xconfig.deps = tmpdeps;
	return xconfig;
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
X.prototype.x2jsobj = function(ast){

	var self = this;
	switch(ast[0]){
	case "writefile":
		for(var key in ast[1]){
			self.regfile(key, ast[1][key]);
		}
		return 1;
	case "paragraph":
		return self.x2jsobj(ast[1][ast[1].length - 1]);
	case "hash":
		var hash = {};
		for(var key in ast[1]){
			hash[key] = self.x2jsobj(ast[1][key]);
		}
		return hash;
	case "array": 
		var array = [];
		for(var i in ast[1]){
			array[i] = self.x2jsobj(ast[1][i]);
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

X.prototype.eval = function(ast, scope){
	var self = this;
	var rtn;
	if(!ast) return;

	var id = ast[0];
	var config = self.global.config;
	//this lang
	if(scope.lang){
		 rtn = self.gen(ast, scope.lang, scope);
		if(rtn === undefined) {
			log.e(ast);
			throw "no defined "+ id + " " + scope.lang;
		}
		return rtn;
	}
	//parent lang
	var pscope = scope;
	while(pscope.parentScope){
		pscope = pscope.parentScope;
		if(pscope.lang)
			return self.gen(ast, pscope.lang, scope);
	}
/*
	//x
	
	if(idcache[id])
		return self.evalidcache[id], scope);
	var xfile = config.dispDir + "/concept/" + id + ".x";
	if(fs.existsSync(xfile)){
		idcache[id] = self.x2jsobj(self.parse(fs.readFileSync(xfile).toString()));
		return self.eval(idcache[id], scope);
	}
*/
	throw "no id: "+ id + " " + scope.lang;
}

X.prototype.gen = function(ast, lang, scope, superflag){

	var self = this;
	var config = self.global.config;
	var id = ast[0];

	var rtn;
	var xconfig = self.getxid(lang);
	if(!superflag){
		var ttfile = config.dispDir + "/concept/" + id + "/" + lang + ".tt";
		if(fs.existsSync(ttfile)){
			var writefilename = "";
			var writeconfig = {};
			var str = tmpl.render({
				file: ttfile,
				extend: {
					eval: function(ast, config){
						var nextscope;
						if(!config) config = {};
						if(config.newscope){
							nextscope = {
								parentScope: scope,
								indent: scope.indent + 1
							};							
						}else{
							nextscope = scope;
						}
						if(typeof ast[0] != "string"){
							var str = "";
							for(var i in ast){
								if(i != 0) str += (config.sep || ", ");
								str += self.eval(ast[i], nextscope);	
							}
							return str;
						}							
						return self.eval(ast, nextscope);
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
				return self.x2jsobj(['writefile', tmprtn]);
			}else{
				return str;
			}
		}
	}
	if(xconfig.deps){
		for(var key in xconfig.deps){
			rtn = self.gen(ast, key, scope);
			if(rtn !== undefined) return rtn;
		}
	}

}
