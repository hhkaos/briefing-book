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
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!nls/localizedStrings"
    ],
     function (declare, domConstruct, lang, array, domAttr, domStyle, dom, domClass, on, query, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, nls) {

         //========================================================================================================================//

         return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
             templateString: template,
             nls: nls,

             postCreate: function () {
                 var applicationHeaderDiv, paginationDiv, homeButtonDiv, tocIconDiv;
                 applicationHeaderDiv = domConstruct.create("div", {}, dom.byId("mapBookContainer"));
                 domConstruct.place(this.applicationHeaderParentContainer, applicationHeaderDiv);
                 paginationDiv = domConstruct.create("span", { "id": "esriPaginationSpan" }, this.esriPaginationDiv);
                 homeButtonDiv = domConstruct.create("div", { "class": "esrihomeButtonIcon", "title": "Home" }, this.applicationHeaderWidgetsContainer);
                 this.own(on(homeButtonDiv, "click", lang.hitch(this, function () {
                     domStyle.set(this.esriPaginationDiv, "display", "none");
                     domStyle.set(dom.byId("esriMapPages"), "display", "none");
                     domStyle.set(query(".esriMapBookContent")[0], "display", "block");
                     domStyle.set(dom.byId("mapBookTitle"), "innerHTML", dojo.appConfigData.ApplicationName);
                     if (query(".esriPrevious")[0] && query(".esriNext")[0]) {
                         domStyle.set(query(".esriPrevious")[0], "visibility", "hidden");
                         domStyle.set(query(".esriNext")[0], "visibility", "hidden");
                     }
                     if (domClass.contains(dom.byId("divContentListPanel"), "esriContentPanelOpened")) {
                         domClass.remove(dom.byId("divContentListPanel"), "esriContentPanelOpened");
                     }
                     if (dojo.appConfigData.AuthoringMode) {
                         domStyle.set(query(".esrihomeButtonIcon")[0], "display", "none");
                         domStyle.set(query(".esriTocIcon")[0], "display", "none");
                     }
                 })));
                 tocIconDiv = domConstruct.create("div", { class: "esriTocIcon", title: "TOC" }, this.applicationHeaderWidgetsContainer);
                 this.own(on(tocIconDiv, "click", lang.hitch(this, function () {
                     this._toggleContainer(dom.byId("divContentListPanel"), tocIconDiv);
                 })));

                 document["title"] = dojo.appConfigData.ApplicationName;
                 domAttr.set(dom.byId("mapBookTitle"), "innerHTML", dojo.appConfigData.ApplicationName);
                 if (dojo.appConfigData.AuthoringMode) {
                     domStyle.set(query(".esrihomeButtonIcon")[0], "display", "none");
                     domStyle.set(query(".esriTocIcon")[0], "display", "none");

                 }
             },

             _toggleContainer: function (container, btnNode) {
                 var _this = this;
                 if (!domClass.contains(container, "esriContentPanelOpened")) {
                     domClass.add(container, "esriContentPanelOpened");
                 } else {
                     domClass.remove(container, "esriContentPanelOpened");
                 }
             }
         });
     });