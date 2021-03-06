'use strict';

var broadcast = require('./broadcast')
  , ball      = require('./ball');

module.exports = function () {
	// Global space for all arenas..
	var init = [{ x: 10, y: 170 }, {x: 790, y: 170 }];

	return (function () {
		// Arena private space..
		var startGameTimeout = null, setStartTimeout, clearStartTimeout;
		setStartTimeout = function (callback, duration) {
			if (startGameTimeout) {
				clearStartTimeout();
			}
			startGameTimeout = setTimeout(callback, duration);
		};
		clearStartTimeout = function () {
			clearTimeout(startGameTimeout);
			startGameTimeout = null;
		};

		// Return arena object
		return {
			status: null,
			players: [],
			spectators: [],
			ball: ball(),
			addPlayer: function (player) {
				player.arena = this;
				if (player.isSpectator()) {
					this.spectators.push(player);
				} else {
					this.players.push(player);

					if (this.players.length === 2) {
						this.startWarmup();
					}
				}
			},
			removePlayer: function (player) {
				var idx;
				player.arena = null;
				if (player.isSpectator()) {
					idx = this.spectators.indexOf(player);
					if (idx !== -1) {
						this.spectators.splice(idx, 1);
					}
				} else {
					idx = this.players.indexOf(player);
					if (idx !== -1) {
						this.players.splice(idx, 1);

						if (idx === 0 || idx === 1) {
							if (this.status === 'getready' || this.status === 'start') {
								this.endGame('quit', player);
							}
						}
					}
				}
			},
			getUsers: function () {
				return this.players.concat(this.spectators);
			},
			/**
			 * Warmup can be started when there are at least 2 players on the arena.
			 */
			startWarmup: function () {
				this.status = 'getready';
				this.players[0].setPosition(init[0]);
				this.players[1].setPosition(init[1]);
				this.ball.reset();

				broadcast(this.players.slice(0, 2), 'getready');

				setStartTimeout(this.startGame.bind(this), 3000);
			},
			startNextRound: function () {
				var scores = [this.players[0].score, this.players[1].score];

				this.status = 'getready';
				this.ball.reset();

				broadcast(this.getUsers(), 'score', scores);

				setStartTimeout(this.startGame.bind(this), 3000);
			},
			startGame: function () {
				startGameTimeout = null;
				this.status = 'start';
			},
			endGame: function (result, player) {
				var winnerIdx, looserIdx, scores;

				this.status = 'finished';
				clearStartTimeout();

				if (result === 'win') {
					winnerIdx = this.players.indexOf(player);
					looserIdx = -1 * winnerIdx + 1;
					scores = [player.score, this.players[looserIdx].score];
					// Looser goes to the end of list
					player.score = 0;
					this.players[looserIdx].score = 0;
					this.players.push(this.players.splice(looserIdx, 1)[0]);

					broadcast(this.getUsers(), 'win', {
						scores: scores,
						winner: player.name
					});
				} else if (result === 'quit') {
					player.score = 0;
					this.players[0].score = 0;
					broadcast(this.getUsers(), 'quit', {
						name: player.name
					});
				}
				if (this.players.length >= 2) {
					this.startWarmup();
				}
			},
			moveBall: function () {
				this.ball.move(this);
			},
			score: function (scoringPlayer) {
				scoringPlayer.score++;

				if (scoringPlayer.score === 50) {
					this.endGame('win', scoringPlayer);
				} else {
					this.startNextRound();
				}
			},
			getArenaData: function () {
				return {
					ball: {
						x: this.ball.x,
						y: this.ball.y
					},
					playerOne: {
						y: this.players[0].y
					},
					playerTwo: {
						y: this.players[1].y
					}
				};
			}
		};
	})();
};