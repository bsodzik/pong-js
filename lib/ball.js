'use strict';

var init = {
	x: 400, y: 200,
	xDirection: 1.6, yDirection: 1.0,
	xDelta: -1.1, yDelta: 1.1,
	xMin: 12, xMax: 788, yMin: 0, yMax: 400,
	paddDelta: 33
};

module.exports = function () {
	return {
		x: init.x,
		y: init.y,
		xDirection: init.xDirection,
		yDirection: init.yDirection,
		setPosition: function (pos) {
			this.x = pos.x;
			this.y = pos.y;
		},
		move: function (arena) {
			// Check top - down borders
			if (this.yDirection > 0 && this.y >= init.yMax) {
				this.y = init.yMax;
				this.yDirection *= -1;
			} else if (this.yDirection < 0 && this.y <= init.yMin) {
				this.y = init.yMin;
				this.yDirection *= -1;
			}

			// Check left - right borders
			if (this.xDirection > 0 && this.x >= init.xMax) {
				if ((this.y >= arena.players[1].y - init.paddDelta) && (this.y <= arena.players[1].y + init.paddDelta)) {
					this.xDirection *= init.xDelta;
					this.yDirection *= init.yDelta;
				} else {
					arena.score(arena.players[0]);
					return;
				}
			} else if (this.xDirection < 0 && this.x <= init.xMin) {
				if ((this.y >= arena.players[0].y - init.paddDelta) && (this.y <= arena.players[0].y + init.paddDelta)) {
					this.xDirection *= init.xDelta;
					this.yDirection *= init.yDelta;
				} else {
					arena.score(arena.players[1]);	
					return;
				}
			}
			this.x += this.xDirection;
			this.y += this.yDirection;
		},
		reset: function () {
			this.x = init.x;
			this.y = init.y;
			this.xDirection = (this.xDirection > 0 ? init.xDirection : -init.xDirection);
			this.yDirection = (this.yDirection > 0 ? init.yDirection : -init.yDirection);
		}
	};
};
