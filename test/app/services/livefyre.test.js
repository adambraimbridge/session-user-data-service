"use strict";

const assert = require('assert');
const proxyquire =  require('proxyquire');
const consoleLogger = require('../../../app/utils/consoleLogger');
const MongodbMock = require('../../../mocks/mongodb');
const LivefyreMock = require('../../../mocks/livefyre');
const RequestMock = require('../../../mocks/request');
const _ = require('lodash');

consoleLogger.disable();


const articles = {
	normal: {
		id: 'a86755e4-46a5-11e1-bc5f-00144feabdc0',
		title: 'Test article',
		url: 'http://www.ft.com/cms/a86755e4-46a5-11e1-bc5f-00144feabdc0.html',
		siteId: 415343,
		commentCount: 3
	},
	siteIdNotSetUp: {
		id: '3f330864-1c0f-443e-a6b3-cf8a3b536a52',
		title: 'Test article 2',
		url: 'http://www.ft.com/cms/3f330864-1c0f-443e-a6b3-cf8a3b536a52.html',
		siteId: 252346,
		commentCount: 5
	},
	noCollection: {
		id: 'e78d07ca-680f-11e5-a57f-21b88f7d973f',
		title: 'Test article 3',
		url: 'http://www.ft.com/cms/e78d07ca-680f-11e5-a57f-21b88f7d973f.html',
		siteId: 523435,
		commentCount: 10
	},
	unclassified: {
		id: '24b7158f-a017-43d2-a288-6d3aead3ad27',
		title: 'Test article 3',
		url: 'http://www.ft.com/cms/e78d07ca-680f-11e5-a57f-21b88f7d973f.html',
		siteId: 'unclassified'
	}
};

let articleCollectionExists = [articles.normal.id, articles.siteIdNotSetUp.id];


let legacySiteMapping = [];
Object.keys(articles).forEach(function (key, index) {
	legacySiteMapping.push({
		_id: articles[key].id,
		siteId: articles[key].siteId
	});
});

let articlesById = {};
Object.keys(articles).forEach(function (key, index) {
	articlesById[articles[key].id] = articles[key];
});





const userId = '3f330864-1c0f-443e-a6b3-cf8a3b536a52';
const displayName = 'testName';


const validToken = 'tafg342fefwef';

const systemToken = 'system-token';

const lfUserProfile = {
	data: {
		modScopes: {
			collections: [],
			sites: [423453],
			networks: ['ft-1']
		}
	}
};


const env = {
	livefyre: {
		network: {
			name: 'ft-1',
			key: 'network-key'
		},
		defaultSiteId: 1412,
		siteKeys: {
			1: 'key1',
			2: 'key2',
			3: 'key3',
			415343: 'key415343',
			1412: 'key1412'
		},
		api: {
			collectionExistsUrl: 'http://{networkName}.collection-exists.livefyre.com/{articleIdBase64}',
			pingToPullUrl: 'http://{networkName}.ping-to-pull.livefyre.com/{userId}?token={token}',
			bootstrapUrl: 'http://bootstrap.{networkName}.fyre.co/bs3/{networkName}.fyre.co/{siteId}/{articleIdBase64}/bootstrap.html',
			userProfileUrl: 'http://{networkName}.fyre.co/userProfileUrl',
			commentCountUrl: 'http://{networkName}.fyre.co/commentCount/{siteIdArticleIdBase64}.json'
		}
	},
	mongo: {
		uri: 'mongo-uri-livefyre'
	},
	'@global': true
};

const livefyreUserProfiles = {};
livefyreUserProfiles[validToken] = lfUserProfile;


const requestMock = new RequestMock({
	items: [
		{
			url: env.livefyre.api.collectionExistsUrl,
			handler: function (config) {
				let articleId = new Buffer(config.matches.urlParams.articleIdBase64, 'base64').toString();

				if (config.matches.urlParams.networkName !== env.livefyre.network.name) {
					config.callback(new Error("Network not found"));
					return;
				}

				if (articleCollectionExists.indexOf(articleId) !== -1) {
					config.callback(null, {
						statusCode: 200
					});
					return;
				}

				config.callback(null, {
					statusCode: 404
				});
			}
		},
		{
			url: env.livefyre.api.pingToPullUrl,
			handler: function (config) {
				if (config.matches.urlParams.networkName !== env.livefyre.network.name) {
					config.callback(new Error("Network not found"));
					return;
				}

				if (config.matches.queryParams.token !== systemToken) {
					config.callback(new Error("System token invalid"));
					return;
				}

				if (config.matches.urlParams.userId === userId) {
					config.callback(null, {
						statusCode: 200
					});
					return;
				}

				config.callback(new Error("Ping to pull error."));
			}
		},
		{
			url: env.livefyre.api.userProfileUrl,
			handler: function (config) {
				if (config.matches.urlParams.networkName !== env.livefyre.network.name) {
					config.callback(new Error("Network is not correct."));
					return;
				}

				if (config.matches.queryParams.lftoken && config.matches.queryParams.lftoken.indexOf('down') !== -1) {
					config.callback(null, {
						statusCode: 503
					});
					return;
				}

				let userProfile = livefyreUserProfiles[config.matches.queryParams.lftoken];
				if (userProfile) {
					config.callback(null, {
						statusCode: 200,
						body: JSON.stringify(userProfile)
					});
					return;
				}

				try {
					let lfTokenJson = JSON.parse(config.matches.queryParams.lftoken);
					if (lfTokenJson && lfTokenJson.userId) {
						userProfile = livefyreUserProfiles[lfTokenJson.userId];
						if (userProfile) {
							config.callback(null, {
								statusCode: 200,
								body: JSON.stringify(userProfile)
							});
							return;
						}
					}
				} catch (e) {
				}

				config.callback(null, {
					statusCode: 404
				});
			}
		},
		{
			url: env.livefyre.api.commentCountUrl,
			handler: function (config) {
				let siteIdArticleId = new Buffer(config.matches.urlParams.siteIdArticleIdBase64, 'base64').toString().split(':');

				let siteId = parseInt(siteIdArticleId[0], 10);
				let articleId = siteIdArticleId[1];

				if (config.matches.urlParams.networkName !== env.livefyre.network.name) {
					config.callback(new Error("Network not found"));
					return;
				}

				if (articlesById[articleId]) {
					let article = articlesById[articleId];

					if (article.siteId !== siteId) {
						config.callback({
							error: new Error("Mismatch"),
							statusCode: 400
						});
						return;
					}

					let response = {
						data: {}
					};
					response.data[siteId] = {};
					response.data[siteId][articleId] = {
						total: article.commentCount
					};
					config.callback(null, {
						statusCode: 200,
						body: JSON.stringify(response)
					});
					return;
				}

				config.callback(null, {
					statusCode: 200,
					body: JSON.stringify({
						data: {}
					})
				});
			}
		}
	],
	global: true
});

const mongodbMock = new MongodbMock({
	dbMock: {
		legacy_site_mapping: legacySiteMapping
	},
	global: true
});
const livefyreMock = new LivefyreMock({
	systemToken: systemToken,
	validToken: validToken,
	global: true
});

const livefyreService = proxyquire('../../../app/services/livefyre.js', {
	'livefyre': livefyreMock.mock,
	'../../env': env,
	'request': requestMock.mock,
	'mongodb': mongodbMock.mock
});

describe('livefyreService', function() {
	describe('getCollectionDetails', function () {
		it('should return error if the UUID is unclassified', function (done) {
			livefyreService.getCollectionDetails({
				articleId: articles.unclassified.id,
				title: articles.unclassified.title,
				url: articles.unclassified.url
			}, function (err, data) {
				assert.deepEqual(err, {
					unclassified: true
				}, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return error if legacySiteMapping returns error', function (done) {
			var mongoUri = env.mongo.uri;
			env.mongo.uri = 'invalid';

			livefyreService.getCollectionDetails({
				articleId: articles.normal.id,
				title: articles.normal.title,
				url: articles.normal.url
			}, function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				env.mongo.uri = mongoUri;
				done();
			});
		});

		it('should return error if site key is not set', function (done) {
			livefyreService.getCollectionDetails({
				articleId: articles.siteIdNotSetUp.id,
				title: articles.siteIdNotSetUp.title,
				url: articles.siteIdNotSetUp.url
			}, function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return error if articleId is omitted', function (done) {
			livefyreService.getCollectionDetails({
				title: articles.normal.title,
				url: articles.normal.url
			}, function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return error if title is omitted', function (done) {
			livefyreService.getCollectionDetails({
				articleId: articles.normal.id,
				url: articles.normal.url
			}, function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return error if url is omitted', function (done) {
			livefyreService.getCollectionDetails({
				title: articles.normal.title,
				articleId: articles.normal.id
			}, function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return collection details without errors', function (done) {
			livefyreService.getCollectionDetails({
				articleId: articles.normal.id,
				title: articles.normal.title,
				url: articles.normal.url
			}, function (err, data) {
				assert.ok(!err, "Error is not returned.");

				assert.deepEqual(data, {
					siteId: articles.normal.siteId,
					articleId: articles.normal.id,
					collectionMeta: JSON.stringify({
						collectionMeta: {
							tags: '',
							networkName: env.livefyre.network.name + '.fyre.co',
							networkKey: env.livefyre.network.key,
							siteId: articles.normal.siteId,
							siteKey: env.livefyre.siteKeys[articles.normal.siteId],
							streamType: 'livecomments',
							title: articles.normal.title,
							articleId: articles.normal.id,
							url: articles.normal.url
						}
					}),
					checksum: JSON.stringify({
						checksum: {
							tags: '',
							networkName: env.livefyre.network.name + '.fyre.co',
							networkKey: env.livefyre.network.key,
							siteId: articles.normal.siteId,
							siteKey: env.livefyre.siteKeys[articles.normal.siteId],
							streamType: 'livecomments',
							title: articles.normal.title,
							articleId: articles.normal.id,
							url: articles.normal.url
						}
					})
				}, "Collection details is correctly returned.");

				done();
			});
		});

		it('should return collection details with the tags provided (and escaped properly)', function (done) {
			livefyreService.getCollectionDetails({
				articleId: articles.normal.id,
				title: articles.normal.title,
				url: articles.normal.url,
				tags: ['tag1', 'tag2', 'tag 3']
			}, function (err, data) {
				assert.ok(!err, "Error is not returned.");

				assert.deepEqual(data, {
					siteId: articles.normal.siteId,
					articleId: articles.normal.id,
					collectionMeta: JSON.stringify({
						collectionMeta: {
							tags: 'tag1,tag2,tag_3',
							networkName: env.livefyre.network.name + '.fyre.co',
							networkKey: env.livefyre.network.key,
							siteId: articles.normal.siteId,
							siteKey: env.livefyre.siteKeys[articles.normal.siteId],
							streamType: 'livecomments',
							title: articles.normal.title,
							articleId: articles.normal.id,
							url: articles.normal.url
						}
					}),
					checksum: JSON.stringify({
						checksum: {
							tags: 'tag1,tag2,tag_3',
							networkName: env.livefyre.network.name + '.fyre.co',
							networkKey: env.livefyre.network.key,
							siteId: articles.normal.siteId,
							siteKey: env.livefyre.siteKeys[articles.normal.siteId],
							streamType: 'livecomments',
							title: articles.normal.title,
							articleId: articles.normal.id,
							url: articles.normal.url
						}
					})
				}, "Collection details is correctly returned.");

				done();
			});
		});

		it('should return collection details with the provided stream_type', function (done) {
			livefyreService.getCollectionDetails({
				articleId: articles.normal.id,
				title: articles.normal.title,
				url: articles.normal.url,
				stream_type: 'liveblogs'
			}, function (err, data) {
				assert.ok(!err, "Error is not returned.");

				assert.deepEqual(data, {
					siteId: articles.normal.siteId,
					articleId: articles.normal.id,
					collectionMeta: JSON.stringify({
						collectionMeta: {
							tags: '',
							networkName: env.livefyre.network.name + '.fyre.co',
							networkKey: env.livefyre.network.key,
							siteId: articles.normal.siteId,
							siteKey: env.livefyre.siteKeys[articles.normal.siteId],
							streamType: 'liveblogs',
							title: articles.normal.title,
							articleId: articles.normal.id,
							url: articles.normal.url
						}
					}),
					checksum: JSON.stringify({
						checksum: {
							tags: '',
							networkName: env.livefyre.network.name + '.fyre.co',
							networkKey: env.livefyre.network.key,
							siteId: articles.normal.siteId,
							siteKey: env.livefyre.siteKeys[articles.normal.siteId],
							streamType: 'liveblogs',
							title: articles.normal.title,
							articleId: articles.normal.id,
							url: articles.normal.url
						}
					})
				}, "Collection details is correctly returned.");

				done();
			});
		});
	});

	describe('getBootstrapUrl', function () {
		it('should return error if legacySiteMapping returns error', function (done) {
			var mongoUri = env.mongo.uri;
			env.mongo.uri = 'invalid';

			livefyreService.getBootstrapUrl('invalid-uuid', function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				env.mongo.uri = mongoUri;
				done();
			});
		});

		it('should return the URL', function (done) {
			livefyreService.getBootstrapUrl(articles.normal.id, function (err, data) {
				assert.ok(!err, "Error is not returned.");

				var url = env.livefyre.api.bootstrapUrl;
				url = url.replace(/\{networkName\}/g, env.livefyre.network.name);
				url = url.replace(/\{articleIdBase64\}/g, new Buffer(articles.normal.id).toString('base64'));
				url = url.replace(/\{siteId\}/g, articles.normal.siteId);

				assert.equal(data, url, "Bootstrap URL has the correct format and parameters.");

				done();
			});
		});
	});

	describe('collectionExists', function () {
		it('should return error if legacySiteMapping returns error', function (done) {
			var mongoUri = env.mongo.uri;
			env.mongo.uri = 'invalid';

			livefyreService.collectionExists('invalid-uuid', function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				env.mongo.uri = mongoUri;
				done();
			});
		});

		it('should return false if the collection does not exist', function (done) {
			livefyreService.collectionExists(articles.noCollection.id, function (err, data) {
				assert.ok(!err, "Error is not returned.");
				assert.equal(data, false, "Collection does not exist.");

				done();
			});
		});

		it('should return true if the collection exists', function (done) {
			livefyreService.collectionExists(articles.normal.id, function (err, data) {
				assert.ok(!err, "Error is not returned.");
				assert.equal(data, true, "Collection exists.");

				done();
			});
		});
	});

	describe('generateAuthToken', function () {
		it('should return error if userId is omitted', function (done) {
			livefyreService.generateAuthToken({
				displayName: displayName
			}, function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return error if displayName is omitted', function (done) {
			livefyreService.generateAuthToken({
				userId: userId
			}, function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return token', function (done) {
			livefyreService.generateAuthToken({
				userId: userId,
				displayName: displayName
			}, function (err, data) {
				assert.ok(!err, "Error is not returned.");

				data.token = JSON.parse(data.token);

				assert.deepEqual(Object.keys(data), ['token', 'expires'], "Response has the expected fields.");
				assert.deepEqual(Object.keys(data.token), ['userId', 'displayName', 'expires'], "Token has the expected fields.");
				assert.deepEqual(_.pick(data.token, ['userId', 'displayName']), {
					userId: userId,
					displayName: displayName
				}, "Token has the expected data.");

				done();
			});
		});

		it('should return token with default expiry time', function (done) {
			livefyreService.generateAuthToken({
				userId: userId,
				displayName: displayName
			}, function (err, data) {
				data.token = JSON.parse(data.token);

				assert.ok(Math.abs(new Date(new Date().getTime() + data.token.expires * 1000).getTime() - new Date(data.expires).getTime()) < 10, "Expires field and the expiration field in token point to the same date.");

				done();
			});
		});

		it('should return token with `expires` specified', function (done) {
			var start = new Date();
			var expiresIn = 60;
			livefyreService.generateAuthToken({
				userId: userId,
				displayName: displayName,
				expires: expiresIn
			}, function (err, data) {
				var end = new Date();

				data.token = JSON.parse(data.token);

				assert.ok(data.token.expires >= expiresIn - 1 && data.token.expires <= expiresIn + 1, "Expires value in the token states an expiration in approximately 24 hours.");
				assert.ok(data.expires >= new Date(start.getTime() + expiresIn * 1000).getTime() && data.expires <= new Date(end.getTime() + expiresIn * 1000).getTime(), "Expires value states an expiration data approximately in the specified time.");

				done();
			});
		});

		it('should return token with `expireAt` specified', function (done) {
			var start = new Date();
			var expiresIn = 60;
			var expiresAt = new Date(start.getTime() + expiresIn * 1000);
			livefyreService.generateAuthToken({
				userId: userId,
				displayName: displayName,
				expiresAt: expiresAt
			}, function (err, data) {
				data.token = JSON.parse(data.token);

				assert.ok(data.token.expires >= expiresIn - 1 && data.token.expires <= expiresIn + 1, "Expires value in the token states an expiration in approximately 24 hours.");
				assert.ok(Math.abs(data.expires - expiresAt.getTime()) < 10, "Expires value states an expiration data in the specified time.");

				done();
			});
		});
	});

	describe('validateToken', function () {
		it('should return false if the token is not valid', function () {
			var validation = livefyreService.validateToken('invalid-token');
			assert.equal(validation, false, "The token is not valid.");
		});

		it('should return false if the token is not valid', function () {
			var validation = livefyreService.validateToken(validToken);
			assert.equal(validation, true, "The token is valid.");
		});
	});

	describe('callPingToPull', function () {
		it('should return error if invalid user ID is specified', function (done) {
			livefyreService.callPingToPull('invalid-uuid', function (err) {
				assert.ok(err, "Error returned.");

				done();
			});
		});

		it('should call the service with no issues if valid user ID is specified', function (done) {
			livefyreService.callPingToPull(userId, function (err) {
				assert.ok(!err, "Error not returned.");

				done();
			});
		});
	});

	describe('getModerationRights', function () {
		it('should return error if the livefyre service returns error', function (done) {
			livefyreService.getModerationRights('service-down', function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return error if the user does not exist', function (done) {
			livefyreService.getModerationRights('notfound', function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return the moderation rights if the user exists', function (done) {
			livefyreService.getModerationRights(validToken, function (err, data) {
				assert.ok(!err, "Error is not returned.");
				assert.deepEqual(data, lfUserProfile.data.modScopes, "Collection exists.");

				done();
			});
		});
	});



	describe('getCommentCount', function () {
		it('should return error if legacySiteMapping returns error', function (done) {
			var mongoUri = env.mongo.uri;
			env.mongo.uri = 'invalid';

			livefyreService.getCommentCount(articles.normal.id, function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				env.mongo.uri = mongoUri;
				done();
			});
		});

		it('should return error if articleId is omitted', function (done) {
			livefyreService.getCommentCount(null, function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return error if the UUID is unclassified', function (done) {
			livefyreService.getCommentCount(articles.unclassified.id, function (err, data) {
				assert.deepEqual(err, {
					unclassified: true
				}, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return 404 if the article does not exist', function (done) {
			livefyreService.getCommentCount('notexists', function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.deepEqual(err.statusCode, 404, "Status code is 404.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return the count', function (done) {
			livefyreService.getCommentCount(articles.normal.id, function (err, data) {
				assert.ok(!err, "Error is not returned.");

				var expected = {
					data: {}
				};
				expected.data[articles.normal.siteId] = {};
				expected.data[articles.normal.siteId][articles.normal.id] = {
					total: articles.normal.commentCount
				};

				assert.deepEqual(data, expected, "Collection details is correctly returned.");

				done();
			});
		});
	});
});
