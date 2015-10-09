"use strict";

var livefyre = require('livefyre');
var legacySiteMapping = require('./legacySiteMapping');
var needle = require('needle');

var network = livefyre.getNetwork(process.env.livefyreNetwork + '@fyre.co', process.env.livefyreNetworkKey);


exports.getCollectionDetails = function (config, callback) {
	if (typeof callback !== 'function') {
		throw new Error("livefyre.getCollectionDetails: callback not provided");
	}

	if (!config.title || !config.articleId || !config.url) {
		callback(new Error("articleId, title and url should be provided."));
		return;
	}

	try {
		var stream_type = config.stream_type || 'livecomments';

		legacySiteMapping.getSiteId(config.articleId, function (err, siteId) {
			if (err) {
				callback(err);
				return;
			}

			var site = network.getSite(siteId, process.env['livefyreSiteKey_' + siteId]);

			var collection = site.buildCollection(stream_type, config.title, config.articleId, config.url);
			if (config.tags) {
				collection.data.tags = config.tags.join(',').replace(/ /g, '_');
			}

			var collectionMeta = collection.buildCollectionMetaToken();
			var checksum = collection.buildChecksum();

			if (collectionMeta) {
				callback(null, {
					siteId: siteId,
					articleId: config.articleId,
					collectionMeta: collectionMeta,
					checksum: checksum
				});
			}
		});
	} catch (err) {
		callback(err);
	}
};

exports.getBootstrapUrl = function (articleId, callback) {
	if (typeof callback !== 'function') {
		throw new Error("livefyre.getBootstrapUrl: callback not provided");
	}

	legacySiteMapping.getSiteId(articleId, function (err, siteId) {
		if (err) {
			callback(err);
			return;
		}

		callback(null, 'http://bootstrap.'+ process.env.livefyreNetwork +'.fyre.co/bs3/'+ process.env.livefyreNetwork +'.fyre.co/'+ siteId +'/'+ new Buffer(articleId).toString('base64') +'/bootstrap.html');
	});
};

exports.collectionExists = function (articleId, callback) {
	if (typeof callback !== 'function') {
		throw new Error("livefyre.collectionExists: callback not provided");
	}

	var url = 'https://{networkName}.bootstrap.fyre.co/bs3/v3.1/{networkName}.fyre.co/{siteId}/{articleId}/init';

	url = url.replace(/\{networkName\}/g, process.env.livefyreNetwork);
	url = url.replace(/\{articleId\}/g, new Buffer(articleId).toString('base64'));

	legacySiteMapping.getSiteId(articleId, function (err, siteId) {
		if (err) {
			callback(err);
			return;
		}

		url = url.replace(/\{siteId\}/g, siteId);

		needle.get(url, function (err, response) {
			if (err || response.statusCode !== 200) {
				callback(null, false);
				return;
			}

			callback(null, true);
		});
	});
};

exports.generateAuthToken = function (config, callback) {
	if (typeof callback !== 'function') {
		throw new Error("livefyre.generateAuthToken: callback not provided");
	}

	if (!config.userId || !config.displayName) {
		callback(new Error('"userId" and "displayName" should be provided.'));
	}

	var expires = 60 * 60 * 24; // default is 24 hours
	if (config.expires) {
		expires = config.expires;
	}
	if (config.expiresAt) {
		expires = (new Date(config.expiresAt).getTime() - new Date().getTime()) / 1000;
	}

	var authToken = network.buildUserAuthToken(config.userId + '', config.displayName, expires);

	callback(null, {
		token: authToken,
		expires: new Date(new Date().getTime() + expires * 1000)
	});
};
