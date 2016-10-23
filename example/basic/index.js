var a, b, c, d, x;
console.log("a");
a = "x";
console.log(a);
b = function(x){
	var y, z;
	y = 1;
	z = 2;
	return x+y+z;
};
b(1);
b(1);
c = function(){
	var self = this;
	self.x = arguments[0];
	if(self.x === undefined) self.x = 1;
};
d = new c(1);
d["x"];
d["x"];
d[a];
for(x = 1;x < 3;x = x+1){
	console.log(x);
	x = x+1;
};
