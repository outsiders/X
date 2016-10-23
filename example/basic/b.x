a = 1;
a;

b = @x:number x;
b 1;

c = ~number @x:number?1 x+1;
c x:1;
b (c);

d = :class @x:number?1;
e = new d;
e.x;
f = new d 2;
f.x
