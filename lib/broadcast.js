'use strict';

module.exports = function (receivers, obj) {
	// TODO: Check if obj is not already a string..
	var message = JSON.stringify(obj);
	receivers.forEach(function (receiver) {
		receiver.connection.sendUTF(message);
	});
};
