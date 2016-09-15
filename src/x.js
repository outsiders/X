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
function X(config){
	var self = this;
	if(!config) config = {};
	self.keyCounts = {};//for default instance
	self.deps = {};
	if(!config.dispDir) config.dispDir = path.resolve(__dirname + "/..");
	if(!config.projectDir) config.projectDir = ".";
	if(!config.baseDir) config.baseDir = config.projectDir;
	if(!config.deps) config.deps = {};
	self.funcs = {};
	self.global = {
		config: config,
		main: {},
		ns: {}
	};
	self.src = {};
	self.filelist = {};
	self.parser = parser;
	self.parser.parser.yy= {
		gettype: function(id){
			return self.gettype(id);
		},
		compile: function(ast){
			var yy = this;
			if(!yy.lang) yy.lang = "nodejs";
			return self.compile(ast, yy);
		},
		normalize: function(arr){
			return self.normalize(arr);
		},
		ns: self.global.ns
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
	self.global.argv = argv || [];
	var rtn = self.parse(fs.readFileSync(main).toString());
	return self.eval(rtn);
}
X.prototype.normalize= function(arr){
	console.log(arr);
	return arr;
}
X.prototype.compile= function(ast, yy){
	self = this;
//call by parser

//	console.log(yy);
	return ast;
}
X.prototype.convert = function(ast){
	var self = this;
	switch(ast.type){
	case "hash":
		var hash = {};
		for(var key in ast.value){
			hash[key] = self.convert(ast.value[key]);
		}
		return hash;
	case "array": 
		var array = [];
		for(var i in ast.value){
			array[i] = self.convert(ast.value[i]);
		}
		return array;
	case "string":
	case "number":
		return ast.value;
	case "null":
		return null;
	default:
		return undefined;
	}

}
X.prototype.impl = function(scope){
	var self = this;
	console.log(scope);
	return scope;
}
X.prototype.eval = function(ast){
	var self = this;
	var rtn;
	for(var i in ast){
		var e = ast[i];
		rtn = self.impl(e[0], e[1]);
	}
	console.log(JSON.stringify(ast,undefined,2));
	return rtn;
}
X.prototype.parse = function(str){
	var self = this;
	return self.parser.parse(str);
}
X.prototype.loadfunc = function(id){
	var self = this;
	var config = self.global.config;
	if(self.funcs[id]) return self.funcs[id];
	var xFile = config.dispDir + "/func/" + id + ".x";
	var json;
	if(fs.existsSync(xFile))
		 return self.funcs[id] = self.parse(fs.readFileSync(xFile).toString());

	return;
	throw "File not exists: " +xFile;
}
X.prototype.gettype = function(id){
	var self = this;
	var config = self.global.config;
	if(self.internal[id])
		return "FUNCTIONID";
	var func = self.loadfunc(id);
//TODO write global
	if(func) {
		return "FUNCTIONID";
	}
	return "NEWID";
	

	return "LEFTOPERATORID"
	return "RIGHTOPERATORID"

}
