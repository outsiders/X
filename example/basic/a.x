`set nodejs`
print "a";
a = "x";
print a;
b = @x:number {y=1;z=2;x+y+z};
b 1;
b x:1;
c = &class @x:number?1;
d = c 1;
d.x;
d["x"];
d[a];
for (x=1;x<3;x+=1) {
print x;
x += 1;
};
for x 1,2,3 print x;
if x print x;
if a print a else print b;
