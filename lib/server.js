'use strict';

var http            = require('http')
  , socketIo        = require('socket.io')
  , arenaFactory    = require('./arena')
  , playerFactory   = require('./player')
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
	arenaFactory(), arenaFactory(), arenaFactory(), arenaFactory()/*,
	arenaFactory(), arenaFactory(), arenaFactory(), arenaFactory()*/
];

wsServer.sockets.on('connection', function (socket) {
	
	// TODO: Probably there will be additional message with client data
	// var playerName = request.resource.substring(1) || 'UnnamedLamer';
	var playerName = 'bsod';
	var player = playerFactory(playerName, socket);
	players.push(player);

	console.log("Player connected: " + playerName + " from " + request.remoteAddress);

	socket.on('message', function (message) {
		// console.log('Received message:',message);
		var data = JSON.parse(message);

		if (data.type === 'join') {
			var arena = arenas[data.arena];
			arena.addPlayer(player);
		} else if (data.type === 'leave') {
			if (player.arena) {
				player.arena.removePlayer(player);

				var msg = JSON.stringify({ type: 'arenachooser' });
				player.socket.send(msg);
			}
		} else if (data.type === 'move') {
			player.setY(data.y);
		}
	});

	socket.on('disconnect', function () {
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
	return {
		type: 'arenastate',
		data: arr
	};
};

(function refresh() {
	arenas.forEach(function (arena) {
		if (arena.status === 'getready' || arena.status === 'start') {
			if (arena.status === 'start') {
				arena.moveBall();
			}
			broadcast(arena.players, {
				type: 'refresh',
				data: arena.getArenaData()
			});
		}
	});
	setTimeout(refresh, 15);
})();

setInterval(function () {
	broadcast(players, buildArenaStateMessage());
}, 50);
