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
		_indent: 0
	};
	self.src = {};
	self.filelist = {};
	self.filecount = 0;
	self.parser = parser;
	self.parser.parser.yy= {
// not use
		xe: function(arr){
			return self.xe(arr);
		}
	}
/*
	self.internal = {
		setglobal: function(hash, scope){

			self.scope[hash.key] = hash.value;
		}
	} 
*/
}
X.prototype.start = function(main, argv){
	var self = this;
	var config = self.global.config;
	if(!config.targetDir) config.targetDir = path.dirname(main);
	self.global.argv = argv || [];
// first step parse ast
	var ast = self.parse(fs.readFileSync(main).toString());
	log.i("parse done");
//	log.i(ast);
// then normalize ast
	var es = self.normalize(ast, self.scope);
	log.i(es);
	log.i("normalize done");
	if(!self.scope._lang)
		self.scope._lang = "nodejs"
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

X.prototype.istype = function(stc, ttype, scope){
	var self = this;
	var cdd;
	
	if(typeof stc == "string") cdd = stc;
	else cdd = stc[0];

	var iddef;
	if(cdd == ttype) return true;
	if(cdd == "access"){
		iddef = self.getid(stc[1].id, scope);
		if(!iddef || !iddef.type) return false;
		if(stc[1].property){
//TODO
		}else{
			if(self.istype(iddef.type, ttype, scope)) return true;
		}
	}else{
		iddef = self.getid(cdd, scope);
	}
	if(iddef && iddef.deps){
		for(var key in iddef.deps){
			if(self.istype(key, ttype, scope))	return true;
		}
	}
	return false;
}
X.prototype.getmain = function(arr, scope, doconfig){
	var self = this;
	var main = {};	
	var propertyc = 0;
//get mainfunc
	for(var i in arr){
		i = parseInt(i);
		var e = arr[i];
		if(e[0] == '_arguments'){ 
			//if has arguments, it is a function definition
			main.type = "function";
			main.arguments = self.normalize(e, scope)[1];;
			main.columnindex = i;
			main.config = {
				content: {etc: 1}
			}
			return main;
		} 
		if(e[0] == '_id'){
			//if still not found main, try every e
			//if is an id, get its definiton
//TODO TODO!!!!!!!!!!
			var iddef = self.getid(e[1], scope);
			if(iddef.type == "function"){
				main.type = e[1];
				main.columnindex = i;
				if(iddef.return) main.return = iddef.return;
				main.config = iddef.arguments;
				return main;
			}
		}
		if(e[0] == '_property'){ 
			propertyc ++;
		}
	}
	if(!main.type){
		if(propertyc == arr.length){
			main.type = 'hash';
			main.columnindex = -1;
		}else	if(!doconfig.assign){
			main.type = 'print';
			main.columnindex = -1;
		}else if(arr.length > 1){
			main.type = 'array';
			main.columnindex = -1;
		}else{
			var tmp = self.normalize(arr[0], scope);
			main.type = tmp[0];
			main.param = tmp[1];
			main.columnindex = 0;
		}
	}
	var iddef = self.getid(main.type, scope);
	if(iddef.arguments){
		main.config = iddef.arguments;
		if(iddef.return) main.return = iddef.return;
	}
	return main;
}

X.prototype.sentence = function(arr, scope, doconfig){
	if(!doconfig) doconfig= {};
	var self = this;
	var main = self.getmain(arr, scope, doconfig);
	if(main.hasOwnProperty('param')) return [main.type, main.param];
	var param = {};
	for(var i in arr){
		if(i == main.columnindex) continue;
		var e = arr[i];	
		var ne = self.normalize(e, scope, {param: param});
		if(ne){
			var used = 0;
			for(var key in main.config){
				var mc = main.config[key];
				if(mc.etc){
					if(!param[key]) param[key] = [];
					param[key].push(ne);
					used = 1;
					break;
				}
				if(param.hasOwnProperty(key)){
					continue;
				}
				if(!mc.type || self.istype(ne, mc.type, scope)){
					param[key] = ne;
					used = 1;
					break;
				}
			}
			if(!used){
				log.i(arr);
				log.i(main);
				log.i(ne);
				log.i(mc.type);
				log.i(scope);
				throw "wrong param for function: " + main.type;
			}
		}
	}
	for(var key in main.config){
		if(main.config[key].required && !param[key]) 
			throw main.key +" require "+ key;
	}

	if(main.type == "function"){
		param.arguments = main.arguments;
		if(main.return)
			param.return = main.return;
		if(param.deps){
			var tmpdeps = param.deps;
			param.deps = {};
			if(tmpdeps[0] == "string"){
				param.deps[tmpdeps[1]] = 1;
			}else if(tmpdeps[0] == "array"){
				for(var i in tmpdeps[1]){
					param.deps[tmpdeps[1][i][1]] = 1;
				}
			}else if(tmpdeps[0] == "hash"){
				param.deps = tmpdeps[1];
			}else{
				log.e(tmpdeps);
				throw "wrong deps";
			}
		}		
		if(param.content){
			var clen = param.content.length;
			if(param.content[clen-1][0] != "return"){
				param.content[clen-1] = ['return', param.content[clen-1]];
			}
		}
	}
	if(main.return) 
		return [main.return, [main.type, param]];
	else
		return [main.type, param];
}
X.prototype.block = function(asts, scope, doconfig){
	var self = this;
	var rtn = [];
	for(var i in asts){
		var e = self.normalize(asts[i], scope, doconfig);
		if(typeof e[0] === 'string')
			rtn.push(e);
		else
			rtn = rtn.concat(e);
	}
	return rtn;
}
X.prototype.storeinscope = function(ast, scope){
	var self = this;
	var rtn = {};
	rtn.type = ast[0];
	for(var key in ast[1]){
		rtn[key] = ast[1][key];		
	}
	return rtn;
}

X.prototype.normalize = function(ast, scope, doconfig){
	var self = this;
	if(typeof ast != "object") return ast;
	if(typeof ast[0] !== "string"){
		return self.block(ast, scope);
	}
//	if(!ast || typeof ast != 'object') return ast;
	var id = ast[0];
	if(id[0] !== "_")
		throw "wrong id to normalize "+id;
	var options = ast[1];
	switch(id){
	case "_add": 
		return ['add', self.normalize(options, scope)];
	case "_number": 
		return ['number', options];
	case "_string": 
		return ['string', options];
	case "_array": 
		return ['array', self.normalize(options)];
	case "_property": 
		doconfig.param[options[0]] = self.normalize(options[1], scope);
		return;
	case "_main": 
		return ['main', self.normalize(options, scope)];
	case "_paragraph": 
		var newscope = {
			_parentScope: scope,
			_indent: scope._indent + 1
		};
		if(scope.arguments){
			for(var key in scope.arguments){
				newscope[key] = scope.arguments[key];
			}
		}
		return self.normalize(options, newscope);
	case "_arguments": 
		scope.arguments = {};
		for(var key in options){
			var ok = options[key];
			if(ok.default) ok.default = self.normalize(ok.default, scope);
			scope.arguments[key] = {type: ok.type, local: 1};
		}
		return ['arguments', options];
	case "_id":
		var ne = self.normalize(options, scope);
		return ["access", {'id': ne}];
	case "_access":
		var ne = self.normalize(options[0], scope);
		return ["access", {
			id: ne, 
			property: self.normalize(options[1], scope)
		}];
	case "_assign":
		var rtn = [];
		var tobeassigned = self.normalize(options[1], scope, {assign: 1});
		var varop = self.normalize(options[0], scope); 
		//['access', {'id': ?}]

		if(varop[0] == 'access' && !scope[varop[1].id]){
			scope[varop[1].id] = self.storeinscope(tobeassigned);
			scope[varop[1].id].local = 1;
			rtn.push(['newvar', ["access", {id: varop[1].id}]]);
		}
		rtn.push(['assign', [varop, tobeassigned]]);
		return rtn;
	case "_sentence":
		return self.sentence(ast[1], scope, doconfig);
	case "_return":
		doconfig.return = ast[1];
		return;
	default:
		throw "unknown id "+id;
	}
}


X.prototype.getid = function(param, scope){

	var self = this;
	if(scope[param]){
		return scope[param];
	}
	var config = self.getxid(param);
	if(!config) throw "no id" + id;//new id
	return config;
}
X.prototype.require = function(xfile){
	var self = this;
}
X.prototype.getxid = function(id){
	var self = this;
	var config = self.global.config;
	if(idcache[id]){		
		return idcache[id];
	}
	var xfile = config.dispDir + "/concept/" + id + ".x";
	if(!fs.existsSync(xfile)){
		log.e(id);
		throw "no xid: "+ id;
	}
	var ast = self.parse(fs.readFileSync(xfile).toString());

	var xconfig = self.normalize(ast, {});
//['main', [['function', {}]] ]	
	idcache[id] = self.storeinscope(xconfig[1][0]);
	return idcache[id];
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
		self.filelist[rfile].content = config.content;
	}else{
		self.filelist[rfile].content += config.content;
	}
	return 1;
}
X.prototype.x2jsobj = function(ast){
	var self = this;
	switch(ast[0]){
	case "writefile":
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
	if(!ast) return "";
	if(typeof ast != "object") {log.e(ast); throw ast;}
	if(typeof ast[0] !== "string"){
		if(!libObject.isArray(ast)) {log.e(ast); throw ast;}
		for(var i in ast){
			self.eval(ast[i], scope);
		}
		return;
	}
	var id = ast[0];

//	if(self.internal[id]) return self.internal[id](ast[1], scope);
	var config = self.global.config;
	//this lang
	if(scope._lang){
		rtn = self.gen(ast, scope._lang, scope);
		if(rtn !== undefined) {
			return rtn;
		}
	}
	//parent lang
	var pscope = scope;
	while(pscope._parentScope){
		pscope = pscope._parentScope;
		if(pscope._lang){
			rtn = self.gen(ast, pscope._lang, scope);
			if(rtn !== undefined) {
				return rtn;
			}			
		}
	}

	//x
	var idconfig = self.getid(id, scope);
	if(idconfig.content){
		console.log("!" +id);
		console.log(idconfig);
		console.log(JSON.stringify(idconfig.content));
		console.log(scope);
		rtn = self.eval(idconfig.content, scope);
		console.log(rtn);
		console.log(scope);
		return;
	}

}

X.prototype.gen = function(ast, lang, scope, genconfig){
	var self = this;
	var config = self.global.config;
	var id = ast[0];
	if(!genconfig) genconfig = {};
	var rtn;

	
	var langconfig = self.getxid(lang);
	if(!genconfig.super){
		var ttfile = config.dispDir + "/concept/" + id + "/" + lang + ".tt";
		if(fs.existsSync(ttfile)){
			var regfilename = "";
			var regconfig = {};
			var str = tmpl.render({
				file: ttfile,
				extend: {
					eval: function(ast, config){
						if(ast == undefined) return "";
						if(typeof ast != "object") return ast;
						var nextscope;
						if(!config) config = {};
						if(config.newscope){
							nextscope = {
								_parentScope: scope,
								_indent: scope._indent + 1
							};							
						}else{
							nextscope = scope;
						}
						if(typeof ast[0] != "string"){
							var str = "";
							for(var i in ast){
								if(i != 0 && ast.length > 1) str += (config.sep || ", ");
								str += self.eval(ast[i], nextscope);	
							}
							return str;
						}							
						return self.eval(ast, nextscope);
					},
					regfile: function(filename, config){
						regfilename = filename;
						if(typeof config == "string")
							regconfig[config] = 1;
						else if(config)
							regconfig = config;
					},
					super: function(){
						return self.gen(ast, lang, scope, {super:1});
					}
				}
			}, {
				id: genconfig.id || ast[0],
				argv: ast[1],
				scope: scope
			});			
			if(id == "main"){

				return self.regfile("index.js", {content: str});;
			}else{
				return str;
			}
		}
	}
	if(langconfig.deps){
		for(var key in langconfig.deps){
			var newgenconfig = {notgenparentid: 1};
			if(genconfig.id) newgenconfig.id = genconfig.id;
			rtn = self.gen(ast, key, scope, newgenconfig);
			if(rtn !== undefined) return rtn;
		}
	}
	if(!genconfig.notgenparentid){
		var xconfig = self.getid(ast[0], scope);
		if(xconfig.deps){
			for(var key in xconfig.deps){
				rtn = self.gen([key, ast[1]], lang, scope, {id: genconfig.id || ast[0]});
				if(rtn !== undefined) return rtn;
			}
		}
	}
	

// try generate using lang but failed, using default

	var idconfig = self.getid(id, scope);
	if(idconfig.local){
//todo call or value or ref etc
		return self.eval(["call", {id: ast[0], param: ast[1]}], scope);
	}else{
		if(idconfig[id] && idconfig[id].content){
			return self.eval(idconfig[id].content);
		}
	}

}
