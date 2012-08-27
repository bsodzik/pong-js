'use strict';

var fs   = require('fs')
  , http = require('http');

module.exports = function (request, response) {
	var url = request.url;

	// Resolve public css files
	if (/\/c\/.*\.css/.exec(url)) {
		fs.readFile('public' + url, function (error, content) {
			if (error) {
				console.error(error);
				response.writeHead(500);
				response.end();
			} else {
				response.writeHead(200, { 'Content-Type': 'text/css' });
				response.end(content, 'utf-8');
			}
		});
	} else { // Return application page
		fs.readFile('public/index.html', function (error, content) {
			if (error) {
				console.error(error);
				response.writeHead(500);
				response.end();
			} else {
				response.writeHead(200, { 'Content-Type': 'text/html' });
				response.end(content, 'utf-8');
			}
		});
	}
};
