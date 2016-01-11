"use strict";

const ArticleDataStore = require('../../dataHandlers/ArticleDataStore');
const SessionDataStore = require('../../dataHandlers/SessionDataStore');
const UserDataStore = require('../../dataHandlers/UserDataStore');
const livefyreService = require('../../services/livefyre');
const _ = require('lodash');
const async = require('async');
const consoleLogger = require('../../utils/consoleLogger');
const urlParser = require('url');



exports.metadata = function(req, res, next) {
	if (!req.query.articleId || !req.query.url) {
		res.status(400).send('"articleId" and "url" should be provided.');
		return;
	}

	var parsedUrl = urlParser.parse(req.query.url);
	if (!parsedUrl || !parsedUrl.host || parsedUrl.host.indexOf('.') === -1) {
		res.status(400).send('"url" is not a valid URL.');
		return;
	}

	var articleDataStore = new ArticleDataStore(req.query.articleId);
	articleDataStore.getArticleTags(req.query.url, function (err, tags) {
		if (err) {
			consoleLogger.warn('/v1/livefyre/metadata', '\nArticleId:', req.query.articleId, '\nError:', err);

			res.jsonp([]);
			articleDataStore.destroy();
			return;
		}

		articleDataStore.destroy();
		res.jsonp(tags);
	});
};


exports.getCollectionDetails = function (req, res, next) {
	if (!req.query.articleId || !req.query.title || !req.query.url) {
		res.status(400).send('"articleId", "url" and "title" should be provided.');
		return;
	}

	var parsedUrl = urlParser.parse(req.query.url);
	if (!parsedUrl || !parsedUrl.host || parsedUrl.host.indexOf('.') === -1) {
		res.status(400).send('"url" is not a valid URL.');
		return;
	}

	var config = {
		articleId: req.query.articleId,
		title: req.query.title,
		url: req.query.url
	};

	if (req.query.tags) {
		config.tags = req.query.tags.split(',').map(function (value) {return value.trim();});
	}

	var userSession;
	if (req.cookies && req.cookies['FTSession']) {
		userSession = req.cookies['FTSession'];
	}
	if (req.query.sessionId) {
		userSession = req.query.sessionId;
	}

	var articleDataStore = new ArticleDataStore(req.query.articleId);
	var sessionDataStore;
	if (userSession) {
		sessionDataStore = new SessionDataStore(userSession);
	}

	getLivefyreCollectionDetailsAuthRestricted(articleDataStore, sessionDataStore, config, function (err, data) {
		if (err) {
			if (typeof err === 'object') {
				if (err.statusCode) {
					res.sendStatus(err.statusCode);
					return;
				}

				if (err.unclassified) {
					res.jsonp({
						unclassifiedArticle: true
					});
					return;
				}
			}

			consoleLogger.warn('/v1/livefyre/init', '\nConfig', config, '\nError', err);

			res.sendStatus(503);
			return;
		}

		res.jsonp(data);
	});
};


exports.init = function (req, res, next) {
	if (!req.query.articleId || !req.query.title || !req.query.url || !req.query.el) {
		res.status(400).send('"articleId", "url", "title" and "el" (element ID) should be provided.');
		return;
	}

	var parsedUrl = urlParser.parse(req.query.url);
	if (!parsedUrl || !parsedUrl.host || parsedUrl.host.indexOf('.') === -1) {
		res.status(400).send('"url" is not a valid URL.');
		return;
	}

	consoleLogger.debug(req.query.articleId, "Cookies", req.cookies);

	var config = {
		articleId: req.query.articleId,
		title: req.query.title,
		url: req.query.url
	};

	if (req.query.tags) {
		config.tags = req.query.tags.split(',').map(function (value) {return value.trim();});
	}

	if (req.query.stream_type) {
		config.stream_type = req.query.stream_type;
	}

	var userSession;
	if (req.cookies && req.cookies['FTSession']) {
		userSession = req.cookies['FTSession'];
	}
	if (req.query.sessionId) {
		userSession = req.query.sessionId;
	}

	var articleDataStore = new ArticleDataStore(req.query.articleId);

	var sessionDataStore;
	if (userSession) {
		sessionDataStore = new SessionDataStore(userSession);
	}

	async.parallel({
		livefyre: function (callback) {
			getLivefyreCollectionDetailsAuthRestricted(articleDataStore, sessionDataStore, config, function (err, data) {
				if (err) {
					if (typeof err === 'object' && err.unclassified) {
						callback(null, {
							unclassifiedArticle: true
						});
						return;
					}

					callback(err);
					return;
				}

				callback(null, _.omit(data, ['collectionExists']));
			});
		},
		auth: function (callback) {
			/*callback(null, {
				serviceUp: false
			});
			return;*/

			if (userSession) {
				sessionDataStore.getAuthMetadata(function (errAuth, data) {
					if (errAuth) {
						callback(null, {
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

						callback(null, returnData);
					} else {
						if (data === false) {
							callback(null, {
								pseudonym: false
							});
						} else {
							callback(null, null);
						}
					}
				});
			} else {
				callback(null, null);
			}
		}
	}, function (err, results) {
		if (err) {
			if (typeof err === 'object') {
				if (err.statusCode) {
					res.sendStatus(err.statusCode);
					return;
				}
			}

			consoleLogger.warn('/v1/livefyre/init', '\nConfig', config, '\nError', err);

			res.sendStatus(503);
			return;
		}

		if (results.livefyre && results.livefyre.siteId) {
			results.livefyre.el = req.query.el;
		}

		res.jsonp({
			init: results.livefyre,
			auth: results.auth
		});
	});
};


exports.getLfBootstrap = function (req, res, next) {
	if (!req.query.uuid) {
		res.status(400).send('"uuid" should be provided.');
		return;
	}

	livefyreService.getBootstrapUrl(req.query.uuid, function (err, url) {
		if (err) {
			if (typeof err === 'object' && err['unclassified'] === true) {
				res.status(403).send('Unclassified article.');
				return;
			}

			consoleLogger.warn('/v1/livefyre/get_lf_bootstrap', '\nArticleId', req.query.uuid, '\nError', err);

			res.sendStatus(503);
		}

		if (req.query.datatype === 'html') {
			res.sendStatus(url);
		} else {
			res.jsonp({
				url: url
			});
		}
	});
};

exports.profile = function (req, res, next) {
	if (!req.query.id || !req.query.lftoken) {
		res.status(400).send('"id" (user ID) and "lftoken" (Livefyre system token) should be provided.');
		return;
	}

	if (!livefyreService.validateToken(req.query.lftoken)) {
		res.sendStatus(403);
		return;
	}


	const emailSettingsMappings = {
		'never': 'never',
		'hourly': 'often',
		'immediately': 'immediately'
	};

	var userDataStore = new UserDataStore(req.query.id);
	userDataStore.getUserData(function (err, data) {
		if (err) {
			res.sendStatus(404);
			return;
		}

		var returnData = {};
		returnData.id = String(data.lfUserId);
		if (data.email) {
			returnData.email = data.email;
		}

		if (data.firstName) {
			returnData.first_name = data.firstName;
		}

		if (data.lastName) {
			returnData.last_name = data.lastName;
		}

		if (data.pseudonym) {
			returnData.display_name = data.pseudonym;
		}

		if (data.emailPreferences) {
			returnData.email_notifications = {};

			if (data.emailPreferences.comments && emailSettingsMappings[data.emailPreferences.comments]) {
				returnData.email_notifications.comments = emailSettingsMappings[data.emailPreferences.comments];
			} else {
				returnData.email_notifications.comments = 'never';
			}

			if (data.emailPreferences.likes && emailSettingsMappings[data.emailPreferences.likes]) {
				returnData.email_notifications.likes = emailSettingsMappings[data.emailPreferences.likes];
			} else {
				returnData.email_notifications.likes = 'never';
			}

			if (data.emailPreferences.replies && emailSettingsMappings[data.emailPreferences.replies]) {
				returnData.email_notifications.replies = emailSettingsMappings[data.emailPreferences.replies];
			} else {
				returnData.email_notifications.replies = 'never';
			}

			if (data.emailPreferences.hasOwnProperty('autoFollow') && typeof data.emailPreferences.autoFollow === 'boolean') {
				returnData.autofollow_conversations = String(data.emailPreferences.autoFollow);
			} else {
				returnData.autofollow_conversations = 'false';
			}
		} else {
			returnData.email_notifications = {
				comments: 'never',
				likes: 'never',
				replies: 'never'
			};
			returnData.autofollow_conversations = 'false';
		}

		returnData.settings_url = "";

		res.jsonp(returnData);
	});
};







/* helpers */
function fetchLivefyreCollectionDetails (articleDataStore, config, callback) {
	if (typeof callback !== 'function') {
		throw new Error("v1/livefyre.fetchLivefyreCollectionDetails: callback not provided");
	}

	articleDataStore.getLivefyreCollectionDetails(_.pick(config, ['title', 'url', 'tags', 'stream_type']), function (err, livefyreData) {
		if (err) {
			if (typeof err === 'object' && err['unclassified'] === true) {
				callback(null, {
					unclassified: true
				});
				return;
			}

			callback(err);
			return;
		}

		callback(null, livefyreData);
	});
}
function getLivefyreCollectionDetailsAuthRestricted (articleDataStore, sessionDataStore, config, callback) {
	if (typeof callback !== 'function') {
		throw new Error("v1/livefyre.getLivefyreCollectionDetailsAuthRestricted: callback not provided");
	}


	var callCallback = function () {
		articleDataStore.destroy();
		callback.apply(this, arguments);
	};


	fetchLivefyreCollectionDetails(articleDataStore, config, function (errFetch, collectionDetails) {
		if (errFetch) {
			callCallback(errFetch);
			return;
		}

		articleDataStore.livefyreCollectionExists(function (errExists, exists) {
			if (errExists) {
				callCallback(errExists);
				return;
			}

			if (exists) {
				consoleLogger.log(config.articleId, 'auth restricted collection creation, collection exists');
				collectionDetails.collectionExists = true;

				callCallback(null, collectionDetails);
			} else {
				consoleLogger.log(config.articleId, 'auth restricted collection creation, collection does not exist');
				collectionDetails.collectionExists = false;

				if (sessionDataStore) {
					sessionDataStore.getSessionData(function (err, sessionData) {
						if (err) {
							callCallback(err);
							return;
						}

						if (sessionData) {
							callCallback(null, collectionDetails);
						} else {
							let returnData = collectionDetails;

							/* Auth restricted collection creation, temporarily removed as it breaks CCS

							for (let key in returnData) {
								if (returnData.hasOwnProperty(key)) {
									if (['siteId', 'articleId'].indexOf(key) === -1) {
										returnData[key] = null;
									}
								}
							}
							*/

							returnData.notAllowedToCreateCollection = true;
							callCallback(null, returnData);
						}
					});
				} else {
					let returnData = collectionDetails;

					/* Auth restricted collection creation, temporarily removed as it breaks CCS

					for (let key in returnData) {
						if (returnData.hasOwnProperty(key)) {
							if (['siteId', 'articleId'].indexOf(key) === -1) {
								returnData[key] = null;
							}
						}
					}
					*/

					returnData.notAllowedToCreateCollection = true;
					callCallback(null, returnData);
				}
			}
		});
	});
}
