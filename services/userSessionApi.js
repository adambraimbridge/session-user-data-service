"use strict";

var needle = require('needle');
var _ = require('lodash');
var env = require('../env');


exports.getSessionData = function (sessionId, callback) {
	if (typeof callback !== 'function') {
		throw new Error("userSessionApi.getSessionData: callback not provided");
	}

	var options = {
		headers: {
			'FT_Api_Key': env.sessionApi.key
		}
	};

	try {
		var url = env.sessionApi.url;
		url = url.replace(/\{sessionId\}/g, sessionId);

		needle.get(url, options, function (err, response) {
			if (err) {
				callback(err);
				return;
			}

			if (response.statusCode !== 200) {
				callback(null, null);
				return;
			}

			var responseBody = _.pick(response.body, ['uuid', 'creationTime', 'rememberMe']);

			callback(null, responseBody);
		});
	} catch (e) {
		console.log('Session API validate', 'Error', e);

		callback(e);
	}
};
