"use strict";

const {default: logger} = require('@financial-times/n-logger');
const SessionDataStore = require('../../dataHandlers/SessionDataStore');
const UserDataStore = require('../../dataHandlers/UserDataStore');
const async = require('async');
const livefyreService = require('../../services/livefyre');
const consoleLogger = require('../../utils/consoleLogger');
const pseudonymSanitizer = require('../../utils/pseudonymSanitizer');
const sanitizer = require('sanitizer');
const db = require('../../services/db');
const env = require('../../../env');

function sendResponse(req, res, status, json) {
	var isJsonP = req.query.callback ? true : false;

	status = status || 200;

	res.status(isJsonP ? 200 : status).jsonp(json);
}

function validateApiKey(req, res, callback) {
	const apiKey = req.headers['x-api-key'] || req.query.apiKey;
	if (apiKey) {
		if (apiKey !== env.apiKeyForRestrictedEndpoints) {
			sendResponse(req, res, 401, {
				error: 'The API key is invalid.'
			});
			return false;
		} else {
			return true
		}
	} else {
		sendResponse(req, res, 400, {
			error: 'The API key is missing.'
		});
		return false;
	}
}




exports.getAuth = function (req, res, next) {
	/*res.jsonp({
		serviceUp: false
	});
	return;*/

	var userSession;
	if (req.cookies && req.cookies['FTSession']) {
		userSession = req.cookies['FTSession'];
	}

	if (req.query.sessionId) {
		userSession = req.query.sessionId;
	}

	var sessionDataStore;
	if (userSession) {
		sessionDataStore = new SessionDataStore(userSession);

		sessionDataStore.getAuthMetadata(function (errAuth, data) {
			if (errAuth) {
				consoleLogger.warn("Auth service down");
				res.jsonp({
					serviceUp: false
				});
				return;
			}

			if (data) {
				var returnData = {
					token: data.token,
					expires: data.expires,
					displayName: data.pseudonym,
					moderationRights: data.moderationRights
				};

				if (data.emailPreferences && Object.keys(data.emailPreferences).length) {
					returnData.settings = {};

					if (data.emailPreferences.comments) {
						returnData.settings.emailcomments = data.emailPreferences.comments;
					}

					if (data.emailPreferences.likes) {
						returnData.settings.emaillikes = data.emailPreferences.likes;
					}

					if (data.emailPreferences.replies) {
						returnData.settings.emailreplies = data.emailPreferences.replies;
					}

					if (data.emailPreferences.hasOwnProperty('autoFollow') && typeof data.emailPreferences.autoFollow === 'boolean') {
						returnData.settings.emailautofollow = data.emailPreferences.autoFollow ? 'on' : 'off';
					}
				}

				res.jsonp(returnData);
			} else {
				if (data === false) {
					res.jsonp({
						pseudonym: false
					});
				} else {
					res.sendStatus(401);
				}
			}
		});
	} else {
		res.sendStatus(401);
	}
};


exports.getPseudonym = function (req, res, next) {
	if (validateApiKey(req, res)) {
		// successfully validated

		if (req.query.userIds) {
			const userIds = req.query.userIds.split(',');
			for (let i = 0; i < userIds.length; i++) {
				if (!userIds[i] || (typeof userIds[i] === "string" && userIds[i].trim() === "")) {
					userIds.splice(i, 1);
					i--;
				}
			}

			const fetchFunctions = {};

			userIds.forEach((userId, index) => {
				userIds[index] = userId.trim();
				userId = userIds[index];

				fetchFunctions[userId] = function (done) {
					const userDataStore = new UserDataStore(userId);
					userDataStore.getPseudonym((err, pseudonym) => {
						if (err) {
							done(null, null);
							return;
						}

						done(null, pseudonym || null);
					});
				};
			});

			async.parallel(fetchFunctions, (err, results) => {
				if (err) {
					sendResponse(req, res, 400, {
						error: 'An error occurred while fetching the user information.'
					});
					return;
				}

				const responseObj = {};
				const keys = Object.keys(results);
				keys.forEach((key) => {
					responseObj[key] = results[key];
				});

				sendResponse(req, res, 200, responseObj);
			});
		} else {
			sendResponse(req, res, 400, {
				error: 'userIds parameter is not specified.'
			});
		}
	}
};


exports.setPseudonym = function (req, res, next) {
	const origin = req.get('origin');
	const referer = req.get('referer');

	logger.info({
		event: "METADATA_REQUEST_ORIGIN",
		endpoint: 'v1/user/setPseudonym',
		origin,
		referer
	});

	if (!req.query.pseudonym) {
		sendResponse(req, res, 400, {
			status: 'error',
			error: 'Pseudonym invalid or not provided.'
		});
		return;
	}

	var pseudonym = req.query.pseudonym;
	pseudonym = pseudonym.trim();
	pseudonym = pseudonym.replace(/ +(?= )/g,'');

	if (!pseudonym) {
		sendResponse(req, res, 400, {
			status: 'error',
			error: 'Pseudonym invalid or not provided.'
		});
		return;
	}

	if (pseudonym.length > 50) {
		sendResponse(req, res, 400, {
			status: 'error',
			error: 'The pseudonym should not be longer than 50 characters.'
		});
		return;
	}

	let notAllowedCharacters = pseudonymSanitizer.getNotAllowedCharacters(pseudonym);
	if (notAllowedCharacters.length) {
		sendResponse(req, res, 400, {
			status: 'error',
			error: 'The pseudonym cannot contain the following characters: ' + notAllowedCharacters.map(function (item) {
				return sanitizer.escape(item);
			}).join('')
		});
		return;
	}


	var userSession;
	if (req.cookies && req.cookies['FTSession']) {
		userSession = req.cookies['FTSession'];
	}
	if (req.query.sessionId) {
		userSession = req.query.sessionId;
	}

	var sessionDataStore;
	if (userSession) {
		sessionDataStore = new SessionDataStore(userSession);

		sessionDataStore.getUserDataStore(function (errSess, userDataStore) {
			if (errSess) {
				sendResponse(req, res, 503, {
					status: 'error',
					error: 'Server currently unavailable, please try again later.'
				});
				return;
			}

			if (userDataStore) {
				userDataStore.setPseudonym(pseudonym, function (errSetPs) {
					if (errSetPs) {
						sendResponse(req, res, 503, {
							status: 'error',
							error: 'Server currently unavailable, please try again later.'
						});
						return;
					}

					sessionDataStore.invalidate(function (errInv) {
						if (errInv) {
							sendResponse(req, res, 503, {
								status: 'error',
								error: 'Server currently unavailable, please try again later.'
							});
							return;
						}

						userDataStore.getLivefyrePreferredUserId(function (errLfId, lfUserId) {
							if (errLfId) {
								sendResponse(req, res, 503, {
									status: 'error',
									error: 'Server currently unavailable, please try again later.'
								});
							}

							sendResponse(req, res, 200, {
								status: 'ok'
							});

							livefyreService.callPingToPull(lfUserId, function (errPing) {
								if (errPing) {
									consoleLogger.warn('pingToPull error', errPing);
								}
							});
						});
					});
				});
			} else {
				sendResponse(req, res, 401, {
					status: 'error',
					error: 'User session is not valid.'
				});
			}
		});
	} else {
		sendResponse(req, res, 401, {
			status: 'error',
			error: 'User session is not valid.'
		});
	}
};


exports.updateUser = function (req, res, next) {
	var userSession;
	if (req.cookies && req.cookies['FTSession']) {
		userSession = req.cookies['FTSession'];
	}
	if (req.query.sessionId) {
		userSession = req.query.sessionId;
	}


	var isJsonP = req.query.callback ? true : false;

	var pseudonym;
	if (req.query.pseudonym) {
		pseudonym = req.query.pseudonym;
		pseudonym = pseudonym.trim();
		pseudonym = pseudonym.replace(/ +(?= )/g,'');

		if (!pseudonym) {
			sendResponse(req, res, 400, {
				status: 'error',
				error: 'Pseudonym invalid.'
			});
			return;
		}

		if (pseudonym.length > 50) {
			sendResponse(req, res, 400, {
				status: 'error',
				error: 'The pseudonym should not be longer than 50 characters.'
			});
			return;
		}

		let notAllowedCharacters = pseudonymSanitizer.getNotAllowedCharacters(pseudonym);
		if (notAllowedCharacters.length) {
			sendResponse(req, res, 400, {
				status: 'error',
				error: 'The pseudonym cannot contain the following characters: ' + notAllowedCharacters.map(function (item) {
					return sanitizer.escape(item);
				}).join('')
			});
			return;
		}
	}


	if (req.query.emailcomments || req.query.emaillikes || req.query.emailreplies || req.query.emailautofollow) {
		if (req.query.emailautofollow !== null && typeof req.query.emailautofollow !== 'undefined') {
			if (req.query.emailautofollow !== 'on' && req.query.emailautofollow !== true && req.query.emailautofollow !== 'true' &&
			 req.query.emailautofollow !== 'off' && req.query.emailautofollow !== false && req.query.emailautofollow !== 'false') {
				res.status(isJsonP ? 200 : 400).jsonp({
					status: 'error',
					error: 'Email preference values are not valid.'
				});
				return;
			}
		}

		var validValues = ['never', 'immediately', 'hourly'];

		if (req.query.emailcomments && validValues.indexOf(req.query.emailcomments) === -1) {
			sendResponse(req, res, 400, {
				status: 'error',
				error: 'Email preference values are not valid.'
			});
			return;
		}

		if (req.query.emaillikes && validValues.indexOf(req.query.emaillikes) === -1) {
			sendResponse(req, res, 400, {
				status: 'error',
				error: 'Email preference values are not valid.'
			});
			return;
		}

		if (req.query.emailreplies && validValues.indexOf(req.query.emailreplies) === -1) {
			sendResponse(req, res, 400, {
				status: 'error',
				error: 'Email preference values are not valid.'
			});
			return;
		}
	}


	var sessionDataStore;
	if (userSession) {
		sessionDataStore = new SessionDataStore(userSession);

		sessionDataStore.getUserDataStore(function (errSess, userDataStore) {
			if (errSess) {
				sendResponse(req, res, 503, {
					status: 'error',
					error: 'Server currently unavailable, please try again later.'
				});
				return;
			}

			if (userDataStore) {
				async.parallel({
					pseudonym: function (callback) {
						if (pseudonym) {
							userDataStore.setPseudonym(pseudonym, function (errSetPs) {
								if (errSetPs) {
									callback(errSetPs);
									return;
								}

								callback();
							});
						} else {
							callback();
						}
					},
					emailPreferences: function (callback) {
						if (req.query.emailcomments || req.query.emaillikes || req.query.emailreplies || req.query.emailautofollow) {
							var autoFollow = null;
							if (req.query.emailautofollow !== null && typeof req.query.emailautofollow !== 'undefined') {
								if (req.query.emailautofollow === 'on' || req.query.emailautofollow === true || req.query.emailautofollow === 'true') {
									autoFollow = true;
								} else if (req.query.emailautofollow === 'off' || req.query.emailautofollow === false || req.query.emailautofollow === 'false') {
									autoFollow = false;
								}
							}


							userDataStore.setEmailPreferences({
								comments: req.query.emailcomments,
								likes: req.query.emaillikes,
								replies: req.query.emailreplies,
								autoFollow: autoFollow
							}, function (errSetEmail) {
								if (errSetEmail) {
									callback(errSetEmail);
									return;
								}

								callback();
							});
						} else {
							callback();
						}
					}
				}, function (err, results) {
					if (err) {
						if (err['400']) {
							sendResponse(req, res, 400, {
								status: 'error',
								error: err['400']
							});
							return;
						}

						sendResponse(req, res, 503, {
							status: 'error',
							error: 'Server currently unavailable, please try again later.'
						});
						return;
					}

					sessionDataStore.invalidate(function (errInv) {
						if (errInv) {
							sendResponse(req, res, 503, {
								status: 'error',
								error: 'Server currently unavailable, please try again later.'
							});
							return;
						}

						userDataStore.getLivefyrePreferredUserId(function (errLfId, lfUserId) {
							if (errLfId) {
								sendResponse(req, res, 503, {
									status: 'error',
									error: 'Server currently unavailable, please try again later.'
								});
							}

							sendResponse(req, res, 200, {
								status: 'ok'
							});

							livefyreService.callPingToPull(lfUserId, function (errPing) {
								if (errPing) {
									consoleLogger.warn('pingToPull error', errPing);
								}
							});
						});
					});
				});
			} else {
				sendResponse(req, res, 401, {
					status: 'error',
					error: 'User session is not valid.'
				});
			}
		});
	} else {
		sendResponse(req, res, 401, {
			status: 'error',
			error: 'User session is not valid.'
		});
	}
};


exports.emptyPseudonym = function (req, res, next) {
	var userSession;
	if (req.cookies && req.cookies['FTSession']) {
		userSession = req.cookies['FTSession'];
	}
	if (req.query.sessionId) {
		userSession = req.query.sessionId;
	}

	var sessionDataStore;
	if (userSession) {
		sessionDataStore = new SessionDataStore(userSession);

		sessionDataStore.getUserDataStore(function (errSess, userDataStore) {
			if (errSess) {
				sendResponse(req, res, 503, {
					status: 'error',
					error: 'Server currently unavailable, please try again later.'
				});
				return;
			}

			if (userDataStore) {
				userDataStore.emptyPseudonym(function (errSetPs) {
					if (errSetPs) {
						sendResponse(req, res, 503, {
							status: 'error',
							error: 'Server currently unavailable, please try again later.'
						});
						return;
					}

					sessionDataStore.invalidate(function (errInv) {
						if (errInv) {
							sendResponse(req, res, 503, {
								status: 'error',
								error: 'Server currently unavailable, please try again later.'
							});
							return;
						}

						sendResponse(req, res, 200, {
							status: 'ok'
						});
					});
				});
			} else {
				sendResponse(req, res, 401, {
					status: 'error',
					error: 'User session is not valid.'
				});
			}
		});
	} else {
		sendResponse(req, res, 401, {
			status: 'error',
			error: 'User session is not valid.'
		});
	}
};

exports.updateUserBasicInfo = function (req, res, next) {
	if (validateApiKey(req, res)) {
		var userDataStore = new UserDataStore(req.params.uuid);
		userDataStore.updateBasicUserData({
			email: req.body.email,
			firstName: req.body.firstName,
			lastName: req.body.lastName
		}, function (err) {
			if (err) {
				consoleLogger.error(req.params.uuid, "updateUserBasicInfo, error", err);
				res.sendStatus(503);
				return;
			}

			res.send({
				status: 'ok'
			});
		});
	} else {
		res.status(403).send("API key is not provided or invalid.");
	}
};

exports.deleteUser = function (req, res) {
	if (validateApiKey(req, res)) {
		// successfully validated

		if (!req.query.user_id) {
			return res.status(400).json({
				success: false,
				reason: 'user_id is missing'
			});
		}

		db.getConnection(env.mongo.uri, function (errConn, connection) {
			if (errConn) {
				consoleLogger.warn(req.query.user_id, 'delete failed', errConn);
				return res.status(503).json({
					success: false,
					reason: 'Error with the connection to the database'
				});
			}

			consoleLogger.log(req.query.user_id, 'delete session cache');

			connection.collection('sessions').remove({
				"sessionData.uuid": req.query.user_id
			}, function (errDelete) {
				if (errDelete) {
					return res.status(503).json({
						success: false,
						reason: 'Error cleaning the session cache'
					});
				}

				connection.collection('users').remove({
					'uuid': req.query.user_id
				}, function (errDeleteUsers) {
					if (errDeleteUsers) {
						return res.status(503).json({
							success: false,
							reason: 'Error removing the user from the users collection'
						});
					}

					return res.json({
						success: true
					});
				});
			});
		});
	}
};
