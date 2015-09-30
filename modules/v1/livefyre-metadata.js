"use strict";

var livefyre = require('livefyre');

var network = livefyre.getNetwork(process.env.livefyreNetwork, process.env.livefyreNetworkKey);


exports.getCollectionDetails = function (config, callback) {
	if (!config.title || !config.articleId || !config.url) {
		callback(new Error("articleId, title and url should be provided."));
		return;
	}

	try {
		var stream_type = config.stream_type || 'livecomments';

		var siteId = 378157;
		var site = network.getSite(siteId, process.env['livefyreSiteKey_' + siteId]);

		var collection = site.buildCollection(stream_type, config.title, config.articleId, config.url);
		var collectionMeta = collection.buildCollectionMetaToken();

		if (collectionMeta) {
			callback(null, {
				siteId: siteId,
				articleId: config.articleId,
				collectionMeta: collectionMeta
			});
		}
	} catch (err) {
		console.log('livefyre/getCollectionDetails', 'Error', err);

		callback(err);
	}
};
