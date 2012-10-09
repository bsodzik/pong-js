PongJS multiplayer game
=======

The game server is created in Node.js. To start it, run ``npm start`` from main directory.

Client is created as HTML application. It uses WebSockets, so modern browser is required.

To connect as regular player use ``http://localhost url``.

To connect as spectator use ``http://localhost/spectator``.

To monitor server statistics use ``http://localhost/statistics``.


Known bugs:
In Opera Mobile touchemove event blocks JS execution (setTimeout's are not invoked). Reported with id 13299@bugs.opera.com