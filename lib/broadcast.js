'use strict';

module.exports = function (receivers, name, obj) {
	receivers.forEach(function (receiver) {
		receiver.emit(name, obj);
	});
};
