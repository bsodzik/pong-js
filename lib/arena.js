'use strict';

var broadcast = require('./broadcast')
  , ball      = require('./ball');

var init = [{ x: 10, y: 180 }, {x: 790, y: 180 }];

module.exports = function () {
	return {
		status: null,/*getready, start, finished*/
		players: [],
		ball: ball(),
		addPlayer: function (player) {
			player.arena = this;
			this.players.push(player);
		},
		removePlayer: function (player) {
			player.arena = null;
			var idx = this.players.indexOf(player);
			if (idx !== -1) {
				this.players.splice(idx, 1);

				if (idx === 0 || idx === 1) {
					if (this.status === 'getready' || this.status === 'start') {
						if (this.players.length >= 2) {
							this.startWarmup();
						} else {
							this.endGame();
						}
					}
				}
			}
		},
		/**
		 * Warmup can be started when there are at least 2 players on the arena.
		 */
		startWarmup: function () {
			this.status = 'getready';
			this.players[0].setPosition(init[0]);
			this.players[1].setPosition(init[1]);
			this.ball.reset();

			broadcast(this.players.slice(0, 2), {
				type: 'getready',
				data: [this.players[0].name, this.players[1].name]
			});

			setTimeout(function () {
				this.startGame();
			}.bind(this), 3000);
		},
		startNextRound: function () {
			this.status = 'getready';
			this.players[0].setPosition(init[0]);
			this.players[1].setPosition(init[1]);
			this.ball.reset();

			broadcast(this.players, {
				type: 'score',
				scores: [this.players[0].score, this.players[1].score]
			});

			setTimeout(function () {
				this.status = 'start';
			}.bind(this), 3000);
		},
		startGame: function () {
			this.status = 'start';
		},
		endGame: function (status) {
			this.status = 'idle';
		},
		moveBall: function () {
			this.ball.move(this);
		},
		score: function (scoringPlayer) {
			var winnerIdx = this.players.indexOf(scoringPlayer);
			var looserIdx = (++winnerIdx) % 2;

			scoringPlayer.score++;

			if (scoringPlayer.score === 10) {
				this.endGame();
				// Looser goes to the end of list
				this.players.push(this.players.splice(looserIdx, 1)[0]);

				broadcast(this.players, {
					type: 'win',
					scores: [this.players[0].score, this.players[1].score],
					winner: scoringPlayer.name
				});
			} else {
				this.startNextRound();
			}
		}
	};
};