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
	self.args = config;
	self.global = {
		config: config,
		main: {}
	};
	self.scope = {
		_indent: "",
		_index: 0,
		_lang: "lang",
		_root: 1,
		_libs: {},
		_deps: {},
		_subs: {}
	};
	self.scopes= [self.scope];
	self.scopeIndex = 1;
	self.src = {};
	self.filelist = {};
	self.filecount = 0;
	self.parser = parser;
	self.tab = "index";

}
X.prototype.addsub = function(ast, key){
	var self = this;
	var sub = self.scope._subs[key];
	if(sub){
		sub.content.push(ast.origin);
		return 1;
	}
}
X.prototype.sub = function(subconfig, dir){
	var self = this;
	var config = self.global.config;
	var newargs = {};
	for(var key in self.args){
		newargs[key] = self.args[key];
	}
	if(dir)
		newargs.targetDir = config.targetDir + "/" +dir;
	else
		newargs.targetDir = config.targetDir;
	var subx = new X(newargs);
	for(var key in subconfig.scope){
		subx.scope[key] = subconfig.scope[key];
	}
	subx.concretize(['_main', ['_paragraph', subconfig.content]]);
}

X.prototype.start = function(main, argv){
	var self = this;
	var config = self.global.config;

	self.global.argv = argv || [];
	self.tab = path.basename(main).replace(/\.x/, "");
// first step parse ast
	var ast = self.parse(fs.readFileSync(main).toString(), self.scope);
//	log.i("parse done")
//	log.i(ast);
// then normalize ast
	if(!config.targetDir) 
		config.targetDir = path.dirname(main) + "/" + self.tab;
	self.concretize(ast);
}
X.prototype.concretize = function(ast){
	var self = this;
	var config = self.global.config;
// finally eval 
	var es = self.normalize(ast, self.scope);
//	log.i("normalize done");

//	console.log(JSON.stringify(es, function(k, v){if(k == "scope") return;return v;}, 2));
	var result = self.eval(es, self.scope);

//	log.i("eval done");
	if(self.scope._lang != "lang"){
		self.writefile(self.filelist, self.global.config.targetDir);
		console.log("Write files:");
		console.log(Object.keys(self.filelist));
	}
//	log.i("writefile done");
}
X.prototype.parse = function(str, scope){
	var self = this;
	if(str == "") return ['hash', {}];

	self.parser.parser.yy= {
		scope: scope,
		eval: function(ast){
// TODO eval as lang not scope._lang
			var es = self.normalize(ast, scope);
			return self.eval(es, scope);
		}
	}
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
	if(!iddef.def) return false;
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
	if(!nconfig) nconfig = {};
	if(typeof ast != "object") return ast;
	if(!ast) return undefined;
	if(typeof ast[0] !== "string"){
		return self.block(ast, scope);
	}
	if(ast[0][0] !== "_"){
		log.e(ast);
		process.exit();
	}
	var rtn = self.subnormalize(ast, scope, nconfig);
	rtn.origin = ast;
	return rtn;
}
X.prototype.subnormalize = function(ast, scope, nconfig){
	var self = this;
	var id = ast[0];
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
	case "_op": 
		return [
			options[0], {
				left: self.normalize(options[1], scope),
				right: self.normalize(options[2], scope)
			}
		];
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
		var rtn = {
			args: {},
			deps: options.deps,
			rtn: options.rtn
		};
		for(var key in options.args){
			var ok = options.args[key];
			var t = rtn.args[key] = {};
			t.type = ok.type;
			t.etc = ok.etc;
			t.static = ok.static;
			if(ok.default) t.default = self.normalize(ok.default, scope);
		}
		if(options.content){
			rtn.content = self.normalize(options.content, scope, {newscope: options.args});
		}
		return [type, rtn];
	case "_access":
		var param =  {
			id: self.normalize(options[0], scope), 
			property: self.normalize(options[1], scope)
		};
		self.access(["access", param], scope);
		return ["access", param];
	case "_assign":
		return self.assign(options, scope, nconfig);
	case "_sentence":
		return self.sentence(options, scope, nconfig);
	default:
		throw "unknown id "+id;
	}
}
X.prototype.newscope = function(key, scope, config){
	var self = this;
	if(!config) config = {id: key};
	if(!config.id) config.id = key;
	var newscope = scope[key] = {
		scope: {_parent: scope, _index: self.scopeIndex}
	}
	for(var key in config){
		newscope[key] = config[key];
	}
	self.scopes.push(newscope.scope);
	self.scopeIndex ++;
	return newscope;
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
		var iddef = self.getxid(options, scope);
		if(iddef)
			return iddef;
		return self.newscope(options, scope);
	}
	if(options[0] != "access"){
		return options;
	}

	var parentdef = self.access(options[1].id, scope);
	if(options[1].property){
		if(!parentdef.scope) {
			log.i(options);
			log.e(parentdef);
			process.exit();
		}
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
		_lang: "nodejs_code",
		_root: 1
	};
	self.scopes.push(scope);
	self.scopeIndex ++;
	var ast = self.parse(str, scope);
	var es = self.normalize(ast, scope);
	var result = self.eval(es, scope);
	return result;
}

X.prototype.getfinalstr = function(str){
	return str.replace(/\*i\*(\s+)\*\*\*/g, "\n$1");
}
X.prototype.getxid = function(id, scope){
	var self = this;
	var config = self.global.config;
	if(!scope) scope = self.scope;
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
	var ast = self.parse(fs.readFileSync(xfile).toString(), scope);
//	log.i(ast);
	var tmpresult = self.normalize(ast, {});
//['definiton' ,{}]	
	if(tmpresult[0] == "main"){
		//TODO real object concept
	}else{
		self.setscope(id, tmpresult, idcache, {islib:1});
	}
	var iddef = self.scope[id] = idcache[id];
	for(var key in iddef.def.deps){
		var parentdef = self.getxid(key, scope);
		for(var key2 in parentdef.def.args){
			if(!iddef.def.args[key2]) 
				iddef.def.args[key2] = parentdef.def.args[key2];
		}
	}
	if(self.istype(id, "class", {})){
		for(var key in iddef.def.args){
			var argdef = iddef.def.args[key];
			if(argdef.static){
				self.newscope(key, iddef.scope, {id: id + "." + key});
				if(argdef.default){
					self.setscope(key, argdef.default, iddef.scope);
				}
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
				var classdef = self.access(toset[2][1].class, scope);
				for(var key in classdef.def.args){
					var argdef = classdef.def.args[key];
					var tar = {
						id: classdef.id + "." + key,
						objectid: options + "." + key,
						object: t
					};
					if(argdef.type) tar.type = argdef.type;
					self.newscope(key, t.scope, tar);
					if(argdef.default){
						self.setscope(key, argdef.default, t.scope);
					}
				}
			}
		}else{
			if(!t.type) t.type = toset[0];
		}
		return t.scope;
	}
	if(options[0] == "access"){
		if(options[1].property){
			var idscope = self.setscope(options[1].id, [], scope, config);
			self.setscope(options[1].property, toset, idscope, config);
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
	var content = self.normalize(options.content, scope);
	if(!content.length){
		iddef = self.getxid("hash", scope);
	}else{
		for(var i in content){
			var e = content[i];
			if((iddef = self.istype(e, "function", scope))){
				mainindex = i;
				break;
			}
		}
	}
	if(!iddef){
		return content[0];
		log.e(options);
		throw options;
	}
	
	if(mainindex == -1){
		if(content.length == 1){
			return content[0];
		}
	}
	var param = {};
	for(var key in options.config){
		param[key] = self.normalize(param[key], scope);
	}

	for(var i in content){
		if(i == mainindex) continue;
		var ne = content[i];
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
		if(self.istype(iddef.type, "class", scope)){
	//		param._object = 
			return [iddef.id, param, ["object", {
				class: iddef.id
			}]];
		}else if(iddef.def.return){
			return [iddef.id, param, iddef.def.return];
		}
	}
	if(iddef.object){
		for(var key in iddef.object.def){
			if(!param[key])
				param[key] = iddef.object.def[key];
		}
		param.object = iddef.object.id;
	}
	return [iddef.id, param];
	
}

X.prototype.writefile = function(filelist, prefix){
	var self = this;
	for(var key in filelist){
		var tfilename = prefix + "/" + key;
		var config = filelist[key];
		if(config.sub){
			self.eval(self.scope._subs[config.sub]);
		}else{
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
}
X.prototype.regfile = function(filename, config){
	var self = this;
	var rfile = path.relative(".", filename);
	if(typeof config == "string")
		config = {content: config};
	if(!self.filelist[rfile]){
		self.filelist[rfile] = {};
	}
	var tar = self.filelist[rfile];
	if(!tar.content)
		tar.content = "";
	if(config.content){
		tar.content += config.content;		
	}
	if(config.subs){
		tar.subs = config.subs;
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
	if(typeof ast != "object") {log.e(ast); process.exit()}
	if(typeof ast[0] !== "string"){
		if(!libObject.isArray(ast)) {log.e(ast); process.exit()}
		var newarr = [];
		for(var i in ast){
			newarr[i] = self.eval(ast[i], scope);
		}
		return newarr;
	}

	var id = ast[0];
	
	if(!ast[1] && idcache[id]){
		console.log("repeat load "+id);
		return "";
	}

	if(ast[1]){
		if(ast[1].object){
			if(self.addsub(ast, ast[1].object)) return "";
		}
		if(ast[1].scope) scope = ast[1].scope;
	}
//	if(self.internal[id]) return self.internal[id](ast[1], scope);
	var config = self.global.config;
	//this lang
	if(scope._lang){
		rtn = self.gen(ast, scope._lang, scope, {fromeval: 1});
		if(rtn !== undefined) {
			return rtn;
		}
	}
	//parent lang
	var pscope = scope;
	while(pscope._parent){
		pscope = pscope._parent;
		if(pscope._lang){
			rtn = self.gen(ast, pscope._lang, scope, {fromeval: 1});
			if(rtn !== undefined) {
				return rtn;
			}			
		}
	}

	//x TODO
	var idconfig = self.access(id, scope);
	if(idconfig.def.content.length){
		rtn = self.eval(idconfig.def.content, scope);
		return rtn;
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
//	if(genconfig.fromeval) console.log("new");
//	console.log("!"+lang+" " +id + " "+genconfig.lang + " "+genconfig.id);
//	console.log(ast);
	var extend = {
		access: function(ast){
			return self.access(ast, scope);
		},
		sub: function(subconfig, dir){
			self.sub(subconfig, dir);
		},
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
					var toadd = self.eval(ast[i], tmpscope);	
					if(typeof toadd != "string") return toadd;
					str += toadd;
				}
				return str;
			}
			var tmp = self.eval(ast, tmpscope);
			return tmp;
		},
/*
		paragraph: function(ast, config){
			var tmpscope;
			if(config.lang){
				for(var key in scope){
					tmpscope[key] = scope[key];								
				}
				tmpscope._lang = config.lang;
			}else{
				tmpscope = scope;
			}
			var tmp = self.eval(ast, tmpscope);
			return tmp;
		},
*/
		regfile: function(filename, config){
			return self.regfile(filename, config);;
		},
		istype: function(stc, ttype){
			return self.istype(stc, ttype, scope);
		},
		addlib: function(filename){
			var iddef = self.getxid(id, scope);
			iddef.import = {local: filename, property: id};
			var libs = self.scope._libs;
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
		load: function(config){
			var str;
			if(typeof config == "string"){
				str = config;
			}else if(config.file){
				str = fs.readFileSync(folder + "/" + config.file + ".x").toString();
			}
			return self.load(str);
		},
		import: function(config){
			if(typeof config == "string"){
				config = {lib: config}
			}
			if(!config.var){
				if(config.property) config.name = config.property;
				else if(config.lib) config.name = config.lib;
				else throw "not defined config.name";
			}
			if(!scope[config.name]) scope[config.name] = {};
			scope[config.name].import = config;
			if(config.lib){
				self.scope._deps[config.lib] = 1;
			}
		},
		regsub: function(iddefx, t){
			self.scope._subs[iddefx.id] = t;
			t.name = iddefx.id;
		},
		addsub: function(astx, idx){
			self.addsub(astx, idx);
		},
		newsub: function(config){
			if(!config) config = {};
			var c = config.class || id;			
			var cdef = self.getxid(c, scope);
			var rtn = {
				_class: c,
				scope: {
					_lang: config.lang
				},
				content: []
			}
			if(cdef.scope.defaultlang)
				rtn.scope._lang = cdef.scope.defaultlang.def;
			return rtn;
		},
		getobj: function(config){
			if(typeof config == "string")
				config = {class: config};
			return self.scope._subs[config.class].list;
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
				id: genconfig.id || id,
				argv: ast[1],
				scope: scope,
				ast: ast
			});
			if(scope._indent){
				str = str.replace(/\n$/,"").replace(/\n/g, "*i*"+scope._indent+"***");
			}
//			console.log("!!"+lang+" " +id + " "+genconfig.lang + " "+genconfig.id);
//			console.log(str);
			return str;
		}
	}
	if(langconfig.def){
		for(var key in langconfig.def.deps){
			if(self.istype(key, "type", scope)) continue;
			rtn = self.gen(ast, key, scope, {
				notextendid: 1,
				id: genconfig.id || id,
				lang: genconfig.lang || lang
			});
			if(rtn !== undefined) return rtn;
		}
	}
/*
	if(genconfig.lang && genconfig.lang != lang){
		var plangconfig = self.access(genconfig.lang, scope);
		if(langconfig.def){
			for(var key in plangconfig.def.deps){
				if(self.istype(key, "type", scope)) continue;
				rtn = self.gen(ast, key, scope, {
					notextendid: 1,
					skip: lang,
					id: genconfig.id || id,
					lang: genconfig.lang || lang
				});
				if(rtn !== undefined) return rtn;
			}
		}		
	}
*/

	var m = id.match(/^(\S+)\.([^\.]+)$/);
// for md5 TODO modify
	if(m){
		self.eval([m[1]], scope);
	}	
	var iddef;
	if(m && ast[1].object)
		iddef	= self.access(ast[1].object +"."+m[2], scope);		
	else
		iddef	= self.access(id, scope);
	if(!iddef){
		throw "no id: "+id;
	}
	if(!genconfig.notextendid){
		if(iddef.def){
			for(var key in iddef.def.deps){
				if(key == "function" || key == "class") continue;
				rtn = self.gen([key, ast[1]], genconfig.lang || lang, scope, {
					id: genconfig.id || id,
					lang: genconfig.lang || lang
				});
				if(rtn !== undefined) return rtn;
			}
		}
// try generate using lang but failed, using default
		if(iddef.local || m){
			if(self.istype(iddef.type, "class", {})){
				return self.eval(["new", {class: ast[0], param: ast[1]}], scope);
			}
			if(self.istype(iddef.type, "function", {})){
				if(iddef.objectid){
					return self.eval(["call", {id: iddef.objectid, param: ast[1]}], scope);
				}
				return self.eval(["call", {id: ast[0], param: ast[1]}], scope);
			}
		}
		log.e("Please implement: concept/" + (genconfig.id || id) + "/"+ (genconfig.lang || lang) +".tt");
			throw "error";
	}
/*
	if(iddef.local){
//todo call or value or ref etc
		return self.eval(["call", {id: ast[0], param: ast[1]}], scope);
	}else{
		if(iddef[id] && iddef[id].content){
			return self.eval(iddef[id].content);
		}
	}
*/
}
