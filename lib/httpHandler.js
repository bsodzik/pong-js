'use strict';

var fs    = require('fs')
  , http  = require('http')
  , stats = require('./statistics')
  , handleFile;

module.exports = function (request, response) {
	var url = request.url;

	// Request for statistics
	if (url === '/stats') {
		response.writeHead(200, { 'Content-Type': 'application/json' });
		response.end(JSON.stringify(stats.get()), 'utf-8');

	// Resolve favicon
	} else if (url === '/favicon.ico') {
		handleFile('public' + url, 'image/x-icon', response);

	// Resolve public css files
	} else if (/\/c\/.*\.css/.exec(url)) {
		handleFile('public' + url, 'text/css', response);

	// Resolve public js files
	} else if (/\/j\/.*\.js/.exec(url)) {
		handleFile('public' + url, 'text/javascript', response);
	
	} else if (url === '/statistics') {
		handleFile('public/statistics.html', 'text/html', response);

	} else if (url === '/jedi') {
		handleFile('public/jedi.html', 'text/html', response);

	// Return application page
	} else {
		handleFile('public/index.html', 'text/html', response);
	}
};

handleFile = function (path, contentType, response) {
	fs.readFile(path, function (error, content) {
		if (error) {
			console.error(error);
			response.writeHead(500);
			response.end();
		} else {
			response.writeHead(200, { 'Content-Type': contentType });
			response.end(content, 'utf-8');
		}
	});
};
