a = 1;
a;

b = @x:number x;
b 1;

c = @x:number?1 ~number x+1;
c x:1;
b (c);

d = class x:1 @x;
e = new d;
e.x;
f = new d 2;
f.x
