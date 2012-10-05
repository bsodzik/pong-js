'use strict';
var buffer;

module.exports = buffer = function (length) {
	var arr = [], idx = 0;

	return {
		push: function (val) {
			arr[idx] = val;
			idx = (++idx) % length;
		},
		toArray: function () {
			return arr.slice(idx).concat(arr.slice(0, idx));
		}
	};
};

/*var b = buffer(5);

console.log(b.toArray());

b.push('a');
b.push('b');
b.push('c');

console.log(b.toArray());

b.push('d');
b.push('e');

console.log(b.toArray());

b.push('f');
b.push('g');
b.push('h');

console.log(b.toArray());

b.push('i');
b.push('j');
b.push('k');
console.log(b.toArray());
*/
