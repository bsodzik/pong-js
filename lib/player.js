'use strict';

var yMin = 20, yMax = 380;

module.exports = function (playerName, socket, type) {
	return {
		name: playerName,
		socket: socket,
		type: type,
		score: 0,
		x: undefined,
		y: undefined,
		setY: function (y) {
			if (this.type === 'tiny') { // Scale position
				y = (y * 4);
			}
			if (y < yMin) {
				this.y = yMin;
			} else if (y > yMax) {
				this.y = yMax;
			} else {
				this.y = y;
			}
		},
		setPosition: function (pos) {
			this.x = pos.x;
			this.y = pos.y;
		},
		emit: function (name, obj) {
			this.socket.emit(name, obj);
		}
	};
};