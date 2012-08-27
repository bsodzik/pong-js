'use strict';

var fs              = require('fs')
  , http            = require('http')
  , WebSocketServer = require('websocket').server
  , arenaFactory    = require('./arena')
  , httpHandler     = require('./httpHandler')
  , httpServer, wsServer;

httpServer = http.createServer(httpHandler);

httpServer.listen(8888, function () {
	console.log('Server is up and running on port 8888');
});

wsServer = new WebSocketServer({
	httpServer: httpServer,
	autoAcceptConnections: false
});


var players = [];

var arenas = [arenaFactory(), arenaFactory(), arenaFactory(), arenaFactory()];

//var status = 'idle';

wsServer.on('request', function (request) {
	var connection = request.accept('pong', request.origin);
	var playerName = request.resource.substring(1) || 'UnnamedLamer';
	var player = {
		name: playerName,
		connection: connection,
		score: 0,
		sendObject: function (obj) {
			this.connection.sendUTF(JSON.stringify(obj));
		}
	};
	players.push(player);

	connection.on('message', function (message) {
		var data = JSON.parse(message.utf8Data);
		//console.log('Received message:',data);

		if (data.type === 'join') {
			console.log('joining arena 0', data);

			player.arena = arenas[data.arena];
			player.arena.addPlayer(player);

			if (player.arena.players.length === 2) {
				player.arena.status = 'getready';
				var msg = JSON.stringify({ 
					type: 'getready',
					data: [player.arena.players[0].name, player.arena.players[1].name]
				});
				player.arena.players[0].x = 10;
				player.arena.players[0].y = 180;
				player.arena.players[1].x = 790;
				player.arena.players[1].y = 180;
				
				player.arena.players.slice(0, 2).forEach(function (player) {
					player.connection.sendUTF(msg);
				});
				setTimeout(function () {
					player.arena.status = 'start';
				}, 3000);
			}
		} else if (data.type === 'leave') {
		console.log('leaving');
			if (player.arena) {
				player.arena.removePlayer(player);
				console.log('arena',player.arena);
				player.arena = null;
				
				var msg = JSON.stringify({ type: 'arenachooser' });
				player.connection.sendUTF(msg);
			}
		} else if (data.type === 'move') {
			player.y = data.y;
		}
	});

	connection.on('close', function () {
		var playerName = player.name;
		console.log('Disconnecting player ' + playerName + ' from the server!');
		if (player.arena) {
			player.arena.removePlayer(player);
			player.arena = null;
		}
		var index = players.indexOf(player);
		if (index !== -1) {
			players.splice(index, 1);
			player = null;
		}
		console.log('Player ' + playerName + ' disconnected from the server!');
	});
});

var buildArenaStateMessage = function () {
	var arr = [];
	arenas.forEach(function (arena) {
		var players = [];
		if (arena.players.length) {
			arena.players.forEach(function (player, idx) {
				players.push({
					name: player.name,
					score: (idx < 2 ? player.score : undefined)
				});
			});
		}
		arr.push(players);
	});
	return {
		type: 'arenastate',
		data: arr
	};
};














var ball = {
	x: 400,
	y: 200
};
var xDirection = 1, yDirection = 1;

var broadcast = function (receivers, obj) {
	var message = JSON.stringify(obj);
	receivers.forEach(function (receiver) {
		receiver.connection.sendUTF(message);
	});
};

var score = function (arena, playerIdx) {
	var scoringPlayer = arena.players[playerIdx];
	scoringPlayer.score++;

	ball.x = 400;
	ball.y = 200;

	if (scoringPlayer.score === 10) {
		arena.status = 'finished';
		// Looser goes to the end of list
		arena.players.push(arena.players.splice((++playerIdx) % 2, 1)[0]);
		broadcast(arena.players, {
			type: 'win',
			scores: [arena.players[0].score, arena.players[1].score],
			winner: scoringPlayer.name
		});
	} else {
		arena.status = 'getready';
		broadcast(arena.players, {
			type: 'score',
			scores: [arena.players[0].score, arena.players[1].score]
		});

		setTimeout(function () {
			arena.status = 'start';
		}, 3000);
	}
};

arenas.slice(0, 2).forEach(function (arena) {

	setInterval(function () {
		var data = {
			ball: ball,
			playerOne: {},
			playerTwo: {}
		};
		
		if (arena.status === 'getready' || arena.status === 'start') {
			if (arena.players[0].y < 20) {
				data.playerOne.y = 20;
			} else if (arena.players[0].y > 380) {
				data.playerOne.y = 380;
			} else {
				data.playerOne.y = arena.players[0].y;
			}

			if (arena.players[1].y < 20) {
				data.playerTwo.y = 20;
			} else if (arena.players[1].y > 380) {
				data.playerTwo.y = 380;
			} else {
				data.playerTwo.y = arena.players[1].y;
			}
		}

		if (arena.status === 'start') {
			if (yDirection > 0 && ball.y >= 400) {
				ball.y = 400;
				yDirection *= -1;
			} else if (yDirection < 0 && ball.y <= 0) {
				ball.y = 0;
				yDirection *= -1;
			}

			if (xDirection > 0 && ball.x >= 788) {
				if ((ball.y >= data.playerTwo.y - 20) && (ball.y <= data.playerTwo.y + 20)) {
					xDirection *= -1;
					xDirection -= 0.4;
				} else {
					score(arena, 0);
					return;
				}
			} else if (xDirection < 0 && ball.x <= 12) {
				if ((ball.y >= data.playerOne.y - 20) && (ball.y <= data.playerOne.y + 20)) {
					xDirection *= -1;
					xDirection += 0.4;
				} else {
					score(arena, 1);
					return;
				}
			}
			ball.x = ball.x + xDirection;
			ball.y = ball.y + yDirection;
		}

		broadcast(arena.players, {
			type: 'refresh',
			data: data
		});
	}, 10);

});

setInterval(function () {
	broadcast(players, buildArenaStateMessage());
}, 10);