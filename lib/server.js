'use strict';

var http            = require('http')
  , WebSocketServer = require('websocket').server
  , arenaFactory    = require('./arena')
  , playerFactory   = require('./player')
  , broadcast       = require('./broadcast')
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


wsServer.on('request', function (request) {
	var connection = request.accept('pong', request.origin);
	var playerName = request.resource.substring(1) || 'UnnamedLamer';
	var player = playerFactory.create(playerName, connection);
	players.push(player);

	connection.on('message', function (message) {
		var data = JSON.parse(message.utf8Data);
		//console.log('Received message:',data);

		if (data.type === 'join') {
			var arena = arenas[data.arena];
			arena.addPlayer(player);
		} else if (data.type === 'leave') {
			if (player.arena) {
				player.arena.removePlayer(player);

				var msg = JSON.stringify({ type: 'arenachooser' });
				player.connection.sendUTF(msg);
			}
		} else if (data.type === 'move') {
			player.setY(data.y);
		}
	});

	connection.on('close', function () {
		var playerName = player.name;
		console.log('Disconnecting player ' + playerName + ' from the server!');
		if (player.arena) {
			player.arena.removePlayer(player);
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

arenas.slice(0, 2).forEach(function (arena) {

	setInterval(function () {
		if (arena.status === 'getready' || arena.status === 'start') {
			if (arena.status === 'start') {
				arena.moveBall();
			}

			broadcast(arena.players, {
				type: 'refresh',
				data: arena.getArenaData()
			});
		}
	}, 10);
});

setInterval(function () {
	broadcast(players, buildArenaStateMessage());
}, 10);
