var reverse = function(str){
	if (str == ''){
		return str
	}
	else {
		return reverse(str.substring(1)) + str[0]
	}
}

var factorial = function(num){
	if (num == 0){
		return 1;
	}
	else {
		return factorial(num - 1) * num
	}
}

console.log(reverse('bolton'))
console.log(factorial(6))