'use strict';

var http            = require('http')
  , socketIo        = require('socket.io')
  , arenaFactory    = require('./arena')
  , playerFactory   = require('./player')
  , playerType      = require('./playerType')
  , broadcast       = require('./broadcast')
  , httpHandler     = require('./httpHandler')
  , httpServer, wsServer;

httpServer = http.createServer(httpHandler);

wsServer = socketIo.listen(httpServer, {
	transports: ['websocket'],
	heartbeats: true,
	'log level': 1,
	'close timeout': 5
});

httpServer.listen(80, function () {
	console.log('Server is up and running on port 80');
});

var players = [];
var arenas = [
	arenaFactory(), arenaFactory(), arenaFactory(), arenaFactory(),
	arenaFactory(), arenaFactory(), arenaFactory(), arenaFactory()
];

wsServer.sockets.on('connection', function (socket) {
	var player;

	socket.on('login', function (data) {
		var playerName = data.player || 'UnnamedPlayer';
		player = playerFactory(playerName, socket, playerType(data));
		players.push(player);

		console.log("Player '" + playerName + "' (" + player.type + ") from ",
			socket.handshake.address);

		socket.emit('logged', {
			type: player.type
		});
	});
	
	socket.on('message', function (message) {
		var data = JSON.parse(message);

		if (data.type === 'join') {
			var arena = arenas[data.arena];
			arena.addPlayer(player);
		} else if (data.type === 'leave') {
			if (player.arena) {
				player.arena.removePlayer(player);
				player.emit('arenachooser');
			}
		} else if (data.type === 'move') {
			player.setY(data.y);
		}
	});

	socket.on('disconnect', function () {
		if (!player) {
			return; // Player wasn't logged in..
		}
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
		var obj = {
			status: arena.status,
			players: []
		};
		if (arena.players.length) {
			arena.players.forEach(function (player, idx) {
				obj.players.push({
					name: player.name,
					score: (idx < 2 ? player.score : undefined)
				});
			});
		}
		arr.push(obj);
	});
	return arr;
};

(function refresh() {
	arenas.forEach(function (arena) {
		var presenters;
		if (arena.status === 'getready' || arena.status === 'start') {
			if (arena.status === 'start') {
				arena.moveBall();
			}

			presenters = arena.players.filter(function (player) {
				return player.type !== 'tiny';
			}).concat(arena.spectators);
			broadcast(presenters, 'refresh', arena.getArenaData());
		}
	});
	setTimeout(refresh, 15);
})();

(function refreshGeneral() {
	broadcast(players, 'arenastate', buildArenaStateMessage());
	setTimeout(refreshGeneral, 50);
})();
