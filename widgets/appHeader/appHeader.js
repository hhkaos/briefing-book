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
    "dojo/i18n!nls/localizedStrings"
],
     function (declare, domConstruct, lang, array, domAttr, domStyle, dom, domClass, on, query, template, topic, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, nls) {
     	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
     		templateString: template,
     		nls: nls,

     		postCreate: function () {
     			var _self = this;
     			var applicationHeaderDiv, paginationDiv, homeButtonDiv, tocIconDiv, downloadBookIcon, newPageIcon, refreshIcon;
     			applicationHeaderDiv = domConstruct.create("div", {}, dom.byId("mapBookHeaderContainer"));
     			domConstruct.place(this.applicationHeaderParentContainer, applicationHeaderDiv);
     			paginationDiv = domConstruct.create("span", { "id": "esriPaginationSpan" }, this.paginationDiv);
     			homeButtonDiv = domConstruct.create("div", { "class": "esrihomeButtonIcon", "title": nls.homeTitle }, this.applicationHeaderWidgetsContainer);
     			this.own(on(homeButtonDiv, "click", function () {
     				domStyle.set(query(".esriFooterDiv")[0], "display", "none");
     				domStyle.set(dom.byId("esriMapPages"), "display", "none");
     				domStyle.set(dom.byId("mapBookScrollContent"), "display", "block");
     				domAttr.set(_self.mapBookTitle, "innerHTML", dojo.appConfigData.ApplicationName);
     				if (query(".esriPrevious")[0] && query(".esriNext")[0]) {
     					domStyle.set(query(".esriPrevious")[0], "visibility", "hidden");
     					domStyle.set(query(".esriNext")[0], "visibility", "hidden");
     				}
     				_self._toggleContainer(dom.byId("divContentListPanel"), query(".esriTocIcon")[0], true);
     				if (dojo.appConfigData.AuthoringMode) {
     					topic.publish("editMapBookHandler", false);
     					domClass.remove(query('.esriEditIcon')[0], "esriHeaderIconSelected");
     					domClass.remove(query('.esriTocIcon')[0], "esriHeaderIconSelected");
     					domStyle.set(query(".esriEditIcon")[0], "display", "none");
     					domStyle.set(query(".esriDeleteIcon")[0], "display", "none");
     					domStyle.set(query(".esriDownloadIcon")[0], "display", "block");
     					domStyle.set(query(".esriNewPageIcon")[0], "display", "block");
     					domStyle.set(query(".esriRefreshIcon")[0], "display", "block");
     				}
     				domStyle.set(query(".esriTocIcon")[0], "display", "none");
     				domStyle.set(query(".esrihomeButtonIcon")[0], "display", "none");

     			}));

     			if (dojo.appConfigData.AuthoringMode) {
     				newPageIcon = domConstruct.create("div", { "class": "esriNewPageIcon", "title": nls.addBookTitle }, this.applicationHeaderWidgetsContainer);
     				downloadBookIcon = domConstruct.create("div", { "class": "esriDownloadIcon", "title": nls.downloadBookShelf }, this.applicationHeaderWidgetsContainer);
     				refreshIcon = domConstruct.create("div", { "class": "esriRefreshIcon", "title": nls.refreshBookTitle }, this.applicationHeaderWidgetsContainer);
     				editPageIcon = domConstruct.create("div", { "class": "esriEditIcon", "style": "display:none", "title": nls.editTitle }, this.applicationHeaderWidgetsContainer);
     				deletePageIcon = domConstruct.create("div", { "class": "esriDeleteIcon", "style": "display:none", "title": nls.deleteTitle }, this.applicationHeaderWidgetsContainer);
     				this.own(on(refreshIcon, "click", function () {
     					parent.location.reload();
     				}));

     				this.own(on(deletePageIcon, "click", function () {
     					topic.publish("deletePageHandler");
     				}));

     				this.own(on(editPageIcon, "click", function () {
     					_self._toggleEditMode();
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
     		_toggleEditMode: function () {
     			domStyle.set(query(".esrihomeButtonIcon")[0], "display", "block");
     			domStyle.set(query(".esriDownloadIcon")[0], "display", "block");
     			if (domStyle.get(query(".esriMapBookEditPage")[0], "display") == "block") {
     				domClass.remove(editPageIcon, "esriHeaderIconSelected");
     				topic.publish("editMapBookHandler", false);
     			} else {
     				this._toggleContainer(dom.byId("divContentListPanel"), query(".esriTocIcon")[0], true);
     				topic.publish("editMapBookHandler", true);
     				domClass.add(editPageIcon, "esriHeaderIconSelected");
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