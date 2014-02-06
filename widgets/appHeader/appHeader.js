define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/dom-attr",
    "dojo/dom-style",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/on",
    "dojo/query",
    "dojo/text!./templates/appHeaderTemplate.html",
    "dojo/topic",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!nls/localizedStrings",
    "../mapBookCollection/mapbookUtility"

],
    function (declare, domConstruct, lang, array, domAttr, domStyle, dom, domClass, on, query, template, topic, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, nls, mapbookUtility) {
    	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, mapbookUtility], {
     		templateString: template,
     		nls: nls,
     		postCreate: function () {
     			var _self = this;
     			var applicationHeaderDiv, paginationDiv, homeButtonDiv, deleteBookIcon, tocIconDiv, downloadBookIcon, newBookIcon, refreshIcon;

     			if ("ontouchstart" in window) {
     				dojo.appConfigData.AuthoringMode = false;
     			}
     			applicationHeaderDiv = domConstruct.create("div", {}, dom.byId("mapBookHeaderContainer"));
     			domConstruct.place(this.applicationHeaderParentContainer, applicationHeaderDiv);
     			paginationDiv = domConstruct.create("span", { "id": "esriPaginationSpan" }, this.paginationDiv);
     			homeButtonDiv = domConstruct.create("div", { "class": "esrihomeButtonIcon", "title": nls.homeTitle }, this.applicationHeaderWidgetsContainer);
     			this.own(on(homeButtonDiv, "click", function () {
     				if (dojo.appConfigData.AuthoringMode) {
     					if (_self._disableEditing()) {
     						return 0;
     					}
     					domClass.remove(query('.esriTocIcon')[0], "esriHeaderIconSelected");
     					domStyle.set(query(".esriEditIcon")[0], "display", "none");
     					domStyle.set(query(".esriDeleteIcon")[0], "display", "none");
     					domStyle.set(query('.esriDeleteBookIcon')[0], "display", "block");
     					domStyle.set(query(".esriDownloadIcon")[0], "display", "block");
     					domStyle.set(query(".esriNewBookIcon")[0], "display", "block");
     					domStyle.set(query(".esriRefreshIcon")[0], "display", "block");
     				}
     				topic.publish("destroyWebmapHandler");
     				domStyle.set(query(".esriFooterDiv")[0], "display", "none");
     				domStyle.set(dom.byId("esriMapPages"), "display", "none");
     				domStyle.set(dom.byId("mapBookScrollContent"), "display", "block");
     				domAttr.set(_self.mapBookTitle, "innerHTML", dojo.appConfigData.ApplicationName);
     				if (query(".esriPrevious")[0] && query(".esriNext")[0]) {
     					domStyle.set(query(".esriPrevious")[0], "visibility", "hidden");
     					domStyle.set(query(".esriNext")[0], "visibility", "hidden");
     				}
     				_self._toggleContainer(dom.byId("divContentListPanel"), query(".esriTocIcon")[0], true);

     				domStyle.set(query(".esriTocIcon")[0], "display", "none");
     				domStyle.set(query(".esrihomeButtonIcon")[0], "display", "none");

     			}));

     			if (dojo.appConfigData.AuthoringMode) {
     				newBookIcon = domConstruct.create("div", { "class": "esriNewBookIcon", "title": nls.addBookTitle }, this.applicationHeaderWidgetsContainer);
     				deleteBookIcon = domConstruct.create("div", { "class": "esriDeleteBookIcon", "title": nls.removeBookTitle }, this.applicationHeaderWidgetsContainer);
     				downloadBookIcon = domConstruct.create("div", { "class": "esriDownloadIcon", "title": nls.downloadBookShelf }, this.applicationHeaderWidgetsContainer);
     				refreshIcon = domConstruct.create("div", { "class": "esriRefreshIcon", "title": nls.refreshBookTitle }, this.applicationHeaderWidgetsContainer);
     				editPageIcon = domConstruct.create("div", { "class": "esriEditIcon", "style": "display:none", "title": nls.editTitle }, this.applicationHeaderWidgetsContainer);
     				deletePageIcon = domConstruct.create("div", { "class": "esriDeleteIcon", "style": "display:none", "title": nls.deleteTitle }, this.applicationHeaderWidgetsContainer);
     				this.own(on(refreshIcon, "click", function () {
     					var reloadApp = confirm(nls.confirmAppReloading);
     					if (reloadApp) {
     						parent.location.reload();
     					}
     				}));

     				this.own(on(deleteBookIcon, "click", function () {
     					var enableDeleting = true;
     					if (domClass.contains(query('.esriDeleteBookIcon')[0], "esriHeaderIconSelected")) {
     						enableDeleting = false;
     					}
     					_self._toggleDeleteBookOption(enableDeleting);
     				}));
     				this.own(on(deletePageIcon, "click", function () {
     					var deletePage = confirm(nls.confirmPageDeleting);
     					if (deletePage) {
     						topic.publish("deletePageHandler");
     					}
     				}));

     				this.own(on(editPageIcon, "click", function () {
     					_self._toggleEditMode(this);
     				}));

     				this.own(on(newBookIcon, "click", function () {
     					_self._addNewBook();
     				}));
     				this.own(on(downloadBookIcon, "click", function () {
     				}));
     			}

     			tocIconDiv = domConstruct.create("div", { "class": "esriTocIcon", "title": nls.tocTitle }, this.applicationHeaderWidgetsContainer);
     			this.own(on(tocIconDiv, "click", function () {
     				_self._toggleContainer(dom.byId("divContentListPanel"), this, false);
     			}));

     			document["title"] = dojo.appConfigData.ApplicationName;
     			domAttr.set(this.mapBookTitle, "innerHTML", dojo.appConfigData.ApplicationName);
     			domStyle.set(query(".esrihomeButtonIcon")[0], "display", "none");
     			domStyle.set(query(".esriTocIcon")[0], "display", "none");
     		},

     		_addNewBook: function () {
     			var bookIndex, newBook, newBookModule;
     			bookIndex = dojo.bookListData.Books.length;
     			newBook = {};
    			newBook.title = nls.mapbookDefaultTitle;
    			newBook.author = nls.authorName;
     			newBookModule = {};
     			dojo.moduleData[bookIndex] = newBookModule;
     			dojo.bookListData.Books[bookIndex] = newBook;
     			domClass.add(query(".esriEditIcon")[0], "esriHeaderIconSelected");
     			if (dojo.bookListData.Books.length > 0) {
     				domStyle.set(query('.esriDeleteBookIcon')[0], "display", "block");
     				domStyle.set(query('.esriDownloadIcon')[0], "display", "block");
     			}
     			topic.publish("addBookHandler", bookIndex);
     		},

     		_toggleEditMode: function (editBtn) {
     			domStyle.set(query(".esrihomeButtonIcon")[0], "display", "block");
     			domStyle.set(query(".esriDownloadIcon")[0], "display", "block");
     			if (domStyle.get(query(".esriMapBookEditPage")[0], "display") == "block") {
     				if (this._disableEditing()) {
     					return 0;
     				}
     			} else {
     				this._toggleContainer(dom.byId("divContentListPanel"), query(".esriTocIcon")[0], true);
     				topic.publish("editMapBookHandler", true);
     				domClass.add(editBtn, "esriHeaderIconSelected");
     			}
     		},

     		_disableEditing: function () {
     			var editButton = query(".esriEditIcon")[0];
     			if (!domClass.contains(editButton, "disableEditing")) {
     				domClass.remove(editButton, "esriHeaderIconSelected");
     				topic.publish("editMapBookHandler", false);
     				return false;
     			} else {
     				alert(nls.errorMessages.moduleFieldsEmpty);
     				return true;
     			}
     		},

     		_toggleContainer: function (container, btnNode, hideContainer) {
     			if (hideContainer) {
     				domClass.remove(container, "esriContentPanelOpened");
     				domClass.remove(btnNode, "esriHeaderIconSelected");
     			} else {
     				if (domClass.contains(container, "esriContentPanelOpened")) {
     					domClass.remove(container, "esriContentPanelOpened");
     					domClass.remove(btnNode, "esriHeaderIconSelected");
     				} else {
     					domClass.add(container, "esriContentPanelOpened");
     					domClass.add(btnNode, "esriHeaderIconSelected");
     				}
     			}
     		}
     	});
     });