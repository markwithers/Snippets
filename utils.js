module.exports.sieve = function(max) {
	var D = [], primes = []
	for (var q=2; q<max; q++) {
		if (D[q]) {
			for (var i=0; i<D[q].length; i++) {
				 var p = D[q][i]
				 if (D[p+q]) D[p+q].push(p)
				 else D[p+q]=[p]
			}
			delete D[q]
		} else {
			primes.push(q)
			if (q*q<max) D[q*q]=[q]
		}
	}
	return primes
}