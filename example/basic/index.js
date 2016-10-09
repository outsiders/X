var a;
a = 1;
console.log(a);
var b;
b = function(x){
	return x;
};
b(1);
var c;
c = function(x){
	if(x === undefined) x = 1;
	return x+1;
};
c(1);
b(c());
var d;
d = function(x){
	var self = this;
	self.x = x;
	if(self.x === undefined) self.x = 1;
};
var e;
e = new d();
console.log(e["x"]);
var f;
f = new d(2);
console.log(f["x"]);
