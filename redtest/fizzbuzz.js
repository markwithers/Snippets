for (counter = 1; counter <= 20; counter ++) {
	if (counter % 3 === 0 & counter % 5 === 0 )	{
		console.log( "FizzBuzz"); 
	}
	
	if (counter % 3 === 0) {
		console.log( "Fizz");
	}
	else {
		if (counter % 5 === 0) {
			console.log("Buzz");
		}
		
		else {
			console.log(counter)
		}
	}
}