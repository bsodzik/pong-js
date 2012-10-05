'use strict';

/**
 * There are three types of players available:
 *   normal    - connects from normal browser
 *   tiny      - connects from mobile device which is used as a controller
 *               game is displayed on other device
 *   spectator - spectates the game
 */
module.exports = function (obj) {
	if (obj.pathname.indexOf('spectator') > 0) {
		return 'spectator';
	}
	if (obj.pathname.indexOf('tiny') > 0 || obj.resolution.width < 800) {
		return 'tiny';
	}
	return 'normal';
};
