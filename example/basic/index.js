var a, b, c, d, e, f;
a = 1;
a;
b = function(x){
	return x;
};
b(1);
c = function(x){
	if(x === undefined) x = 1;
	return x+1;
};
c(1);
b(c());
d = function(){
	var self = this;
	self.x = arguments[0];
	if(self.x === undefined) self.x = 1;
};
e = new d();
e["x"];
f = new d(2);
f["x"];
