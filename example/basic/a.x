print "a";
a = "x";
print a;
b = @x:number {y=1;z=2;x+y+z};
b 1;
b x:1;
c = :class @x:number?1;
d = new c 1;
d.x;
d["x"];
d[a]
