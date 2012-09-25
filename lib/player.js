'use strict';

var yMin = 20, yMax = 380;

module.exports = function (playerName, socket) {
	return {
		name: playerName,
		socket: socket,
		score: 0,
		x: undefined,
		y: undefined,
		setY: function (y) {
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
		sendObject: function (obj) {
			this.socket.send(JSON.stringify(obj));
		}
	};
};