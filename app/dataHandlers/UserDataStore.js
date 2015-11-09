"use strict";

const db = require('../services/db');
const consoleLogger = require('../utils/consoleLogger');
const mongoSanitize = require('mongo-sanitize');
const EventEmitter = require('events');
const eRightsToUuid = require('../services/eRightsToUuid');
const emailService = require('../services/email');
const crypto = require('../utils/crypto');
const env = require('../../env');

var UserDataStore = function (userId) {
	var storedData = null;
	var self = this;
	var storeEvents = new EventEmitter();

	let toBeRefreshed;



	let uuidCache = null;
	const getUuidOfUserId = function (callback) {
		if (uuidCache) {
			callback(null, uuidCache);
			return;
		}

		eRightsToUuid.getUuid(userId, function (errUuid, userUuid) {
			if (errUuid) {
				callback(errUuid);
				return;
			}

			if (userUuid) {
				uuidCache = userUuid;
				callback(null, userUuid);
			} else {
				callback();
			}
		});
	};

	let eRightsIdCache = null;
	const getERightsIdOfUserId = function (callback) {
		if (eRightsIdCache) {
			callback(null, eRightsIdCache);
			return;
		}

		eRightsToUuid.getERightsId(userId, function (errERights, userERightsId) {
			if (errERights) {
				callback(errERights);
				return;
			}

			if (userERightsId) {
				eRightsIdCache = userERightsId;
				callback(null, userERightsId);
			} else {
				callback();
			}
		});
	};


	var fetchingStoreInProgress = false;
	const getStoredData = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataStore.getStoredData: callback not provided");
		}

		if (storedData && !toBeRefreshed) {
			consoleLogger.log(userId, 'stored data retrieved from memory');
			callback(null, storedData);
			return;
		}

		storeEvents.once('storedDataFetched', function (err, data) {
			callback(err, data);
		});


		var done = function (err, data) {
			fetchingStoreInProgress = false;
			storeEvents.emit('storedDataFetched', err, data);
		};

		if (!fetchingStoreInProgress) {
			fetchingStoreInProgress = true;

			db.getConnection(env.mongo.uri, function (errConn, connection) {
				if (errConn) {
					consoleLogger.warn(userId, 'error retrieving the cache', errConn);

					done(errConn);
					return;
				}

				getUuidOfUserId(function (errUuid, userUuid) {
					if (errUuid) {
						done(errUuid);
						return;
					}

					if (userUuid) {
						connection.collection('users').find({
							_id: mongoSanitize(userUuid)
						}).toArray(function (errDb, data) {
							if (errDb) {
								consoleLogger.warn(userId, 'cache retrieval failed', errDb);

								done(errDb);
								return;
							}

							if (data && data.length) {
								toBeRefreshed = false;
								storedData = data[0];

								if (!storedData.uuid) {
									upsertStoredData({
										uuid: userUuid
									});
								}

								consoleLogger.log(userId, 'cached data retrieved');
								consoleLogger.debug(userId, storedData);

								done(null, storedData);
							} else {
								consoleLogger.log(userId, 'no cached data found');

								done();
							}
						});
					} else {
						done(new Error("User not found"));
						return;
					}
				});
			});
		}
	};




	const sanitizeData = function (data) {
		if (data && typeof data === 'object' && Object.keys(data).length) {
			let keys = Object.keys(data);
			let newData = {};

			keys.forEach((key) => {
				newData[mongoSanitize(key)] = sanitizeData(data[key]);
			});

			return newData;
		} else {
			return data;
		}
	};

	let atLeastOneUpdateMade = false;
	const upsertStoredData = function (data, callback) {
		callback = callback || function () {};

		var sanitizedData = sanitizeData(data);

		db.getConnection(env.mongo.uri, function (errConn, connection) {
			if (errConn) {
				consoleLogger.warn(userId, 'upsert failed', errConn);

				return;
			}

			consoleLogger.log(userId, 'upsert cache');
			consoleLogger.debug(userId, 'data:', sanitizedData);


			getUuidOfUserId(function (errUuid, userUuid) {
					if (errUuid) {
						callback(errUuid);
						return;
					}

					if (userUuid) {
						connection.collection('users').update({
							_id: mongoSanitize(userUuid)
						}, {
							$set: sanitizedData
						}, {
							upsert: true
						}, function (errUps, result) {
							if (errUps) {
								consoleLogger.warn(userId, 'upsert failed', errUps);

								if (typeof callback === 'function') {
									callback(errUps);
								}
								return;
							}

							// reset storage cache
							toBeRefreshed = true;

							if (!atLeastOneUpdateMade && result !== 1) {
								atLeastOneUpdateMade = true;

								// insert, should set an expire
								consoleLogger.log(userId, 'upsert', 'new entry, set uuid if it was not set');

								if (!sanitizedData.hasOwnProperty('uuid')) {
									getUuidOfUserId(function (errUuid, userUuid) {
										if (errUuid) {
											callback(errUuid);
											return;
										}

										if (userUuid) {
											connection.collection('users').update({
												_id: mongoSanitize(userUuid)
											}, {
												$set: {
													uuid: userUuid
												}
											});

											callback();
										} else {
											callback(new Error("User not found"));
											return;
										}
									});
								} else {
									callback();
								}
							} else {
								callback();
							}
						});
					} else {
						callback(new Error("User not found"));
						return;
					}
				});
		});
	};


	const fetchLivefyrePreferredUserId = function (callback) {
		getERightsIdOfUserId(function (errERights, userERightsId) {
			if (errERights) {
				callback(errERights);
				return;
			}

			if (userERightsId) {
				callback(null, userERightsId);
				return;
			} else {
				// eRights does not exist, use UUID for Livefyre as well
				getUuidOfUserId(function (errUuid, userUuid) {
					if (errERights) {
						callback(errERights);
						return;
					}

					if (userUuid) {
						callback(null, userUuid);
						return;
					} else {
						callback(new Error("User does not exist."));
					}
				});
			}
		});
	};
	const upsertLivefyrePreferredUserId = function (lfUserId) {
		upsertStoredData({
			lfUserId: lfUserId
		});
	};
	this.getLivefyrePreferredUserId = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataStore.getLivefyrePreferredUserId: callback not provided");
		}

		if (!userId) {
			callback(new Error("User ID is not provided."));
			return;
		}

		getStoredData(function (errCache, storedData) {
			if (errCache) {
				// fetch
				consoleLogger.log(userId, 'getLivefyrePreferredUserId', 'error retrieving cache');

				fetchLivefyrePreferredUserId(callback);
				return;
			}

			if (storedData && storedData.lfUserId) {
				consoleLogger.log(userId, 'getLivefyrePreferredUserId', 'data loaded from the cache');
				callback(null, storedData.lfUserId);
			} else {
				// fetch and save
				consoleLogger.log(userId, 'getLivefyrePreferredUserId', 'not found in cache');
				fetchLivefyrePreferredUserId(function (errFetch, lfUserId) {
					if (errFetch) {
						callback(errFetch);
						return;
					}

					callback(null, lfUserId);

					upsertLivefyrePreferredUserId(lfUserId);
				});
			}
		});
	};



	this.getPseudonym = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataStore.getPseudonym: callback not provided");
		}

		if (!userId) {
			callback(new Error("User ID is not provided."));
			return;
		}

		getStoredData(function (errCache, storedData) {
			if (errCache) {
				// fetch
				consoleLogger.log(userId, 'getPseudonym', 'error retrieving pseudonym');

				callback(errCache);
				return;
			}

			if (storedData && storedData.pseudonym) {
				var pseudonym = crypto.decrypt(storedData.pseudonym);

				consoleLogger.log(userId, 'getPseudonym', 'data loaded from the cache');
				callback(null, pseudonym);
			} else {
				consoleLogger.log(userId, 'getPseudonym', 'user has no pseudonym');
				callback(null, null);
			}
		});
	};

	this.setPseudonym = function (pseudonym, callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataStore.setPseudonym: callback not provided");
		}

		if (!userId) {
			callback(new Error("User ID is not provided."));
			return;
		}

		if (!pseudonym || typeof pseudonym !== 'string') {
			callback(new Error("Pseudonym is blank."));
			return;
		}

		getStoredData(function (errCache, storedData) {
			if (errCache) {
				// fetch
				consoleLogger.log(userId, 'setPseudonym', 'error with the storage');

				callback(errCache);
				return;
			}

			upsertStoredData({
				pseudonym: crypto.encrypt(pseudonym)
			}, function (errUpsert) {
				if (errUpsert) {
					callback(errUpsert);
					return;
				}

				consoleLogger.log(userId, 'setPseudonym', 'set pseudonym ok');
				callback();
			});
		});
	};

	this.emptyPseudonym = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataStore.emptyPseudonym: callback not provided");
		}

		if (!userId) {
			callback(new Error("User ID is not provided."));
			return;
		}

		getStoredData(function (errCache, storedData) {
			if (errCache) {
				// fetch
				consoleLogger.log(userId, 'emptyPseudonym', 'error with the storage');

				callback(errCache);
				return;
			}

			upsertStoredData({
				pseudonym: null
			}, function (errUpsert) {
				if (errUpsert) {
					callback(errUpsert);
					return;
				}

				consoleLogger.log(userId, 'emptyPseudonym', 'empty pseudonym ok');
				callback();
			});
		});
	};



	this.getEmailPreferences = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataStore.getEmailPreferences: callback not provided");
		}

		if (!userId) {
			callback(new Error("User ID is not provided."));
			return;
		}

		getStoredData(function (errCache, storedData) {
			if (errCache) {
				// fetch
				consoleLogger.log(userId, 'getEmailPreferences', 'error retrieving email preferences');

				callback(errCache);
				return;
			}

			if (storedData && storedData.emailPreferences) {
				consoleLogger.log(userId, 'getEmailPreferences', 'data loaded from the cache');
				callback(null, storedData.emailPreferences);
			} else {
				consoleLogger.log(userId, 'getEmailPreferences', 'user has no email preference');
				callback(null, null);
			}
		});
	};

	this.setEmailPreferences = function (emailPreferences, callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataStore.setEmailPreferences: callback not provided");
		}

		if (!userId) {
			callback(new Error("User ID is not provided."));
			return;
		}

		if (!emailPreferences || typeof emailPreferences !== 'object') {
			callback(new Error("emailPreferences not provided."));
			return;
		}

		var validValues = ['never', 'immediately', 'hourly'];

		if (emailPreferences.comments) {
			if (validValues.indexOf(emailPreferences.comments) === -1) {
				consoleLogger.log(userId, 'setEmailPreferences', '"comments" value not valid');
				callback(new Error("Email preference values are not valid."));
				return;
			}
		} else {
			delete emailPreferences.comments;
		}

		if (emailPreferences.likes) {
			if (validValues.indexOf(emailPreferences.likes) === -1) {
				consoleLogger.log(userId, 'setEmailPreferences', '"likes" value not valid');
				callback(new Error("Email preference values are not valid."));
				return;
			}
		} else {
			delete emailPreferences.likes;
		}

		if (emailPreferences.replies) {
			if (validValues.indexOf(emailPreferences.replies) === -1) {
				consoleLogger.log(userId, 'setEmailPreferences', '"replies" value not valid');
				callback(new Error("Email preference values are not valid."));
				return;
			}
		} else {
			delete emailPreferences.replies;
		}

		if (emailPreferences.hasOwnProperty('autoFollow') && emailPreferences.autoFollow !== null) {
			if (typeof emailPreferences.autoFollow !== 'boolean') {
				consoleLogger.log(userId, 'setEmailPreferences', '"autoFollow" value not valid');
				callback(new Error("Email preference values are not valid."));
				return;
			}
		} else {
			delete emailPreferences.autoFollow;
		}

		getStoredData(function (errCache, storedData) {
			if (errCache) {
				// fetch
				consoleLogger.log(userId, 'setEmailPreferences', 'error with the storage');

				callback(errCache);
				return;
			}

			let upsertData = {};
			for (let key in emailPreferences) {
				if (emailPreferences.hasOwnProperty(key)) {
					upsertData['emailPreferences.' + key] = emailPreferences[key];
				}
			}

			upsertStoredData(upsertData, function (errUpsert) {
				if (errUpsert) {
					callback(errUpsert);
					return;
				}

				callback();
			});
		});
	};


	var fetchBasicUserInfo = function (callback) {
		getUuidOfUserId(function (errUuid, userUuid) {
			if (errUuid) {
				callback(errUuid);
				return;
			}

			emailService.getUserData(userUuid, function (err, data) {
				if (err) {
					consoleLogger.log(userId, 'fetch basic user info failed');

					callback(err);
					return;
				}

				callback(null, data);
			});
		});
	};
	this.getUserData = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataStore.getUserData: callback not provided");
		}

		if (!userId) {
			callback(new Error("User ID is not provided."));
			return;
		}

		let returnData = {};

		getUuidOfUserId(function (errUuid, userUuid) {
			if (errUuid) {
				callback(errUuid);
				return;
			}

			returnData.uuid = userUuid;

			self.getLivefyrePreferredUserId(function (errLfId, lfUserId) {
				if (errLfId) {
					callback(errLfId);
					return;
				}

				returnData.lfUserId = lfUserId;

				getStoredData(function (errCache, storedData) {
					if (errCache) {
						// fetch
						consoleLogger.log(userId, 'getUserData', 'error retrieving user data');
						consoleLogger.debug(userId, errCache);
						callback(errCache);
						return;
					}


					if (storedData) {
						if (storedData.pseudonym) {
							returnData.pseudonym = crypto.decrypt(storedData.pseudonym);
						}

						if (storedData.emailPreferences) {
							returnData.emailPreferences = storedData.emailPreferences;
						}

						if (storedData.hasOwnProperty('email') && storedData.hasOwnProperty('firstName') || storedData.hasOwnProperty('lastName')) {
							if (storedData.email) {
								returnData.email = crypto.decrypt(storedData.email);
							}
							if (storedData.firstName) {
								returnData.firstName = crypto.decrypt(storedData.firstName);
							}
							if (storedData.lastName) {
								returnData.lastName = crypto.decrypt(storedData.lastName);
							}

							callback(null, returnData);
							return;
						} else {
							fetchBasicUserInfo(function (errFetch, basicUserInfo) {
								if (errFetch) {
									callback(errFetch);
									return;
								}

								if (basicUserInfo) {
									if (basicUserInfo.hasOwnProperty('email')) {
										returnData.email = basicUserInfo.email;
									}
									if (basicUserInfo.hasOwnProperty('firstName')) {
										returnData.firstName = basicUserInfo.firstName;
									}
									if (basicUserInfo.hasOwnProperty('lastName')) {
										returnData.lastName = basicUserInfo.lastName;
									}

									self.updateBasicUserData(basicUserInfo, function () {});
								}

								callback(null, returnData);
							});
						}
					} else {
						fetchBasicUserInfo(function (errFetch, basicUserInfo) {
							if (errFetch) {
								callback(errFetch);
								return;
							}

							if (basicUserInfo) {
								if (basicUserInfo.hasOwnProperty('email')) {
									returnData.email = basicUserInfo.email;
								}
								if (basicUserInfo.hasOwnProperty('firstName')) {
									returnData.firstName = basicUserInfo.firstName;
								}
								if (basicUserInfo.hasOwnProperty('lastName')) {
									returnData.lastName = basicUserInfo.lastName;
								}

								self.updateBasicUserData(basicUserInfo, function () {});
							}

							callback(null, returnData);
						});
					}
				});
			});
		});
	};


	this.updateBasicUserData = function (userData, callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataStore.updateBasicUserData: callback not provided");
		}

		if (!userId) {
			callback(new Error("User ID is not provided."));
			return;
		}

		getStoredData(function (errCache, storedData) {
			if (errCache) {
				// fetch
				consoleLogger.log(userId, 'getEmailPreferences', 'error retrieving email preferences');

				callback(errCache);
				return;
			}

			let upsertData = {};
			if (userData.hasOwnProperty('email')) {
				upsertData.email = crypto.encrypt(userData.email);
			} else if (!storedData || !storedData.hasOwnProperty('email')) {
				upsertData.email = null;
			}

			if (userData.hasOwnProperty('firstName')) {
				upsertData.firstName = crypto.encrypt(userData.firstName);
			} else if (!storedData || !storedData.hasOwnProperty('firstName')) {
				upsertData.firstName = null;
			}

			if (userData.hasOwnProperty('lastName')) {
				upsertData.lastName = crypto.encrypt(userData.lastName);
			} else if (!storedData || !storedData.hasOwnProperty('lastName')) {
				upsertData.lastName = null;
			}

			upsertStoredData(upsertData, function (err) {
				if (err) {
					consoleLogger.log(userId, 'failed to update basic info');
					consoleLogger.debug(userId, 'upsert data', upsertData);

					callback(err);
					return;
				}

				callback();
			});
		});
	};
};
module.exports = UserDataStore;
