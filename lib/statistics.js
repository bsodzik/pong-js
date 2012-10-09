'use strict';

var buffer = require('./buffer')
  , emitted = 0, received = 0, users = 0, buf = buffer(50);

module.exports.enable = function (socket) {
	var _emit, _on;

	_emit = socket.emit;
	socket.emit = function () {
		++emitted;
		return _emit.apply(this, arguments);
	};

	_on = socket.on;
	socket.on = function () {
		var _name = arguments[0], _handler = arguments[1];
		arguments[1] = function () {
			if (_name === 'login') {
				++users;
			} else if (_name === 'disconnect') {
				--users;
			}
			++received;
			_handler.apply(this, arguments);
		};
		return _on.apply(this, arguments);
	};
};

module.exports.get = function () {
	return buf.toArray();
};

(function collect() {
	buf.push({
		time: new Date().getTime(),
		emitted: emitted,
		received: received,
		users: users
	});
	emitted = 0;
	received = 0;
	setTimeout(collect, 1000);
})();
