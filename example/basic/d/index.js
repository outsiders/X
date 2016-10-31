var c, d;
c = function(){
	var self = this;
	self.x = arguments[0];
};
d = new c(1);
d["x"];
