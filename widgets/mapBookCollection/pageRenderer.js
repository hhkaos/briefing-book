define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/dom-style",
    "dojo/dom-class",
    "dojo/dom",
    "dojo/on",
    "dojo/query",
    "dojo/i18n!nls/localizedStrings",
    "dijit/Dialog",
    "dojo/parser"
], function (declare, array, lang, domConstruct, domAttr, domStyle, domClass, dom, on, query, nls, Dialog) {
	return declare([], {

		_renderPages: function (pages) {
			var page, mapBookUList, settingDialog;
			mapBookUList = domConstruct.create("ul", { "id": "mapBookPagesUList", "class": "esriMapBookUList" }, null);
			dom.byId("esriMapPages").appendChild(mapBookUList);
			if (pages.length >= 1) {
				domStyle.set(query(".esriPrevious")[0], "visibility", "visible");
				domStyle.set(query(".esriNext")[0], "visibility", "visible");
				if (pages.length == 1) {
					domClass.replace(this.mapBookNextPage, "esriNextDisabled", "esriNext");
				}
				for (var i = 0; i < pages.length; i++) {
					if (pages[i] == "EmptyContent") {
					} else {
						page = pages[i];
						page.index = i;
						this._renderPage(pages[i]);
					}
				}
			}
			this._destroyExistingNode(dijit.byId("settingDialog"), true);
			settingDialog = new Dialog({
				id: "settingDialog",
				draggable: false
			});
			settingDialog.startup();
			settingDialog.closeButtonNode.title = nls.closeButtonTitle;
			settingDialog.hide();
			this._renderEditPage();
		},

		_renderPage: function (page) {
			var _self = this, listItem, pageHeight, currentPage;
			listItem = domConstruct.create("li", { "class": "esriMapBookPageListItem" }, null);
			dom.byId("mapBookPagesUList").appendChild(listItem);
			this.currentIndex = page.index;
			currentPageContainer = domConstruct.create("div", { "class": "esriMapBookPage", "pageIndex": page.index }, listItem);
			this.slidingPages.push(currentPageContainer);
			domStyle.set(currentPageContainer, "width", Math.ceil(dom.byId("mapBookContentContainer").offsetWidth) + 'px');
			this._createPageLayout(page, currentPageContainer);
			pageHeight = dojo.window.getBox().h - domStyle.get(dom.byId("mapBookHeaderContainer"), "height") - 5;

			if (this.isEditModeEnable) {
				if (query(".esriEditPageHeader")[0]) {
					domStyle.set(currentPageContainer, "margin-top", domStyle.get(query(".esriEditPageHeader")[0], "height") + 'px');
					pageHeight -= domStyle.get(query(".esriEditPageHeader")[0], "height");
					currentPageContainer.style.marginTop = domStyle.get(query(".esriEditPageHeader")[0], "height") + 'px';
				}
			}
			if (page.index > 1) {
				if (query(".esriFooterDiv")[0]) {
					pageHeight -= domStyle.get(query(".esriFooterDiv")[0], "height");
				}
			}
			domStyle.set(currentPageContainer, "height", pageHeight + 'px');
		},

		_createCoverPage: function () {
			var coverPage, defaultTitle;
			if (!dojo.bookInfo[dojo.currentBookIndex].ModuleConfigData) {
				dojo.bookInfo[dojo.currentBookIndex].ModuleConfigData = {};
			}
			defaultTitle = lang.clone(dojo.appConfigData.ModuleDefaultsConfig.title);
			defaultTitle.text = dojo.bookInfo[dojo.currentBookIndex].BookConfigData.title;
			coverPage = lang.clone(dojo.appConfigData.CoverPageLayout);
			coverPage.title = defaultTitle.text;
			dojo.bookInfo[dojo.currentBookIndex].BookConfigData["CoverPage"] = coverPage;
			dojo.bookInfo[dojo.currentBookIndex].ModuleConfigData["CoverPage"] = {};
			this._removeClass(this.mapBookNextPage, "esriNextDisabled");
			return coverPage;
		},

		_renderEditPage: function () {
			var divEditPage, isModuleValid, divEditPageHeader, divEditPageList, imgEditCoverPage, imgEditContentPage, divAddNewPage, tempContHeight, divEditPageBody, divPageSlider, _self = this;

			divEditPage = domConstruct.create("div", { "class": "esriMapBookEditPage" }, dom.byId('esriMapPages'));
			divEditPageHeader = domConstruct.create("div", { "class": "esriEditPageHeader" }, divEditPage);
			divEditPageList = domConstruct.create("div", { "class": "esriEditPageOptionList" }, divEditPageHeader);
			if (dojo.bookInfo[dojo.currentBookIndex].BookConfigData.CoverPage) {
				optionListimg = domConstruct.create("div", { "class": "esriEditPageOptionListImg" }, divEditPageList);
				imgEditCoverPage = domConstruct.create("div", { "index": 0, "class": "esriEditPageImg esriBookPage esriPageSelected", "style": "background:url('themes/images/coverpage.png')" }, optionListimg);
				imgEditCoverPage.innerHTML = "Cover Page";
				on(imgEditCoverPage, "click", function () {
					_self._gotoPage(0);
				});
			}
			optionListimg = domConstruct.create("div", { "class": "esriEditPageOptionListImg" }, divEditPageList);
			imgEditContentPage = domConstruct.create("div", { "index": 1, "class": "esriEditPageImg esriBookPage", "style": "background:url('themes/images/content-temp.png')" }, optionListimg);
			imgEditContentPage.innerHTML = "Content Page";
			on(imgEditContentPage, "click", function () {
				if (dojo.bookInfo[dojo.currentBookIndex].BookConfigData.ContentPage) {
					_self._gotoPage(1);
				} else {
					_self._toggleEditPageVisibility(true);
				}
			});

			divAddNewPage = domConstruct.create("div", { "class": "esriAddNewPageDiv" }, divEditPageHeader);
			domConstruct.create("div", { "class": "esriAddNewPageImg" }, divAddNewPage);
			domConstruct.create("div", { "class": "esriAddNewPageLabel", "innerHTML": nls.addPageTitle }, divAddNewPage);
			divEditPageBody = domConstruct.create("div", { "class": "esriEditPageBody" }, divEditPage);
			divPageSlider = domConstruct.create("div", { "class": "esriPageSliderContainer" }, divEditPageHeader);
			_self._createPageSlider();
			_self._createDnDModuleList();
			_self._renderTemplateOptionPage(divEditPageBody, dojo.appConfigData.BookPageLayouts, true);
			_self._renderTemplateOptionPage(divEditPageBody, dojo.appConfigData.ContentPageLayouts, false);
			tempContHeight = dojo.window.getBox().h - domStyle.get(dom.byId("mapBookHeaderContainer"), "height") - domStyle.get(query(".esriEditPageHeader")[0], "height") - 10;
			domStyle.set(divEditPageBody, "height", tempContHeight + 'px');
			on(divAddNewPage, "click", function () {
				if (query('.esriEditPageBody')[0]) {
					_self._clearTemplateSelection();
					_self._toggleEditPageVisibility(false);

				}
			});
			if (_self.isEditModeEnable) {
				_self._enableMapBookEditing();
				domStyle.set(query('.esriMapBookEditPage')[0], "display", "block");
			}
		},

		_renderTemplateOptionPage: function (divEditPageBody, configLayout, isBookPageLayout) {
			var _self = this, divTitle, divOuter, layoutType, templateType, divTemplateContainer, divTemplatelist, divEditPageBodyContent, divEditPageFooter, divAddPage, divCancel, tempIndex;
			if (isBookPageLayout) {
				layoutType = "pageLayoutOption";
			} else {
				layoutType = "contentLayoutOption";
			}
			divEditPageBodyContent = domConstruct.create("div", { "class": layoutType }, divEditPageBody);
			divTitle = domConstruct.create("div", { "class": "esriLabelSelectlayout", "innerHTML": nls.selectAnyLayout }, divEditPageBodyContent);
			divOuter = domConstruct.create("div", { "class": "esriTemplateOuterDiv" }, divEditPageBodyContent);
			array.forEach(configLayout, function (layoutOption, index) {
				divTemplateContainer = domConstruct.create("div", { "class": "esriTemplateContainer" }, divOuter);
				divTemplatelist = domConstruct.create("img", { "isBookPageLayout": isBookPageLayout, "class": "esriTemplateImage", "src": layoutOption.templateIcon, "index": index }, divTemplateContainer);
				on(divTemplatelist, "click", function () {
					templateType = domAttr.get(this, "isBookPageLayout");
					_self._clearTemplateSelection(templateType);
					tempIndex = domAttr.get(this, "index");
					if (!domClass.contains(this, "selectedTemplate")) {
						domClass.add(this, "selectedTemplate");
						domAttr.set(this, "src", configLayout[tempIndex].selectedTemplateIcon);
					}
				});
				on(divTemplatelist, "dblclick", function () {
					_self._createNewPageLayout(this);
				});
			});
			divEditPageFooter = domConstruct.create("div", { "class": "esriEditPageFooter" }, divEditPageBodyContent);
			divAddPage = domConstruct.create("div", { "isBookPageLayout": isBookPageLayout, "class": "esriAddBtn", "innerHTML": nls.addPageText }, divEditPageFooter);
			divCancel = domConstruct.create("div", { "class": "esriCancelBtn", "innerHTML": nls.cancelText }, divEditPageFooter);
			on(divAddPage, "click", function () {
				_self._createNewPageLayout(this);
			});
			on(divCancel, "click", function () {
				_self._togglePageNavigation(true);
				domStyle.set(query('.esriEditPageBody')[0], "display", "none");
				domStyle.set(query('.esriMapBookEditPage')[0], "height", "auto");
			});
		},

		_createNewPage: function (isBookPageLayout) {
			var selectedTempIndex, newPage = {}, pageIndex, flag = false, currentPageIndex = this.currentIndex;

			selectedTempIndex = parseInt(domAttr.get(query('.selectedTemplate')[0], "index"));
			pageIndex = this.mapBookDetails[dojo.currentBookIndex].length;

			if (isBookPageLayout) {
				if (!dojo.bookInfo[dojo.currentBookIndex].BookConfigData.ContentPage) {
					if (this.mapBookDetails[dojo.currentBookIndex][1] == "EmptyContent") {
					} else {
						this.mapBookDetails[dojo.currentBookIndex].push("EmptyContent")
						pageIndex++;
					}
				}
				newPage = dojo.appConfigData.BookPageLayouts[selectedTempIndex];
				newPage.type = "BookPages";
				if (currentPageIndex > 0 && currentPageIndex !== pageIndex - 1) {
					pageIndex = currentPageIndex + 1;
					flag = true;
				}
				newPage.title = "Page " + (pageIndex - 1);
				newPage.index = this.mapBookDetails[dojo.currentBookIndex].length;
			} else {
				if (this.mapBookDetails[dojo.currentBookIndex][1] == "EmptyContent") {
					flag = true;
				}
				newPage = dojo.appConfigData.ContentPageLayouts[selectedTempIndex];
				newPage.type = "ContentPage";
				newPage.title = "Contents";
				if (dojo.bookInfo[dojo.currentBookIndex].BookConfigData.ContentPage) {
					dojo.bookInfo[dojo.currentBookIndex].BookConfigData.ContentPage = {};
					dojo.bookInfo[dojo.currentBookIndex].ModuleConfigData.ContentPage = {};
				}
				newPage.index = 1;
			}

			domStyle.set(query('.esriEditPageBody')[0], "display", "none");
			domStyle.set(query('.esriMapBookEditPage')[0], "height", "auto");
			this._renderPage(newPage);
			if (flag) {
				if (isBookPageLayout) {
					this._reArrangePageList(currentPageIndex + 1);
				} else {
					var selectedPage;
					selectedPage = dom.byId('mapBookPagesUList').lastChild;
					dom.byId('mapBookPagesUList').insertBefore(selectedPage, dom.byId('mapBookPagesUList').children[1]);
					this.currentIndex = 1;
				}
			}
			this._gotoPage(this.currentIndex);
			this._updateTOC();
			this._togglePageNavigation(true);
		},

		_reArrangePageList: function (currentPageIndex) {
			var currentListItemIndex = this.currentIndex;
			var refListItemIndex = currentPageIndex;
			if (this.mapBookDetails[dojo.currentBookIndex][1] == "EmptyContent") {
				currentListItemIndex--;
				refListItemIndex--;
			}
			var selectedPage, bookPages, mapBookDetails, bookListdata;
			selectedPage = dom.byId('mapBookPagesUList').children[currentListItemIndex];
			dom.byId('mapBookPagesUList').insertBefore(selectedPage, dom.byId('mapBookPagesUList').children[refListItemIndex]);

			bookPages = dojo.bookInfo[dojo.currentBookIndex].ModuleConfigData.BookPages;
			bookListdata = dojo.bookInfo[dojo.currentBookIndex].BookConfigData.BookPages;
			mapBookDetails = this.mapBookDetails[dojo.currentBookIndex];
			mapBookDetails.splice(currentPageIndex, 0, mapBookDetails[this.currentIndex]);
			bookPages.splice(currentPageIndex - 2, 0, bookPages[this.currentIndex - 2]);
			bookListdata.splice(currentPageIndex - 2, 0, bookListdata[this.currentIndex - 2]);

			mapBookDetails.splice(this.currentIndex + 1, 1);
			bookPages.splice(this.currentIndex - 1, 1);
			bookListdata.splice(this.currentIndex - 1, 1);

			for (var i = currentPageIndex - 2; i < bookPages.length; i++) {
				bookListdata[i].index = i + 2;
			}
			this.currentIndex = currentPageIndex;
		},

		_deletePage: function () {
			var selectedPage, pageModuleContent, bookPages, bookPageIndex, _self = this, pageIndex = this.currentIndex;
			if (this.mapBookDetails[dojo.currentBookIndex][1] == "EmptyContent") {
				pageIndex--;
			}
			selectedPage = dom.byId('mapBookPagesUList').children[pageIndex];
			domStyle.set(selectedPage, "display", "none");
			bookPages = dojo.bookInfo[dojo.currentBookIndex].ModuleConfigData.BookPages;
			moduleData = dojo.bookInfo[dojo.currentBookIndex].ModuleConfigData.BookPages[this.currentIndex - 2];
			bookPageIndex = this.currentIndex - 2;
			pageModuleContent = query('.esriMapBookColContent', selectedPage);
			this.mapBookDetails[dojo.currentBookIndex].splice(bookPageIndex + 2, 1);
			dojo.bookInfo[dojo.currentBookIndex].BookConfigData.BookPages.splice(bookPageIndex, 1);
			for (var i = bookPageIndex; i < bookPages.length - 1; i++) {
				this.mapBookDetails[dojo.currentBookIndex][i].index = i;
			}
			array.forEach(pageModuleContent, function (node) {
				if (domAttr.get(node, "type") == "webmap") {
					var moduleIndex = domAttr.get(node, "moduleIndex");
					_self._destroyMap("map" + moduleIndex);
				}
			});

			dojo.bookInfo[dojo.currentBookIndex].ModuleConfigData.BookPages.splice(bookPageIndex, 1);
			dom.byId('mapBookPagesUList').removeChild(selectedPage);
			this._createPageSlider();
			this._setSliderWidth();
			this._gotoPage(pageIndex - 1);
			this._updateTOC();
		}

	});
});