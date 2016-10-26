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


module.exports = X;
var idcache = {};
var ttcache = {};
function X(config){
	var self = this;
	if(!config) config = {};
	self.keyCounts = {};//for default instance
	self.deps = {};
	if(!config.dispDir) config.dispDir = path.resolve(__dirname + "/..");
	if(!config.deps) config.deps = {};
	
	self.global = {
		config: config,
		main: {}
	};
	self.scope = {
		_indent: "",
		_index: 0,
		_lang: "lang",
		_lib: {}
	};
	self.scopes= [self.scope];
	self.scopeIndex = 1;
	self.src = {};
	self.filelist = {};
	self.filecount = 0;
	self.parser = parser;
	self.tab = "index";
	self.parser.parser.yy= {
		scope: self.scope,
		eval: function(ast){
			var es = self.normalize(ast, self.scope);
			self.eval(es, self.scope);
			return;
		}
	}

}
X.prototype.start = function(main, argv){
	var self = this;
	var config = self.global.config;

	self.global.argv = argv || [];
	self.tab = path.basename(main).replace(/\.x/, "");
	if(!config.targetDir) 
		config.targetDir = path.dirname(main) + "/" + self.tab;
// first step parse ast
	var ast = self.parse(fs.readFileSync(main).toString());
//	log.i("parse done");
//	log.i(ast);
// then normalize ast
	var es = self.normalize(ast, self.scope);
//	log.i("normalize done");

//	console.log(JSON.stringify(es, function(k, v){if(k == "scope") return;return v;}, 2));


// finally eval 
	var result = self.eval(es, self.scope);
//	log.i("eval done");
	if(self.scope._lang != "lang"){
		self.writefile();
		console.log("Write files:");
		console.log(Object.keys(self.filelist));
	}
//	log.i("writefile done");
}

X.prototype.parse = function(str){
	var self = this;
	if(str == "") return ['hash', {}];
	return self.parser.parse(str);
}
X.prototype.gettype = function(id, scope){
	var self = this;
	if(self.istype(id, "type", scope)) return id;
	var iddef = self.access(id, scope);
	for(var key in iddef.def.deps){
		if(self.istype(key, "type", scope)) return key;
	}
}
X.prototype.istype = function(stc, ttype, scope){
	var self = this;
	var cdd;
	if(typeof stc == "string") cdd = stc;
	else if(stc[2]) cdd = stc[2];
	else cdd = stc[0];

	if(cdd == ttype) return self.access(cdd, scope);;
	var iddef;
	if(stc[0] == "access")
		iddef = self.access(stc, scope);
	else 
		iddef = self.access(cdd, scope);
	if(!iddef) return false;
	if(iddef.type && self.istype(iddef.type, ttype, scope)) return iddef;
	if(iddef.def.deps){
		for(var key in iddef.def.deps){
			if(self.istype(key, ttype, scope))	return iddef;
		}
	}
	return false;
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

X.prototype.normalize = function(ast, scope, nconfig){
	var self = this;
	if(typeof ast != "object") return ast;
	if(!ast) return undefined;
	if(typeof ast[0] !== "string"){
		return self.block(ast, scope);
	}
//	if(!ast || typeof ast != 'object') return ast;
	if(!nconfig) nconfig = {};
	var id = ast[0];
	if(id[0] !== "_"){
		log.e(id);
		process.exit();
	}
	var options = ast[1];
	switch(id){
	case "_main": 
		return ['main', self.normalize(options, scope, {noreturn: 1, main: 1})];
	case "_paragraph": 
		if(!nconfig.main){
			var newscope = {
				_parent: scope,
				_indent: scope._indent + "\t",
				_index: self.scopeIndex
			};
			self.scopes.push(newscope);
			self.scopeIndex ++;
			if(nconfig.newscope){
				for(var key in nconfig.newscope){
					newscope[key] = nconfig.newscope[key];
					newscope[key].defined = 1;
				}
			}
		}else{
			newscope = scope;
		}
		options = self.normalize(options, newscope);
		if(!nconfig.noreturn){
			var ol = options.length - 1;
			if(options[ol][0] != "return")
				options[ol] = ['return', options[ol]];
		}
		return ['paragraph', {content: options, scope: newscope}];
	case "_add": 
		return ['add', self.normalize(options, scope)];
	case "_lt": 
		return ['lt', self.normalize(options, scope)];
	case "_for": 
		return ['for', {
			start: self.normalize(options.start, scope),
			end: self.normalize(options.end, scope),
			inc: self.normalize(options.inc, scope),
			content: self.normalize(options.content, scope, {noreturn: 1})
		}];
	case "_foreach": 
		return ['foreach', {
			array: self.normalize(options.array, scope),
			element: self.normalize(options.element, scope),
			index: self.normalize(options.index, scope),
			content: self.normalize(options.content, scope, {noreturn: 1})
		}];
	case "_if": 
		return ['if', {
			condition: self.normalize(options.condition, scope),
			content: self.normalize(options.content, scope, {noreturn: 1}),
			else: self.normalize(options.else, scope, {noreturn: 1})
		}];
	case "_number": 
		return ['number', options];
	case "_string": 
		return ['string', options];
	case "_array": 
		return ['array', self.normalize(options, scope)];
	case "_definiton": 
		var type = self.gettype(Object.keys(options.deps)[0], scope);
		for(var key in options.args){
			var ok = options.args[key];
			if(ok.default) ok.default = self.normalize(ok.default, scope);
		}
		if(options.content){
			options.content = self.normalize(options.content, scope, {newscope: options.args});
		}
		return [type, options];
	case "_access":
		var param =  {
			id: self.normalize(options[0], scope), 
			property: self.normalize(options[1], scope)
		};
		return ["access", param];
	case "_assign":
		return self.assign(options, scope, nconfig);
	case "_sentence":
		options.content = self.normalize(options.content, scope);
		return self.sentence(options, scope, nconfig);
	default:
		throw "unknown id "+id;
	}
}
X.prototype.access = function(options, scope){
	var self = this;
	if(typeof options == "string"){
		var m = options.match(/^(\S+)\.([^\.]+)$/);
		if(m){
			return self.access(['access', {id : m[1], property: m[2]}], scope);		
		}
		if(scope[options])
			return scope[options];
		var pscope = scope;
		while(pscope._parent){
			pscope = pscope._parent;
			if(pscope[options])
				return pscope[options];
		}
		var iddef = self.getxid(options);
		return iddef;
	}
	if(options[0] != "access"){
		return options;
	}
	var parentdef = self.access(options[1].id, scope);
	if(options[1].property){
		return self.access(options[1].property, parentdef.scope);
	}else{
		return parentdef;
	}
}

X.prototype.load = function(str){
	var self = this;
	var	scope = {
		_parent: self.scope,
		_indent: "",
		_index: self.scopeIndex,
		_lang: "nodejs_code"
	};
	self.scopes.push(scope);
	self.scopeIndex ++;
	var ast = self.parse(str);
	var es = self.normalize(ast, scope);
	var result = self.eval(es, scope);
	return result;
}

X.prototype.getfinalstr = function(str){
	return str.replace(/\*i\*(\s+)\*\*\*/g, "\n$1");
}
X.prototype.getxid = function(id){
	var self = this;
	var config = self.global.config;
	if(idcache[id]){		
		return idcache[id];
	}
	if(id == "root") return {
		def:{}, 
		scope:{}, 
		id: "root"
	};
	var xfile = config.dispDir + "/concept/" + id + ".x";
	if(!fs.existsSync(xfile)){
		return;
	}
//	console.log(xfile);
	var ast = self.parse(fs.readFileSync(xfile).toString());
//	log.i(ast);
	var tmpresult = self.normalize(ast, {});
//['definiton' ,{}]	
	tmpresult.scope = {};
	tmpresult.id = id;
	self.setscope(id, tmpresult, idcache, {islib:1});
	var iddef = self.scope[id] = idcache[id];
	for(var key in iddef.def.deps){
		var parentdef = self.getxid(key);
		for(var key2 in parentdef.def.args){
			if(!iddef.def.args[key2]) 
				iddef.def.args[key2] = parentdef.def.args[key2];
		}
	}
	if(self.istype(id, "class", {})){
		for(var key in iddef.def.args){
			var argdef = iddef.def.args[key];
			if(argdef.type){
				iddef.scope[key] = {
					type: argdef.type,
					scope: {_parent: iddef.scope},
					id: id + "." + key
				}
			}
			if(argdef.default){
				self.setscope(key, argdef.default, iddef.scope);
			}
		}
	}
	return iddef;
}
X.prototype.setscope = function(options, toset, scope, config){
	var self = this;
	if(!config) config = {};
	if(typeof options == "string"){
		
		var t;
		if(!config.islib){
			t = self.access(options, scope);
		}
		if(!t){
			t = scope[options] = {
				scope: {_parent: scope, _index: self.scopeIndex},
				id: options
			};
			self.scopes.push(t.scope);
			self.scopeIndex ++;
		}
		if(!t.def) t.def = toset[1];
		for(var key in config){
			t[key] = config[key];
		}
		if(toset[2]){
			if(!t.type) t.type = toset[2];
// new object must modify scope
			if(self.istype(toset[2], "object", scope)){
//				for(var key in 
//				scope[options].scope
				var classdef = self.access(toset[1].class, scope);
				for(var key in classdef.def.args){
					t.scope[key] = classdef.def.args[key];
				}
			}
		}else{
			if(!t.type) t.type = toset[0];
		}
		return t.scope;
	}
	if(options[0] == "access"){
		if(options[1].property){
			var newscope = self.setscope(options[1].id, [], scope, config);
			self.setscope(options[1].property, toset, newscope, config);
		}else{
			self.setscope(options[1].id, toset, scope, config);
		}
	}
	
}
X.prototype.assign = function(options, scope){
	var self = this;
	var rtn = {};
	var tobeassigned = self.normalize(options[1], scope, {assign: 1});
	var varop = self.normalize(options[0], scope); 
	//['access', {'id': ?}]
	self.setscope(varop, tobeassigned, scope, {local:1});
	return ["assign", [varop, tobeassigned]];
}

X.prototype.sentence = function(options, scope, doconfig){
	if(!doconfig) doconfig= {};
	var self = this;
	var iddef;
	var mainindex = -1;
	if(!options.content.length){
		iddef = self.getxid("hash");
	}else{
		for(var i in options.content){
			var e = options.content[i];
			if((iddef = self.istype(e, "function", scope))){
				mainindex = i;
				break;
			}
		}
	}
	if(!iddef){
		return options.content[0];
		log.e(options);
		throw options;
	}

	if(iddef.type != "function"){
		if(options.content.length > 1) throw "error!!!!!";
		return options.content[0];
	}

	var param = options.config;
	for(var key in param){
		param[key] = self.normalize(param[key]);
	}
	for(var i in options.content){
		if(i == mainindex) continue;
		var ne = options.content[i];
		if(ne){
			var used = 0;
			for(var key in iddef.def.args){
				var arg = iddef.def.args[key];
				if(arg.etc){
					if(!param[key]) param[key] = [];
					param[key].push(ne);
					used = 1;
					break;
				}
				if(param.hasOwnProperty(key)){
					continue;
				}
				if(!arg.type || self.istype(ne, arg.type, scope)){
					param[key] = ne;
					used = 1;
					break;
				}
			}
			if(!used){
				log.i(ne);
				log.i(iddef.id);
				throw "wrong param for function";
			}
		}
	}
	if(iddef.def){
		for(var key in iddef.def.args){
			var arg = iddef.def.args[key];
			if(arg.required && !param[key]) 
				throw "require "+ key;
		}
		if(iddef.def.return) 
			return [iddef.id, param, iddef.def.return];
	}
	return [iddef.id, param];
	
}

X.prototype.writefile = function(){
	var self = this;
	for(var key in self.filelist){
		var tfilename = self.global.config.targetDir + "/" + key;
		var config = self.filelist[key];
		var str = self.getfinalstr(config.content);

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
	if(ast[1] && ast[1].scope) scope = ast[1].scope;
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
	while(pscope._parent){
		pscope = pscope._parent;
		if(pscope._lang){
			rtn = self.gen(ast, pscope._lang, scope);
			if(rtn !== undefined) {
				return rtn;
			}			
		}
	}

	//x
	var idconfig = self.access(id, scope);
	if(idconfig.def.content.length){
		rtn = self.eval(idconfig.def.content, scope);
		return;
	}

}

X.prototype.gen = function(ast, lang, scope, genconfig){
	var self = this;
	var config = self.global.config;
	var id = ast[0];
	if(!genconfig) genconfig = {};
	var rtn;
	var langconfig = self.access(lang, scope);
	var folder = config.dispDir + "/concept/" + id + "/" + lang;
	var extend = {
		eval: function(ast, config){
			if(ast == undefined) return "";
			if(!config) config = {};
			if(typeof ast != "object"){
				if(config.mark) return config.mark+ast +config.mark;
				return ast;
			}
			var tmpscope;
			if(config.lang){
				for(var key in scope){
					tmpscope[key] = scope[key];								
				}
				tmpscope._lang = config.lang;
			}else{
				tmpscope = scope;
			}
			if(typeof ast[0] != "string"){
				var str = "";
				for(var i in ast){
					if(i != 0 && ast.length > 1) str += (config.sep || ", ");
					str += self.eval(ast[i], tmpscope);	
				}
				return str;
			}
			var tmp = self.eval(ast, tmpscope);
			return tmp;
		},
		regfile: function(filename, config){
			if(typeof config == "string")
				config = {content: config};
			return self.regfile(filename, config);;
		},
		addlib: function(filename){
			var iddef = self.getxid(id);
			iddef.import = {local: filename, property: id};
			var libs = self.scope._lib;
			if(!libs[id]) libs[id] = ['render', folder + "/" + filename + ".tt"];
		},
		render: function(config, tscope){
			if(typeof config == "string"){
				config = {file: folder + "/" + config + ".tt"};
			};
			if(!tscope) tscope = scope;
			return tmpl.render({
				file: config.file,
				extend: extend
			}, tscope);
		},
		load: function(str){
			return self.load(str);
		},
		import: function(flag, expr){
			if(!expr) expr = {lib: flag};
			if(typeof expr == "string"){
				var exprtmp = {lib: flag, property: expr};	
				flag = expr;
				expr = exprtmp;
			}
			if(!scope[flag]) scope[flag] = {};
			scope[flag].import = expr;
		},
		super: function(){
			return self.gen(ast, lang, scope, {super:1});
		}
	}
	if(!genconfig.super){
		if(fs.existsSync(folder+".tt")){
			var str = tmpl.render({
				file: folder+".tt",
				extend: extend
			}, {
				id: genconfig.id || ast[0],
				argv: ast[1],
				scope: scope
			});
			if(scope._indent){
				str = str.replace(/\n$/,"").replace(/\n/g, "*i*"+scope._indent+"***");
			}
			return str;
		}
	}
	if(langconfig.def.deps){
		for(var key in langconfig.def.deps){
			if(self.istype(key, "type", scope)) continue;
			var newgenconfig = {notgenparentid: 1};
			if(genconfig.id) newgenconfig.id = genconfig.id;
			if(genconfig.lang) newgenconfig.lang = genconfig.lang;
			rtn = self.gen(ast, key, scope, newgenconfig);
			if(rtn !== undefined) return rtn;
		}
	}
	var idconfig = self.access(id, scope);
	if(!idconfig){
		throw "no id: "+id;
	}
	if(!genconfig.notgenparentid){
		if(idconfig.def){
			for(var key in idconfig.def.deps){
				if(key == "function") continue;
				rtn = self.gen([key, ast[1]], lang, scope, {
					id: genconfig.id || ast[0],
					lang: genconfig.lang || lang
				});
				if(rtn !== undefined) return rtn;
			}
		}

// try generate using lang but failed, using default

		if(idconfig.local){
			return self.eval(["call", {id: ast[0], param: ast[1]}], scope);
		}
		var m = id.match(/^(\S+)\.([^\.]+)$/);
		if(m){
			self.eval([m[1]], scope);
			return self.eval(["call", {id: ast[0], param: ast[1]}], scope);
		}
		log.e("Please implement: concept/" + (genconfig.id || id) + "/"+ (genconfig.lang || lang) +".tt");
			throw "error";
	}
/*
	if(idconfig.local){
//todo call or value or ref etc
		return self.eval(["call", {id: ast[0], param: ast[1]}], scope);
	}else{
		if(idconfig[id] && idconfig[id].content){
			return self.eval(idconfig[id].content);
		}
	}
*/
}
