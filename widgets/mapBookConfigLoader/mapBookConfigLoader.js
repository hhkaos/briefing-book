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
	"dojo/cookie",
	"esri/kernel",
	"esri/request",
	"esri/urlUtils",
	"esri/IdentityManager",
	"dojo/DeferredList",
	"dojo/_base/Deferred",
	"dojo/parser"
], function (declare, array, lang, _WidgetBase, domConstruct, domAttr, domStyle, domClass, dom, on, query, topic, nls, Portal, arcgisUtils, config, cookie, kernel, esriRequest, urlUtils, IdentityManager, DeferredList, Deferred) {
	return declare([_WidgetBase], {
		_portal: null,
		startup: function () {
			var _self = this, deferred;
			deferred = new Deferred();

			this._setApplicationTheme();
			topic.subscribe("saveBookHandler", function () {
				_self._saveSelectedBook();
			});

			topic.subscribe("deleteItemHandler", function () {
				_self._deleteBookItem();
			});

			topic.subscribe("copySelectedBookHandler", function () {
				_self._copyBookItem();
			});

			topic.subscribe("getFullUserNameHandler", function (newBook) {
				newBook.author = _self._getFullUserName();
			});

			topic.subscribe("loadSavedCredential", function (newBook) {
				_self._loadCredentials();
			});

			topic.subscribe("toggleUserLogInHandler", function () {
				if (!domClass.contains(dom.byId("userLogIn"), "esriLogOutIcon")) {
					_self._displayLoginDialog(false);
				} else {
					_self._portal.signOut().then(function () {
						_self._queryOrgItems(false);
						_self._removeCredentials();
						domClass.remove(dom.byId("userLogIn"), "esriLogOutIcon");
						domAttr.set(dom.byId("userLogIn"), "title", nls.signInText);
					});
				}
			});

			this._portal = new esri.arcgis.Portal(dojo.appConfigData.PortalURL);
			dojo.connect(_self._portal, 'onLoad', function () {
				_self._queryOrgItems(deferred);
			});
			return deferred.promise;
		},

		_displayLoginDialog: function (deferred) {

			var _self = this, queryParams;
			this._portal.signIn().then(function (loggedInUser) {
				domStyle.set(dom.byId("outerLoadingIndcator"), "display", "block");
				dojo.bookInfo = [];
				queryParams = {
					q: "tags:" + dojo.appConfigData.ConfigSearchTag,
					sortField: dojo.appConfigData.SortField,
					sortOrder: dojo.appConfigData.SortOrder,
					num: 100
				};
				_self._storeCredentials();
				dojo.appConfigData.AuthoringMode = true;
				domClass.add(dom.byId("userLogIn"), "esriLogOutIcon");
				domAttr.set(dom.byId("userLogIn"), "title", nls.signOutText);
				dojo.currentUser = loggedInUser.username;

				_self._portal.queryItems(queryParams).then(function (response) {
					dojo.bookInfo = [];
					topic.publish("destroyWebmapHandler");
					topic.publish("_getPortal", _self._portal);
					_self._createConfigurationPanel(deferred, response);

				});
			}, function (error) {
				if (error.httpCode === 403) {
					alert(nls.validateOrganizationUser);
					IdentityManager.credentials[0].destroy();
				}
				if (dom.byId("outerLoadingIndcator")) {
					domStyle.set(dom.byId("outerLoadingIndcator"), "display", "none");
				}
			});
		},

		_loadCredentials: function () {
			var idJson, idObject;
			if (this._supports_local_storage()) {
				idJson = window.localStorage.getItem(dojo.appConfigData.Credential);
			} else {
				if (cookie.isSupported()) {
					idJson = cookie(dojo.appConfigData.Credential);
				}
			}
			if (idJson && idJson !== "null" && idJson.length > 4) {
				idObject = JSON.parse(idJson);
				if (idObject.credentials[0].expires > Date.now()) {
					if (dojo.appConfigData.PortalURL === idObject.serverInfos[0].server) {
						kernel.id.initialize(idObject);
						this._displayLoginDialog(false);
					}
				}
			}
		},

		_supports_local_storage: function () {
			try {
				return "localStorage" in window && window["localStorage"] !== null;
			} catch (e) {
				return false;
			}
		},

		_removeCredentials: function () {

			if (this._supports_local_storage()) {
				window.localStorage.setItem(dojo.appConfigData.Credential, null, { expire: -1 });
			} else {
				if (cookie.isSupported()) {
					dojo.cookie(dojo.appConfigData.Credential, null, { expire: -1 });
				}
			}
		},

		_storeCredentials: function () {
			if (kernel.id.credentials.length === 0) {
				return;
			}
			var idString = JSON.stringify(kernel.id.toJson());
			if (this._supports_local_storage()) {
				window.localStorage.setItem(dojo.appConfigData.Credential, idString, { expires: 1 });
			} else {
				if (cookie.isSupported()) {
					cookie(dojo.appConfigData.Credential, idString, { expires: 1 });
				}
			}
		},

		_createConfigurationPanel: function (deferred, response) {
			var _self = this, deferArray, configData, deferList, bookIndex;
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
					itemInfo.BookConfigData.UnSaveEditsExists = false;
					defer.resolve(itemInfo);
				}, function (e) {
					defer.resolve();
				});
				return defer;
			});

			deferList = new DeferredList(deferArray);
			deferList.then(function (results) {
				for (bookIndex = 0; bookIndex < results.length; bookIndex++) {
					if (results[bookIndex][1]) {
						if (results[bookIndex][1].BookConfigData && results[bookIndex][1].ModuleConfigData) {
							dojo.bookInfo.push(results[bookIndex][1]);
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
				sortOrder: dojo.appConfigData.SortOrder,
				num: 100
			};

			_self._portal.queryItems(queryParams).then(function (response) {
				dojo.bookInfo = [];
				_self._createConfigurationPanel(deferred, response);
			}, function (error) {
				alert(nls.errorMessages.contentQueryError);
				domStyle.set(dom.byId("outerLoadingIndcator"), "display", "none");
			});
		},

		_saveSelectedBook: function () {
			var configObj, queryParam, currentItemId, requestUrl, requestType;
			domStyle.set(dom.byId("outerLoadingIndcator"), "display", "block");
			dojo.bookInfo[dojo.currentBookIndex].BookConfigData.UnSaveEditsExists = false;
			configObj = JSON.stringify(dojo.bookInfo[dojo.currentBookIndex]);
			queryParam = {
				itemType: "text",
				f: 'json',
				text: configObj,
				overwrite: true,
				url: parent.location.href
			};
			currentItemId = dojo.bookInfo[dojo.currentBookIndex].BookConfigData.itemId;
			if (currentItemId === nls.defaultItemId) {
				requestUrl = this._portal.getPortalUser().userContentUrl + '/addItem';
				queryParam.type = 'Web Mapping Application';
				queryParam.title = dojo.bookInfo[dojo.currentBookIndex].BookConfigData.title;
				queryParam.tags = dojo.appConfigData.ConfigSearchTag;
				requestType = "add";
			} else {
				requestUrl = this._portal.getPortalUser().userContentUrl + '/items/' + currentItemId + '/update';
				requestType = "update";
			}
			this._sendEsriRequest(queryParam, requestUrl, requestType);
		},

		_deleteBookItem: function () {
			var queryParam, currentItemId, requestUrl;
			domStyle.set(dom.byId("outerLoadingIndcator"), "display", "block");
			queryParam = {
				f: 'json',
				overwrite: true
			};
			currentItemId = dojo.bookInfo[dojo.currentBookIndex].BookConfigData.itemId;
			requestUrl = this._portal.getPortalUser().userContentUrl + '/items/' + currentItemId + '/delete';
			this._sendEsriRequest(queryParam, requestUrl, "delete", nls.errorMessages.deletingItemError);

		},

		_copyBookItem: function () {
			var configObj, bookTitle, queryParam, copiedConfig, requestUrl, requestType;

			bookTitle = nls.copyKeyword + dojo.bookInfo[dojo.currentBookIndex].BookConfigData.title;
			dojo.bookInfo[dojo.currentBookIndex].BookConfigData.copyProtected = false;
			domStyle.set(dom.byId("outerLoadingIndcator"), "display", "block");
			copiedConfig = lang.clone(dojo.bookInfo[dojo.currentBookIndex]);
			copiedConfig.BookConfigData.UnSaveEditsExists = false;
			copiedConfig.BookConfigData.title = bookTitle;
			copiedConfig.ModuleConfigData.CoverPage.title.text = bookTitle;
			copiedConfig.BookConfigData.author = this._portal.getPortalUser().fullName;
			configObj = JSON.stringify(copiedConfig);
			queryParam = {
				itemType: "text",
				f: 'json',
				text: configObj,
				tags: dojo.appConfigData.ConfigSearchTag,
				title: copiedConfig.BookConfigData.title,
				type: 'Web Mapping Application',
				url: parent.location.href
			};
			requestUrl = this._portal.getPortalUser().userContentUrl + '/addItem';
			requestType = "copy";
			this._sendEsriRequest(queryParam, requestUrl, requestType);
		},

		_sendEsriRequest: function (queryParam, requestUrl, reqType) {
			var _self = this;
			esriRequest({
				url: requestUrl,
				content: queryParam,
				async: false,
				handleAs: 'json'
			}, { usePost: true }).then(function (result) {
				if (result.success) {
					if (reqType === "add" || reqType === "update") {
						dojo.bookInfo[dojo.currentBookIndex].BookConfigData.itemId = result.id;
						domStyle.set(dom.byId("outerLoadingIndcator"), "display", "none");
					} else if (reqType === "copy" || reqType === "delete") {
						topic.publish("destroyWebmapHandler");
						setTimeout(function () {
							_self._displayLoginDialog(false);
						}, 2000);
					}
				}
			}, function (err) {
				_self._genrateErrorMessage(reqType, err);
				domStyle.set(dom.byId("outerLoadingIndcator"), "display", "none");
			});
		},

		_genrateErrorMessage: function (reqType, err) {
			var errorMsg;
			if (err.messageCode === "GWM_0003") {
				errorMsg = nls.errorMessages.permissionDenied;
			} else if (reqType === "add") {
				errorMsg = nls.errorMessages.addingItemError;
			} else if (reqType === "update") {
				errorMsg = nls.errorMessages.updatingItemError;
			} else if (reqType === "delete") {
				errorMsg = nls.errorMessages.deletingItemError;
			} else if (reqType === "copy") {
				errorMsg = nls.errorMessages.copyItemError;
			}
			alert(errorMsg);
		},

		_getFullUserName: function () {
			return this._portal.getPortalUser().fullName;
		},

		_getPortal: function () {
			return this._portal;
		},

		_setApplicationTheme: function () {
			var cssURL;
			switch (dojo.appConfigData.ApplicationTheme) {
				case "blue":
					cssURL = "themes/styles/theme_blue.css";
					break;

				case "grey":
					cssURL = "themes/styles/theme_grey.css";
					break;

				default:
					cssURL = "themes/styles/theme_grey.css";
					break;
			}
			if (dom.byId("appTheme")) {
				domAttr.set(dom.byId("appTheme"), "href", cssURL);
			}
		}
	});
});

