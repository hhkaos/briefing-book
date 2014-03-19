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
], function (declare, domConstruct, lang, array, domAttr, domStyle, dom, domClass, on, query, template, topic, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, nls, mapbookUtility) {
	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, mapbookUtility], {
		templateString: template,
		nls: nls,
		postCreate: function () {
			var _self = this, applicationHeaderDiv, reloadApp, paginationDiv;

			topic.subscribe("authoringModeHandler", function () {
				_self._displayHomePage();
				topic.publish("createBookListHandler");
			});
			applicationHeaderDiv = domConstruct.create("div", {}, dom.byId("mapBookHeaderContainer"));
			domConstruct.place(this.applicationHeaderParentContainer, applicationHeaderDiv);
			paginationDiv = domConstruct.create("span", { "id": "esriPaginationSpan" }, this.paginationDiv);

			this._createApplicationHeader();

			document["title"] = dojo.appConfigData.ApplicationName;
			domAttr.set(this.mapBookTitle, "innerHTML", dojo.appConfigData.ApplicationName);
			this._displayHomePage();

		},

		_createApplicationHeader: function () {
			this._setApplicationLogo();
			this._setApllicationFavicon();
			this._createHomeIcon();
			this._createNewBookIcon();
			this._createDeleteBookIcon();
			this._createCopyBookIcon();
			this._createRefreshIcon();
			this._createEditBookIcon();
			this._createSaveBookIcon();
			this._createDeletePageIcon();
			this._createTOCIcon();
			this._createSignInBtn();
        	},

        _setApplicationLogo: function () {
            domStyle.set(this.applicationLogoIcon, "background-image", 'url(' + dojo.appConfigData.ApplicationIcon + ')');
        },

        _setApllicationFavicon: function () {
            if (dom.byId('appFavicon')) {
                domAttr.set(dom.byId('appFavicon'), "href", dojo.appConfigData.ApplicationFavicon);
            }
        },

		_createHomeIcon: function () {
       		        var homeButtonDiv, confirmHomePageView, _self = this;
			homeButtonDiv = domConstruct.create("div", { "class": "esrihomeButtonIcon", "style": "display:none", "title": nls.homeTitle }, this.applicationHeaderWidgetsContainer);

			this.own(on(homeButtonDiv, "click", function () {
   			             confirmHomePageView = true;
					if (dojo.bookInfo[dojo.currentBookIndex].BookConfigData.UnSaveEditsExists) {
						confirmHomePageView = confirm(nls.validateUnSavedEdits);
					}
					if (confirmHomePageView) {
						_self._displayHomePage();
						topic.publish("destroyWebmapHandler");
						if (dojo.appConfigData.AuthoringMode) {
							_self._disableEditing();
						}
						_self._toggleContainer(dom.byId("divContentListPanel"), query(".esriTocIcon")[0], true);
				}
			}));
		},

		_createNewBookIcon: function () {
			var newBookIcon, _self = this;

			newBookIcon = domConstruct.create("div", { "class": "esriNewBookIcon", "title": nls.addBookTitle }, this.applicationHeaderWidgetsContainer);
			this.own(on(newBookIcon, "click", function () {
				_self._addNewBook();
			}));
		},

		_createDeleteBookIcon: function () {
			var enableDeleting, deleteBookIcon, _self = this;

			deleteBookIcon = domConstruct.create("div", { "class": "esriDeleteBookIcon", "title": nls.removeBookTitle }, this.applicationHeaderWidgetsContainer);
			this.own(on(deleteBookIcon, "click", function () {
				enableDeleting = true;
				if (domClass.contains(query('.esriDeleteBookIcon')[0], "esriHeaderIconSelected")) {
					enableDeleting = false;
				}
				_self._toggleDeleteBookOption(enableDeleting);
			}));
		},

		_createCopyBookIcon: function () {
            		var copyBookIcon, confirmCopy = true, _self = this;

			copyBookIcon = domConstruct.create("div", { "class": "esriCopyBookIcon", "title": nls.copyBookShelf }, this.applicationHeaderWidgetsContainer);
			this.own(on(copyBookIcon, "click", function () {
               		_self._toggleContainer(dom.byId("divContentListPanel"), query(".esriTocIcon")[0], true);
        	        if (dojo.bookInfo[dojo.currentBookIndex].BookConfigData.UnSaveEditsExists) {
                	    confirmCopy = confirm(nls.validateUnSavedEdits);
           		  } else {
					confirmCopy = confirm(nls.confirmCopyOfSelectedBook);
          		      }
					if (confirmCopy) {
						topic.publish("copySelectedBookHandler");
				}
			}));
		},

		_createRefreshIcon: function () {
			var refreshIcon;

			refreshIcon = domConstruct.create("div", { "class": "esriRefreshIcon", "title": nls.refreshBookTitle }, this.applicationHeaderWidgetsContainer);
			this.own(on(refreshIcon, "click", function () {
				reloadApp = confirm(nls.confirmAppReloading);
				if (reloadApp) {
					parent.location.reload();
				}
			}));
		},

		_createEditBookIcon: function () {
			var editBookIcon, _self = this;

			editBookIcon = domConstruct.create("div", { "class": "esriEditIcon", "style": "display:none", "title": nls.editTitle }, this.applicationHeaderWidgetsContainer);
			this.own(on(editBookIcon, "click", function () {
				_self._toggleEditMode(this);
			}));
		},
		_createSaveBookIcon: function () {
      		      var saveBookIcon, _self = this;

			saveBookIcon = domConstruct.create("div", { "class": "esriSaveIcon", "title": nls.saveBookShelf }, this.applicationHeaderWidgetsContainer);
			this.own(on(saveBookIcon, "click", function () {
            		_self._toggleContainer(dom.byId("divContentListPanel"), query(".esriTocIcon")[0], true);
				topic.publish("saveBookHandler");
			}));
		},

		_createDeletePageIcon: function () {
          		var deletePageIcon, _self = this;

			deletePageIcon = domConstruct.create("div", { "class": "esriDeleteIcon", "style": "display:none", "title": nls.deleteTitle }, this.applicationHeaderWidgetsContainer);
			this.own(on(deletePageIcon, "click", function () {
            		_self._toggleContainer(dom.byId("divContentListPanel"), query(".esriTocIcon")[0], true);
				confirmDeleting = confirm(nls.confirmPageDeleting);
				if (confirmDeleting) {
                			dojo.bookInfo[dojo.currentBookIndex].BookConfigData.UnSaveEditsExists = true;
					topic.publish("deletePageHandler");
				}
			}));
		},

		_createTOCIcon: function () {
			var tocIconDiv, _self = this;

			tocIconDiv = domConstruct.create("div", { "class": "esriTocIcon", "style": "display:none", "title": nls.tocTitle }, this.applicationHeaderWidgetsContainer);
			this.own(on(tocIconDiv, "click", function () {
				_self._toggleContainer(dom.byId("divContentListPanel"), this, false);
			}));
		},

        _createSignInBtn: function () {
            var divSignIn, _self = this;
            divSignIn = domConstruct.create("div", { "id": "userLogIn", "class": "esriLogInIcon", "title": nls.signInText }, this.applicationHeaderWidgetsContainer);
            this.own(on(divSignIn, "click", function () {
                _self._toggleContainer(dom.byId("divContentListPanel"), query(".esriTocIcon")[0], true);
                topic.publish("toggleUserLogInHandler");
            }));
        },
		_addNewBook: function () {
			var bookIndex, newBook;

			bookIndex = dojo.bookInfo.length;
			newBook = {};
			newBook.title = nls.mapbookDefaultTitle;
			newBook.UnSaveEditsExists = true;
			topic.publish("_getFullUserNameHandler", newBook);
			newBook.owner = dojo.currentUser;
			newBook.itemId = nls.defaultItemId;
			dojo.bookInfo[bookIndex] = {};
			dojo.bookInfo[bookIndex].ModuleConfigData = {};
			dojo.bookInfo[bookIndex].BookConfigData = newBook;

			if (dojo.bookInfo.length > 0) {
				domStyle.set(query('.esriDeleteBookIcon')[0], "display", "block");
			}
			topic.publish("addBookHandler", bookIndex);
			domClass.add(query(".esriEditIcon")[0], "esriHeaderIconSelected");
		},

		_displayHomePage: function () {
			if ("ontouchstart" in window) {
				dojo.appConfigData.AuthoringMode = false;
			}
			domStyle.set(query(".esriEditIcon")[0], "display", "none");
			domStyle.set(query(".esriDeleteIcon")[0], "display", "none");
			domStyle.set(query(".esriCopyBookIcon")[0], "display", "none");
			domStyle.set(query(".esriSaveIcon")[0], "display", "none");
			domStyle.set(dom.byId("esriMapPages"), "display", "none");
			domStyle.set(query(".esriTocIcon")[0], "display", "none");
			domStyle.set(query(".esriFooterDiv")[0], "display", "none");
			domStyle.set(query(".esrihomeButtonIcon")[0], "display", "none");
			domStyle.set(dom.byId("mapBookScrollContent"), "display", "block");
			domAttr.set(this.mapBookTitle, "innerHTML", dojo.appConfigData.ApplicationName);
			if (dojo.appConfigData.AuthoringMode) {
				domStyle.set(query('.esriDeleteBookIcon')[0], "display", "block");
				domStyle.set(query(".esriNewBookIcon")[0], "display", "block");
				domStyle.set(query(".esriRefreshIcon")[0], "display", "block");
				domStyle.set(query(".esrihomeButtonIcon")[0], "display", "none");
				domClass.remove(query('.esriSaveIcon')[0], "esriHeaderIconSelected");
			} else {
				domStyle.set(query('.esriDeleteBookIcon')[0], "display", "none");
				domStyle.set(query(".esriNewBookIcon")[0], "display", "none");
				domStyle.set(query(".esriRefreshIcon")[0], "display", "none");
			}
			domAttr.set(this.mapBookTitle, "innerHTML", dojo.appConfigData.ApplicationName);
			if (query(".esriPrevious")[0] && query(".esriNext")[0]) {
				domStyle.set(query(".esriPrevious")[0], "visibility", "hidden");
				domStyle.set(query(".esriNext")[0], "visibility", "hidden");
			}

		},

		_toggleEditMode: function (editBtn) {
			domStyle.set(query(".esrihomeButtonIcon")[0], "display", "block");
			domStyle.set(query(".esriCopyBookIcon")[0], "display", "block");
			if (domStyle.get(query(".esriMapBookEditPage")[0], "display") == "block") {
				this._disableEditing();
			} else {
				domClass.add(editBtn, "esriHeaderIconSelected");
				this._toggleContainer(dom.byId("divContentListPanel"), query(".esriTocIcon")[0], true);
				topic.publish("editMapBookHandler", true);
			}
		},

		_disableEditing: function () {
			var editButton = query(".esriEditIcon")[0];
			domClass.remove(editButton, "esriHeaderIconSelected");
			topic.publish("editMapBookHandler", false);
			return false;
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