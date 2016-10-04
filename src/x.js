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
		xe: function(arr){
			return self.xe(arr);
		}
	}
	self.internal = {
		env: {string: 1},
		argv: {string: 1},
		lang: {string: 1}
	} 

}
X.prototype.start = function(main, argv){
	var self = this;
	var config = self.global.config;
	if(!config.targetDir) config.targetDir = path.dirname(main);
	self.global.argv = argv || [];
// first step parse ast
	var ast = self.parse(fs.readFileSync(main).toString());
	log.i("parse done");
	log.i(ast);
// then normalize ast
	var es = self.normalize(ast, self.scope);
	log.i(es);
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
			main.arguments = e[1];
			main.columnindex = i;
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
				main.arguments = iddef.arguments;
				if(tmpconfig.return) main.return = iddef.return;
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
	var tmpconfig = self.getid(main.type, scope);
	main.arguments = tmpconfig.arguments;
	if(tmpconfig.return) main.return = tmpconfig.return;
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
			for(var key in main.arguments){
				var mc = main.arguments[key];
				if(mc.etc){
					if(!param[key]) param[key] = [];
					param[key].push(ne);
					used = 1;
					break;
				}
				if(param.hasOwnProperty(key)){
					continue;
				}
				if(!mc.type || mc.type == ne[0]){
					param[key] = ne;
					used = 1;
					break;
				}
			}
			if(!used){
				log.e(arr);
				log.e(ne);
				throw "not used ";
			}
		}
	}
	for(var key in main.arguments){
		if(main.arguments[key].required && !param[key]) 
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
			}else if(libObject.isArray(tmpdeps)){
				for(var i in tmpdeps){
					param.deps[tmpdeps[i][1]] = 1;
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
	case "_number": 
		return ['number', options];
	case "_string": 
		return ['string', options];
	case "_property": 
		doconfig.param[options[0]] = self.normalize(options[1], scope);
		return;
	case "_main": 
		return ['main', self.normalize(options, scope)];
	case "_id":
		var ne = self.normalize(options, scope);
		return ["id", ne];
	case "_assign":
		var rtn = [];
		var tobeassigned = self.normalize(options[1], scope, {assign: 1});
		var varop = self.normalize(options[0], scope);
		if(varop[0] == 'id' && !scope[varop[1]]){
			scope[varop[1]] = {
				type: tobeassigned[0],
				local: 1
			};
			rtn.push(['newvar', varop[1]]);
		}
		rtn.push(['assign', [varop, tobeassigned]]);
		return rtn;
	case "_sentence":
		return self.sentence(ast[1], scope, doconfig);
	default:
		throw "unknown id "+id;
	}
}


X.prototype.getid = function(param, scope){

	var self = this;
	if(scope[param]) return scope[param];
	var config = self.getxid(param);
	if(!config) return {"new": 1};//new id
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
	if(!fs.existsSync(xfile))
		throw "no xid: "+ id;
	var ast = self.parse(fs.readFileSync(xfile).toString());
	var xconfig = idcache[id] = self.normalize(ast[1][0], {})[1];
/*
*/
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
	if(!ast) return;
	if(typeof ast[0] !== "string"){
		for(var i in ast){
			self.eval(ast[i], scope);
		}
		return;
	}
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
		if(pscope.lang){
			return self.gen(ast, pscope.lang, scope);
		}
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
			var regfilename = "";
			var regconfig = {};
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
						return self.gen(ast, lang, scope, 1);
					}
				}
			}, {
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
	if(xconfig.deps){
		for(var key in xconfig.deps){
			rtn = self.gen(ast, key, scope);
			if(rtn !== undefined) return rtn;
		}
	}

}
