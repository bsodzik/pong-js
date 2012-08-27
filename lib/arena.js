'use strict';

module.exports = function () {
	return {
		players: [],
		status: null,/*getready, start, finished*/
		addPlayer: function (player) {
			this.players.push(player);
		},
		removePlayer: function (player) {
			var idx = this.players.indexOf(player);
			if (idx !== -1) {
				if (idx === 0 || idx === 1) {
					if (this.status === 'getready' || this.status === 'start') {
					console.log('set status to idle');
						this.status = 'idle';
					}
				}
				this.players.splice(idx, 1);
				
			}
		}
	};
};