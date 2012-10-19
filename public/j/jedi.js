'use strict';

/**
 * Usage: following elements must be available in HTML page
 */
window.JEDI = function (video, canvasSource, canvasBlended) {
	var unifiedGetUserMedia, registerCamera, drawVideo, blender, detector
	  , contextSource, contextBlended, timeout, positionChange;

	unifiedGetUserMedia = function () {
		return navigator.getUserMedia || navigator.webkitGetUserMedia ||
			navigator.mozGetUserMedia || navigator.msGetUserMedia;
	};

	registerCamera = function (video) {
		var error = function (e) {
			alert('Camera error!', e);
		};
		if (navigator.getUserMedia) {
			navigator.getUserMedia({ /*audio: true, */video: true }, function (stream) {
				video.src = stream;
			}, error);
		} else if (navigator.webkitGetUserMedia) {
			navigator.webkitGetUserMedia({ /*audio: true, */video: true }, function (stream) {
				video.src = window.webkitURL.createObjectURL(stream);
			}, error);
		}
	};

	drawVideo = function () {
		contextSource.drawImage(video, 0, 0, video.width, video.height);
	};

	blender = function () {
		var width, height, fastAbs, threshold, differenceAccuracy, lastImageData;
		width = canvasSource.width;
		height = canvasSource.height;

		fastAbs = function (value) {
			// equivalent to Math.abs();
			return (value ^ (value >> 31)) - (value >> 31);
		};
		threshold = function (value) {
			return (value > 0x15) ? 0xFF : 0;
		};
		differenceAccuracy = function (target, data1, data2) {
			var i, j, pointer, avg1, avg2, diff;
			if (data1.length !== data2.length) {
				return null;
			}
			for (i = 0; i < 50; ++i) {
				for (j = 0; j < height; ++j) {
					pointer = (i * 4) + (50 * 4 * j);

					avg1 = (data1[pointer] + data1[pointer + 1] + data1[pointer + 2]) / 3;
					avg2 = (data2[pointer] + data2[pointer + 1] + data2[pointer + 2]) / 3;
					diff = threshold(fastAbs(avg1 - avg2));
					target[pointer] = diff;
					target[pointer + 1] = diff;
					target[pointer + 2] = diff;
					target[pointer + 3] = 0xFF;
				}
			}
		};
		return function () {
			var sourceData, blendedData;
			// get webcam image data
			sourceData = contextSource.getImageData(0, 0, 50, height);
			// create an image if the previous image doesn’t exist
			if (!lastImageData) lastImageData = sourceData;//contextSource.getImageData(0, 0, width, height);
			// create a ImageData instance to receive the blended result
			blendedData = contextSource.createImageData(50, height);
			// blend the 2 images
			differenceAccuracy(blendedData.data, sourceData.data, lastImageData.data);
			// draw the result in a canvas
			contextBlended.putImageData(blendedData, 0, 0);
			// store the current webcam image
			lastImageData = sourceData;
		};
	};

	detector = function () {
		var width, height, blockWidth, blockHeight, blocks, findBlock, pos = 0, step = 5, max = 0xff * 50;
		width = canvasBlended.width;
		height = canvasBlended.height;
		blockWidth = 50;
		blockHeight = 4;
		blocks = height / blockHeight;
		
		var isSelected = function (blockIdx) {
		
			var i = 0, sum = 0, blendedData, len;
			blendedData = contextBlended.getImageData(0, blockHeight * blockIdx, blockWidth, blockHeight);
			len = blendedData.data.length / 4;
			while ((i <  len) && (sum <= max)) {
				sum += blendedData.data[i * 4];
				++i;
			}
			return (sum > max);
		};

		var findPos = function () {
			var i, steps, lastPos, cnt = 0;

			console.log('CurrPos: '+pos+', Is: '+(isSelected(pos)));
			if (isSelected(pos)) {
				lastPos = pos;
				steps = Math.floor(pos / step);
				for (i = pos - steps; i >= 0; --i) {
				++cnt;
					if (isSelected(i)) {
						lastPos = i;
					} else {
						console.log('CNT',cnt);
						return lastPos;
					}
				}
				if (lastPos !== pos) {
					console.log('CNT',cnt);
					return lastPos;
				}
				// Nothing upward? Then go to the dungeons..
				steps = Math.floor((blocks - pos) / step);
				for (i = pos + step; i < blocks; ++i) {
				++cnt;
					if (isSelected(i)) {
						console.log('CNT',cnt);
						return i;
					}
				}
				console.log('CNT',cnt);
				return pos;
			} else {
				steps = Math.floor((blocks - pos) / step);
				for (i = pos + step; i < blocks; ++i) {
				++cnt;
					if (isSelected(i)) {
						// TODO: Perform more accurate search
						console.log('CNT',cnt);
						return i;
					}
				}
				// Strange.. Nothing found? Let's go up!
				steps = Math.floor(pos / step);
				for (i = pos - steps; i >= 0; --i) {
				++cnt;
					if (isSelected(i)) {
						lastPos = i;
					} else {
						if (lastPos) {
							console.log('CNT',cnt);
							return lastPos;
						}
					}
				}
				// Still nothing? Then fuck you, no more searching :)
				console.log('CNT',cnt);
				return -1;
			}
		};

		return function () {
			var foundPos = findPos();
			if (foundPos !== -1) {
				pos = foundPos;
			}
			return foundPos;
		};
	};

	if (!unifiedGetUserMedia()) {
		alert('Need more force!');
		return null;
	}

	return (function () {
		var isStarted = false, update, blend, detect
		  , pos = 0, prevPos = 0, filteredPos = 0, filteredPrevPos = 0;

		update = function updateMyself() {
			var detected = -1;
			var t0 = new Date();

			if (!isStarted) {
				return;
			}
		
			drawVideo();
			blend();
			detected = detect();
			if (detected !== -1) {
				prevPos = pos;
				pos = detected;
				filteredPrevPos = filteredPos;
				filteredPos = (pos * 100 + filteredPrevPos * 200) / (300);
				//console.log(pos, Math.round(filteredPos));
				console.log(pos);
				if (positionChange) {
					//positionChange(filteredPos, filteredPrevPos);
					positionChange(pos);
				}
			}
			var t1 = new Date();

			//console.log('TimeTaken:', (t1 - t0));
			timeout = setTimeout(update, 80);
		};

		return {
			init: function () {
				contextSource = canvasSource.getContext('2d');
				contextBlended = canvasBlended.getContext('2d');
				//contextSource.translate(canvasSource.width, 0);
				//contextSource.scale(-1, 1);
				registerCamera(video);
				blend = blender();
				detect = detector();
			},
			start: function () {
				isStarted = true;
				update();
			},
			stop: function () {
				isStarted = false;
			},
			onPositionChange: function (callback) {
				positionChange = callback;
			}
		};
	})();
};
