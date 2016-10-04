//Everything is a concept in mind.

//Every concept contains two parts:
// example definition:
 	a = 
   @x:number?1 //  arguments 
	 ~number // return 
	
// implementation:
	a = @x #x  //macron 	 a => x

  a= @x x //function a => a()

  a = 1 //var a => a

  a = \x //reference a => *x


Assign defines a concept.


Type tree:
 concept @ args, return, deps, impl// internally defined
  
//  instance 

  implementation @type, content
   macro
   function
   variable
   reference
   template
  
		 