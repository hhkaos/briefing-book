define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dijit/_WidgetBase",
	"dojo/dom-construct",
	"dojo/dom-attr",
	"dojo/dom-style",
	"dojo/dom-class",
	"dojo/dom",
	"dojo/on",
	"dojo/query",
	"dojo/topic",
	"dojo/i18n!nls/localizedStrings",
	"esri/arcgis/Portal",
	"esri/arcgis/utils",
	"esri/config",
	"esri/request",
	"esri/urlUtils",
	"esri/IdentityManager",
	"dojo/DeferredList",
	"dojo/_base/Deferred",
	"dojo/parser"
], function (declare, array, lang, _WidgetBase, domConstruct, domAttr, domStyle, domClass, dom, on, query, topic, nls, Portal, arcgisUtils, config, esriRequest, urlUtils, IdentityManager, DeferredList, Deferred) {
	return declare([_WidgetBase], {
		_portal: null,
		startup: function () {
			var _self = this, deferred;
			deferred = new Deferred();

			topic.subscribe("_saveBookHandler", function (selectedBookIndex) {
				_self._saveSelectedBook(selectedBookIndex);
			});

			topic.subscribe("deleteItemHandler", function (selectedBookIndex) {
				_self._deleteBookItem(selectedBookIndex);
			});

			topic.subscribe("_copySelectedBookHandler", function (selectedBookIndex) {
				_self._copyBookItem(selectedBookIndex);
			});

			topic.subscribe("_getFullUserNameHandler", function (newBook) {
				newBook.author = _self._getFullUserName();
			});

			topic.subscribe("toggleUserLogInHandler", function () {
				if (dom.byId("userLogIn").innerHTML == nls.signInText) {
					_self._displayLoginDialog(Deferred);
				} else {
					_self._portal.signOut().then(function () {
						_self._queryOrgItems(false);
						dom.byId("userLogIn").innerHTML = nls.signInText;
					});
				}
			});

			this._portal = new esri.arcgis.Portal(dojo.appConfigData.PortalURL);
			dojo.connect(_self._portal, 'onLoad', function () {
				_self._queryOrgItems(deferred);
			});
			return deferred;
		},

		_displayLoginDialog: function (deferred) {

			var _self = this, queryParams;
			this._portal.signIn().then(function (loggedInUser) {
				domStyle.set(dom.byId("outerLoadingIndcator"), "display", "block");
				dojo.bookInfo = [];
				queryParams = {
					q: "tags:" + dojo.appConfigData.ConfigSearchTag,
					sortField: dojo.appConfigData.SortField,
					sortOrder: dojo.appConfigData.SortOrder
				};
				dojo.appConfigData.AuthoringMode = true;
				dom.byId("userLogIn").innerHTML = nls.signOutText;
				dojo.currentUser = loggedInUser.username;

				_self._portal.queryItems(queryParams).then(function (response) {
					topic.publish("destroyWebmapHandler");
					if (response.results.length > 0) {
						_self._createConfigurationPanel(false, response);
					} else {
						domStyle.set(dom.byId("outerLoadingIndcator"), "display", "none");
					}
				});
			}, function (error) {
				if (error.message !== "ABORTED") {
					alert(nls.validateOrganizationUser);
					IdentityManager.credentials[0].destroy();
					domStyle.set(dom.byId("outerLoadingIndcator"), "display", "none");
				}
			});
		},

		_createConfigurationPanel: function (deferred, response) {
			var _self = this, deferArray, configData, deferList;
			deferArray = [];
			array.forEach(response.results, function (itemData) {
				var defer = new Deferred();
				deferArray.push(defer);
				configData = esriRequest({
					url: itemData.itemDataUrl,
					itemId: itemData.id,
					handleAs: "json"
				});
				configData.then(function (itemInfo) {
					itemInfo.BookConfigData.itemId = itemData.id;
					itemInfo.BookConfigData.owner = itemData.owner;
					defer.resolve(itemInfo);
				}, function (e) {
					defer.resolve();
				});
				return defer;
			});

			deferList = new DeferredList(deferArray);
			deferList.then(function (results) {
				for (var i = 0; i < results.length; i++) {
					if (results[i][1]) {
						if (results[i][1].BookConfigData && results[i][1].ModuleConfigData) {
							dojo.bookInfo.push(results[i][1]);
						}
					}
				}
				if (deferred) {
					deferred.resolve();
				} else {
					topic.publish("authoringModeHandler");
				}
			});
		},

		_queryOrgItems: function (deferred) {
			var _self = this, queryParams;
			dojo.appConfigData.AuthoringMode = false;
			queryParams = {
				q: "tags:" + dojo.appConfigData.ConfigSearchTag,
				sortField: dojo.appConfigData.SortField,
				sortOrder: dojo.appConfigData.SortOrder
			};

			_self._portal.queryItems(queryParams).then(function (response) {
				dojo.bookInfo = [];
				_self._createConfigurationPanel(deferred, response);
			}, function (error) {
				alert(nls.errorMessages.contentQueryError);
				domStyle.set(dom.byId("outerLoadingIndcator"), "display", "none");
			});
		},

		_saveSelectedBook: function (selectedBookIndex) {
			var configObj, queryParam, currentItemId, requestUrl, requestType;
			domStyle.set(dom.byId("outerLoadingIndcator"), "display", "block");
			configObj = JSON.stringify(dojo.bookInfo[selectedBookIndex]);
			queryParam = {
				itemType: "text",
				f: 'json',
				text: configObj,
				overwrite: true
			};
			currentItemId = dojo.bookInfo[selectedBookIndex].BookConfigData.itemId;
			if (currentItemId == nls.defaultItemId) {
				requestUrl = this._portal.getPortalUser().userContentUrl + '/addItem';
				queryParam.type = 'Web Mapping Application';
				queryParam.title = dojo.bookInfo[selectedBookIndex].BookConfigData.title;
				queryParam.tags = dojo.appConfigData.ConfigSearchTag;
				requestType = "add";
			} else {
				requestUrl = this._portal.getPortalUser().userContentUrl + '/items/' + currentItemId + '/update';
				requestType = "update";
			}
			this._sendEsriRequest(queryParam, requestUrl, requestType, selectedBookIndex);
		},

		_deleteBookItem: function (selectedBookIndex) {
			domStyle.set(dom.byId("outerLoadingIndcator"), "display", "block");

			var queryParam, currentItemId, requestUrl;
			queryParam = {
				f: 'json',
				overwrite: true
			};
			currentItemId = dojo.bookInfo[selectedBookIndex].BookConfigData.itemId;
			requestUrl = this._portal.getPortalUser().userContentUrl + '/items/' + currentItemId + '/delete';
			this._sendEsriRequest(queryParam, requestUrl, "delete", nls.errorMessages.deletingItemError, selectedBookIndex);

		},

		_copyBookItem: function (selectedBookIndex) {
			var configObj, bookTitle, queryParam, currentItemId, requestUrl, requestType;

			bookTitle = nls.copyKeyword + dojo.bookInfo[selectedBookIndex].BookConfigData.title;
			domStyle.set(dom.byId("outerLoadingIndcator"), "display", "block");
			dojo.bookInfo[selectedBookIndex].BookConfigData.title = bookTitle;
			dojo.bookInfo[selectedBookIndex].ModuleConfigData.CoverPage.title.text = bookTitle;
			dojo.bookInfo[selectedBookIndex].BookConfigData.author = this._portal.getPortalUser().fullName;
			configObj = JSON.stringify(dojo.bookInfo[selectedBookIndex]);
			queryParam = {
				itemType: "text",
				f: 'json',
				text: configObj,
				tags: dojo.appConfigData.ConfigSearchTag,
				title: dojo.bookInfo[selectedBookIndex].BookConfigData.title,
				type: 'Web Mapping Application'
			};
			requestUrl = this._portal.getPortalUser().userContentUrl + '/addItem';
			requestType = "copy";
			this._sendEsriRequest(queryParam, requestUrl, requestType, selectedBookIndex);
		},

		_sendEsriRequest: function (queryParam, requestUrl, reqType, selectedBookIndex) {
			var _self = this;
			esriRequest({
				url: requestUrl,
				content: queryParam,
				async: false,
				handleAs: 'json'
			}, { usePost: true }).then(function (result) {
				if (result.success) {
					if (reqType == "add" || reqType == "update") {
						dojo.bookInfo[dojo.currentBookIndex].BookConfigData.UnSaveEditsExists = false;
						dojo.bookInfo[selectedBookIndex].BookConfigData.itemId = result.id;
						domStyle.set(dom.byId("outerLoadingIndcator"), "display", "none");
					} else if (reqType == "copy" || reqType == "delete") {
						topic.publish("destroyWebmapHandler");
						setTimeout(function () {
							_self._displayLoginDialog(false);
						}, 1000);
					}
				}
			}, function (err) {
				_self._genrateErrorMessage(reqType);
				domStyle.set(dom.byId("outerLoadingIndcator"), "display", "none");
			});
		},

		_genrateErrorMessage: function (reqType) {
			var errorMsg;
			if (reqType == "add") {
				errorMsg = nls.errorMessages.addingItemError;
			} else if (reqType == "update") {
				errorMsg = nls.errorMessages.updatingItemError;
			} else if (reqType == "delete") {
				errorMsg = nls.errorMessages.deletingItemError;
			} else if (reqType == "copy") {
				errorMsg = nls.errorMessages.copyItemError;
			}
			alert(errorMsg);
		},

		_getFullUserName: function () {
			return this._portal.getPortalUser().fullName;
		}
	});
});

