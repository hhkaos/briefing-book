define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/Deferred",
	"dojo/_base/lang",
	"dijit/_WidgetBase",
	"dijit/Dialog",
	"dojo/dom-construct",
	"dojo/dom-attr",
	"dojo/dom-style",
	"dojo/dom-class",
	"dojo/dom",
	"dojo/on",
	"dojo/query",
	"dojo/i18n!nls/localizedStrings"
], function (declare, array, deferred, lang, _WidgetBase, Dialog, domConstruct, domAttr, domStyle, domClass, dom, on, query, nls) {
	return declare([_WidgetBase], {
		postCreate: function () {
			var _self = this, alertDialogContent, alertButtons;

			this.domNode = new Dialog({
				"class": "esriAlertDialog",
				draggable: false
			});
			this.domNode.startup();
			this.domNode.closeButtonNode.title = nls.closeButtonTitle;
			alertDialogContent = domConstruct.create("div", { "clasS": "esriAlertDialogContent" }, null);
			this.alertDialogText = domConstruct.create("div", { "class": "esriAlertDialogText", "innerHTML": "enter Text here" }, alertDialogContent);
			alertButtons = domConstruct.create("div", { "class": "esriAlertButtonContainer" }, alertDialogContent);
			this.button2 = domConstruct.create("div", { "class": "esriAlertCancelBtn", "innerHTML": nls.cancelButtonText, "value": "1" }, alertButtons);
			this.button1 = domConstruct.create("div", { "class": "esriAlertOkBtn", "innerHTML": nls.okButtonText, "value": "0" }, alertButtons);
			on(this.button1, "click", function () {
				_self._hide(this);
			});
			on(this.button2, "click", function () {
				_self._hide(this);
			});
			this.domNode.setContent(alertDialogContent);
		},

		_setContent: function (newContent, MessageBoxButtons) {
			this.defer = false;
			this.alertDialogText.innerHTML = newContent;
			if (MessageBoxButtons === 0) {
				domStyle.set(this.button2, "display", "none");
				this.domNode.titleNode.innerHTML = nls.alertDialogTitle;
			} else if (MessageBoxButtons === 1) {
				this.defer = new deferred();
				domStyle.set(this.button2, "display", "block");
				this.domNode.titleNode.innerHTML = nls.confirmDialogTitle;
			}
			this.domNode.show();
			this.domNode.resize();

			if (this.defer) {
				return this.defer.promise;
			}
		},

		_hide: function (btnNode) {
			var btnValue, value;
			btnValue = domAttr.get(btnNode, "value");
			value = btnValue == "0" ? true : false;
			this.domNode.hide();
			if (this.defer) {
				this.defer.resolve(value);
			}
		}
	});
});

