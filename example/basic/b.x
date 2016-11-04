`set nodejs`
a = 1;
a;

b = @x:number x;
b 1;

c = ~number @x:number?1 x+1;
c x:1;
b (c);

d = &class @x:number?1;
e = d;
e.x;
f = d 2;
f.x
