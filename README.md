PongJS multiplayer game
=======

The game server is created in Node.js. To start it, run ``npm start`` from main directory.

Client is created as HTML application. It uses WebSockets, so modern browser is required.

To connect as regular player use URL ``http://localhost``.

To connect as spectator use URL ``http://localhost/spectator``.

To monitor server statistics use URL ``http://localhost/statistics``.

TODO:
- use ``webmake`` to organize client code
- use ``domjs`` to build html content
- implement 'jedi' mode :)

Known bugs:
In Opera Mobile touchemove event blocks JS execution (setTimeout's are not invoked). Reported with id 13299@bugs.opera.com