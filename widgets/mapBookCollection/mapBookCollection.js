define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/dom-attr",
    "dojo/dom-style",
    "dojo/dom-class",
    "dojo/dom",
    "dojo/on",
    "dojo/touch",
		"dojo/topic",
    "dojo/query",
    "esri/arcgis/utils",
		"esri/dijit/HomeButton",
		"esri/dijit/Legend",
    "esri/request",
    "esri/TimeExtent",
    "esri/dijit/TimeSlider",
    "dojo/text!./templates/mapBookCollectionTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!nls/localizedStrings",
    "dojox/image/FlickrBadge",
    "dojox/gesture/swipe"
],
     function (declare, domConstruct, lang, array, domAttr, domStyle, domClass, dom, on, touch, topic, query, arcgisUtils, homeButton, legendDijit, esriRequest, TimeExtent, TimeSlider, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, nls, flickrBadge, swipe) {
     		return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
     				templateString: template,
     				nls: nls,
     				mapBookDetails: {},
     				currentIndex: null,
     				currentBookIndex: 0,
     				webmapArray: [],
     				pages: [],
     				slidingPages: [],
     				isNavigationEnabled: true,
     				postCreate: function () {
     						var _self = this, bookShelfHeight;
     						topic.subscribe("editMapBookHandler", function (isEditModeEnable) {
     								_self.isEditModeEnable = isEditModeEnable;
     								_self._enableMapBookEditing();
     						});
     						topic.subscribe("deletePageHandler", function () {
     								_self._deletePage();
     						});

     						dom.byId("divCTParentDivContainer").appendChild(this.divOuterContainer);
     						_self._createMapBookList();
     						_self._createContentListPanel();
     						_self._resizeMapBook();

     						_self.own(on(window, "resize", function () {
     								_self._resizeMapBook();
     						}));

     						_self.own(on(window, "orientationchange", function () {
     								_self._resizeMapBook();
     						}));

     						if ("ontouchstart" in window) {
     								on(dojo.byId("esriMapPages"), swipe.end, function (e) {
     										if (Math.abs(e.dx) > Math.abs(e.dy)) {
     												if (e.dx > 0) {
     														if (_self.isNavigationEnabled) {
     																if (!domClass.contains(_self.mapBookPreviousPage, "esriPrevDisabled")) {
     																		_self._slideMapBookPage(true);
     																}
     														}
     												} else {
     														if (_self.isNavigationEnabled) {
     																if (!domClass.contains(_self.mapBookNextPage, "esriNextDisabled")) {
     																		_self._slideMapBookPage(false);
     																}
     														}
     												}
     										} else {
     												if (e.dy > 0) { }
     										}
     										e.cancelBubble = false;
     										e.cancelable = false;
     								});
     						}

     						this.own(on(this.mapBookPreviousPage, "click", function () {
     								if (_self.isNavigationEnabled) {
     										if (!domClass.contains(this, "esriPrevDisabled")) {
     												if (_self.currentIndex > 0 && _self.isEditModeEnable) {
     														var title = query('.esriMapBookPageTitle', dom.byId("mapBookPagesUList").children[_self.currentIndex])[0];
     														if (title && title.innerHTML.length > 0) {
     																_self._updateTOC();
     														} else {
     																alert(nls.pageRequireMessage);
     																return 0;
     														}
     												}
     												_self._slideMapBookPage(true);
     										}
     								}

     						}));

     						this.own(on(this.mapBookNextPage, "click", function () {
     								if (_self.isNavigationEnabled) {
     										if (!domClass.contains(this, "esriNextDisabled")) {
     												if (_self.currentIndex > 0 && _self.isEditModeEnable) {
     														var title = query('.esriMapBookPageTitle', dom.byId("mapBookPagesUList").children[_self.currentIndex])[0];
     														if (title && title.innerHTML.length > 0) {
     																_self._updateTOC();
     														} else {
     																alert(nls.pageRequireMessage);
     																return 0;
     														}
     												}
     												_self._slideMapBookPage(false);
     										}
     								}

     						}));
     				},
     				_slideMapBookPage: function (slideLeft) {

     						slideLeft ? this.currentIndex-- : this.currentIndex++;
     						this._slideBookPage();
     						this._setArrowVisibility();
     						this._setPageNavigation();

     				},
     				_setArrowVisibility: function () {

     						if (this.currentIndex === 0) {
     								this._removeClass(this.mapBookNextPage, "esriNextDisabled");
     								domClass.add(this.mapBookPreviousPage, "esriPrevDisabled");
     						}
     						else if (this.currentIndex === this.mapBookDetails[this.selectedMapBook].length - 1) {
     								domClass.add(this.mapBookNextPage, "esriNextDisabled");
     								this._removeClass(this.mapBookPreviousPage, "esriPrevDisabled");

     						} else {
     								this._removeClass(this.mapBookNextPage, "esriNextDisabled");
     								this._removeClass(this.mapBookPreviousPage, "esriPrevDisabled");
     						}

     				},
     				_slideBookPage: function () {
     						var pageWidth, left;
     						pageWidth = domStyle.get(query(".esriMapBookPageListItem")[0], "width");
     						left = (this.currentIndex) * Math.ceil(pageWidth);
     						dom.byId("mapBookPagesUList").style.marginLeft = -left + 'px';
     						if (domClass.contains(dom.byId("divContentListPanel"), "esriContentPanelOpened")) {
     								domClass.remove(dom.byId("divContentListPanel"), "esriContentPanelOpened");
     								domClass.remove(query('.esriTocIcon')[0], "esriHeaderIconSelected");

     						}
     						this._highlightSelectedPage();
     				},

     				_setPageNavigation: function () {
     						var pageNavigationTitle;
     						if (this.currentIndex >= 2) {
     								if (query(".esriDeleteIcon")[0]) {
     										domStyle.set(query(".esriDeleteIcon")[0], "display", "block");
     								}
     								domStyle.set(query(".esriFooterDiv")[0], "display", "block");
     								pageNavigationTitle = dojo.string.substitute(nls.page + " ${pageIndex} " + nls.of + " ${totalPages}", { pageIndex: this.currentIndex - 1, totalPages: (this.mapBookDetails[this.selectedMapBook].length - 2) });
     								domAttr.set(dom.byId("esriPaginationSpan"), "innerHTML", pageNavigationTitle);
     						} else {
     								if (query(".esriDeleteIcon")[0]) {
     										domStyle.set(query(".esriDeleteIcon")[0], "display", "none");
     								}
     								domStyle.set(query(".esriFooterDiv")[0], "display", "none");
     						}
     						query(".esriFooterDiv")[0].appendChild(query(".esriPaginationDiv")[0]);
     				},

     				_createMapBookList: function () {
     						var count = 0, container, _self = this, currentMapBook;
     						array.forEach(dojo.bookListData.Books, function (currentBook, bookIndex) {
     								if (count % 25 === 0) {
     										container = domConstruct.create("div", { "class": "esriMapBookListContainer" }, dom.byId("mapBookContent"));
     								}
     								count++;
     								mapBookContainer = domConstruct.create("div", { "class": "esriBookContainer" }, container);
     								currentMapBook = domConstruct.create("div", { "class": "esriMapBookList", "index": bookIndex, "value": currentBook.title }, mapBookContainer);
     								mapBookdivContainer = domConstruct.create("div", { "class": "esriBookTitlediv" }, currentMapBook);
     								mapBookdivContainerInner = domConstruct.create("div", { "class": "esriBookTitledivInner" }, mapBookdivContainer);
     								mapBookname = domConstruct.create("div", { "class": "esriBookTitle", "innerHTML": currentBook.title }, mapBookdivContainerInner);
     								mapBookAuthor = domConstruct.create("div", { "class": "esriBookAuthor", "innerHTML": currentBook.authorName }, currentMapBook);
     								_self.webmapArray = [];
     								if (currentBook.title.length > 20) {
     										domAttr.set(mapBookname, "title", currentBook.title);
     								}

     								_self.own(on(currentMapBook, "click", function (evt) {
     										_self.currentBookIndex = parseInt(domAttr.get(this, "index"));
     										dom.byId("esriMapPages").style.display = "block";
     										dom.byId("mapBookScrollContent").style.display = "none";
     										array.some(dojo.bookListData.Books, function (book) {

     												if (book.title == evt.currentTarget.value) {
     														if (dom.byId("divContentList")) {
     																domConstruct.empty(dom.byId("divContentList"));
     														}
     														domAttr.set(query(".esriMapBookTitle")[0], "innerHTML", book.title);
     														domStyle.set(query(".esrihomeButtonIcon")[0], "display", "block");
     														domStyle.set(query(".esriTocIcon")[0], "display", "block");

     														if (dojo.appConfigData.AuthoringMode) {
     																domStyle.set(query(".esriDownloadIcon")[0], "display", "none");
     																domStyle.set(query(".esriNewPageIcon")[0], "display", "none");
     																domStyle.set(query(".esriRefreshIcon")[0], "display", "none");
     																domStyle.set(query(".esriEditIcon")[0], "display", "block");
     																domStyle.set(query(".esriDeleteIcon")[0], "display", "none");
     														}
     														array.forEach(_self.webmapArray, function (webmap) {
     																webmap.destroy();
     														});
     														_self.webmapArray = [];
     														_self._displayBookContent(book, _self.currentBookIndex);
     														_self.currentIndex = 0;

     														if (_self.mapBookDetails[_self.selectedMapBook].length == 1) {
     																domClass.add(_self.mapBookNextPage, "esriNextDisabled");
     														} else {
     																_self._removeClass(_self.mapBookNextPage, "esriNextDisabled");
     																domClass.add(_self.mapBookPreviousPage, "esriPrevDisabled");
     														}
     														return true;
     												}
     										});
     								}));
     						});
     				},

     				_enableMapBookEditing: function () {
     						var _self = this, divTitle;
     						_self._resizeMapBook();
     						var selectedPage = dom.byId('mapBookPagesUList').children[_self.currentIndex];
     						var mapBookContents = query('.esriMapBookColContent');
     						if (_self.currentIndex > 1) {
     								divTitle = query('.esriMapBookPageTitle', dom.byId("mapBookPagesUList").children[_self.currentIndex])[0];
     								if (divTitle && divTitle.innerHTML.length == 0) {

     										domAttr.set(divTitle, "innerHTML", "Page " + (_self.currentIndex - 1));
     								}
     						}
     						if (_self.isEditModeEnable) {
     								if (query(".esriPopup")) {
     										array.forEach(query(".esriPopup"), function (popup) {
     												popup.style.display = "none";
     										});
     								}
     								domStyle.set(query(".esriMapBookEditPage")[0], "display", "block");
     								array.forEach(mapBookContents, function (node) {
     										domClass.add(node, "esriEditableModeContent");
     										domAttr.set(node, "contentEditable", true);
     								});
     								_self._highlightSelectedPage();
     						} else {
     								_self._updateMapBook();
     								_self._updateTOC();
     								if (query(".esriPopup")) {
     										array.forEach(query(".esriPopup"), function (popup) {
     												popup.style.display = "block";
     										});
     								}
     								domStyle.set(query(".esriMapBookEditPage")[0], "display", "none");
     								array.forEach(mapBookContents, function (node) {
     										domClass.remove(node, "esriEditableModeContent");
     										domAttr.set(node, "contentEditable", false);

     								});
     								domStyle.set(query('.esriEditPageBody')[0], "display", "none");
     								domStyle.set(query('.esriMapBookEditPage')[0], "height", "auto");
     								_self._togglePageNavigation(true);
     						}

     				},
     				_updateMapBook: function () {

     						for (var i = 0; i < this.mapBookDetails[this.selectedMapBook].length; i++) {
     								if (i == 0) {
     										this._updateCoverPage();
     								} else if (i == 1) {
     										this._updateContentPage();
     								} else {
     										this._updateBookPage(i);
     								}
     						}

     				},
     				_updateCoverPage: function () {
     						var coverPageTitle = query('.esriPageTitle', dom.byId('mapBookPagesUList').children[0]);
     						dojo.moduleData[this.currentBookIndex].CoverPage.title["text"] = coverPageTitle[0].innerHTML;

     				},
     				_updateContentPage: function () {
     						var index = 1;
     						var moduleDataContent = dojo.moduleData[this.currentBookIndex].ContentPage;
     						var mapBookContents = query('.esriMapBookColContent', dom.byId('mapBookPagesUList').children[1]);
     						this.mapBookDetails[this.selectedMapBook][1].title = mapBookContents[0].innerHTML;

     						for (moduleKey in moduleDataContent) {
     								if (moduleDataContent[moduleKey].type == "text") {
     										dojo.moduleData[this.currentBookIndex].ContentPage[moduleKey]["text"] = domAttr.get(mapBookContents[index], "innerHTML");
     								}
     								index++;
     						}
     				},
     				_updateBookPage: function (pageIndex) {

     						var index = 1, selectedPage, mapBookContents, data;
     						selectedPage = dom.byId('mapBookPagesUList').children[pageIndex];
     						mapBookContents = query('.esriMapBookColContent', selectedPage);
     						moduleDataContent = dojo.moduleData[this.currentBookIndex].BookPages[pageIndex - 2];
     						this.mapBookDetails[this.selectedMapBook][pageIndex].title = mapBookContents[0].innerHTML;
     				},

     				_resizeMapBook: function () {
     						var marginleft, totalPages, pageWidth, pageHeight, bookPageHeight, listcontentPage, marginTop = 0, _self = this;
     						totalPages = query('#mapBookPagesUList .esriMapBookPageListItem');
     						pageWidth = domStyle.get(query("#mapBookContentContainer")[0], "width");
     						bookPageHeight = pageHeight = window.innerHeight - (domStyle.get(dom.byId("mapBookHeaderContainer"), "height")) - 5;
     						domStyle.set(dom.byId("mapBookScrollContent"), "height", pageHeight + 'px');
     						if (_self.isEditModeEnable) {
     								pageHeight -= 150;
     								bookPageHeight = pageHeight;
     								marginTop = 150;
     								domStyle.set(query(".esriEditPageBody")[0], "height", bookPageHeight - 5 + 'px');
     						}
     						if (totalPages && dom.byId("mapBookPagesUList")) {
     								array.forEach(totalPages, function (page, index) {
     										if (index > 1) {
     												bookPageHeight = pageHeight - domStyle.get(query(".esriFooterDiv")[0], "height");
     										}
     										listcontentPage = query('.esriMapBookPage', page)[0];
     										if (listcontentPage) {
     												domStyle.set(listcontentPage, "width", pageWidth + 'px');
     												domStyle.set(listcontentPage, "height", bookPageHeight + 'px');
     												domStyle.set(listcontentPage, "margin-top", marginTop + 'px');
     										}

     								});
     								marginleft = _self.currentIndex * Math.ceil(pageWidth);
     								dom.byId("mapBookPagesUList").style.marginLeft = -marginleft + 'px';
     						}
     				},

     				_createContentListPanel: function () {
     						var divContentListPanel, divContentListHeader, divContentList;
     						divContentListPanel = domConstruct.create("div", { "class": "esriContentListPanelDiv ", "id": "divContentListPanel" }, dom.byId("mapBookContentContainer"));
     						divContentListHeader = domConstruct.create("div", { "innerHTML": nls.tocContentsCaption, "class": "esriContentListHeaderDiv " }, dom.byId("divContentListPanel"));
     						divContentList = domConstruct.create("div", { "id": "divContentList" }, dom.byId("divContentListPanel"));
     				},


     				_displayBookContent: function (book, index) {
     						var _self = this, contentPages, totalPages, listTOCContent, arrPages = [];
     						domConstruct.empty(dom.byId("esriMapPages"));
     						_self.selectedMapBook = book.title;

     						if (!_self.mapBookDetails[_self.selectedMapBook]) {
     								if (book.CoverPage) {
     										book.CoverPage.type = "CoverPage";
     										arrPages.push(book.CoverPage);
     								}
     								if (book.ContentPage) {
     										book.ContentPage.type = "ContentPage";
     										arrPages.push(book.ContentPage);
     								}
     								if (book.BookPages) {
     										if (book.BookPages.length == 0) {
     												domAttr.set(dom.byId("divContentList"), "innerHTML", nls.noPages);
     										}
     								}
     								array.forEach(book.BookPages, function (currentPage) {
     										currentPage.type = "BookPages";
     										arrPages.push(currentPage);
     								});
     								_self.mapBookDetails[_self.selectedMapBook] = arrPages;
     						}
     						listTOCContent = _self._renderTOCContent();
     						dom.byId("divContentList").appendChild(listTOCContent);
     						_self._renderPages(_self.mapBookDetails[_self.selectedMapBook]);
     				},

     				_renderPages: function (pages) {
     						var _self = this, page, mapBookUList;
     						mapBookUList = domConstruct.create("ul", { "id": "mapBookPagesUList", "class": "esriMapBookUList" }, null);
     						dom.byId("esriMapPages").appendChild(mapBookUList);
     						if (pages.length >= 1) {
     								domStyle.set(query(".esriPrevious")[0], "visibility", "visible");
     								domStyle.set(query(".esriNext")[0], "visibility", "visible");
     								if (pages.length == 1) {
     										domClass.replace(this.mapBookNextPage, "esriNextDisabled", "esriNext");
     								}
     								for (var i = 0; i < pages.length; i++) {
     										page = pages[i];
     										page.index = i;
     										_self._renderPage(pages[i]);
     								}
     						}
     						_self._renderEditPage();
     				},

     				_renderEditPage: function () {
     						var listItem, divEditPage, divEditPageHeader, divEditPageBody, divEditPageList, imgEditCoverPage, imgEditContentPage, divAddNewPage,
     						tempContHeight, divEditPageBody, divPageSlider, _self = this;
     						listItem = domConstruct.create("div", { "class": "esriMapBookEditPage" }, dom.byId('esriMapPages'));
     						divEditPage = domConstruct.create("div", {}, listItem);
     						divEditPageHeader = domConstruct.create("div", { "class": "esriEditPageHeader" }, divEditPage);
     						divEditPageList = domConstruct.create("div", { "class": "esriEditPageOptionList" }, divEditPageHeader);
     						imgEditCoverPage = domConstruct.create("img", { "index": 0, "class": "esriEditPageImg esriBookPage", "src": "themes/images/editCover.png" }, divEditPageList);

     						on(imgEditCoverPage, "click", function () {
     								_self._gotoPage(domAttr.get(this, "index"));
     						});
     						imgEditContentPage = domConstruct.create("img", { "index": 1, "class": "esriEditPageImg esriBookPage", "src": "themes/images/editContent.png" }, divEditPageList);

     						on(imgEditContentPage, "click", function () {
     								_self._gotoPage(domAttr.get(this, "index"));
     						});

     						divAddNewPage = domConstruct.create("div", { "class": "esriAddNewPageDiv" }, divEditPageHeader);
     						domConstruct.create("div", { "class": "esriAddNewPageImg" }, divAddNewPage);
     						domConstruct.create("div", { "class": "esriAddNewPageLabel", "innerHTML": nls.addPage }, divAddNewPage);
     						divEditPageBody = domConstruct.create("div", { "class": "esriEditPageBody" }, divEditPage);
     						divPageSlider = domConstruct.create("div", { "class": "esriPageSliderContainer" }, divEditPageHeader);

     						_self._createPageSlider();
     						_self._createDnDModuleList(divEditPageHeader);

     						_self._renderTemplateOptionPage(divEditPageBody);
     						tempContHeight = window.innerHeight - domStyle.get(dom.byId("mapBookHeaderContainer"), "height") - domStyle.get(query(".esriEditPageHeader")[0], "height") - 10;
     						domStyle.set(divEditPageBody, "height", tempContHeight + 'px')
     						on(divAddNewPage, "click", function () {
     								if (query('.esriEditPageBody')[0]) {
     										_self._clearTemplateSelection();
     										if (domStyle.get(query('.esriEditPageBody')[0], "display") == "none") {
     												domStyle.set(query('.esriEditPageBody')[0], "display", "block");
     												domStyle.set(query('.esriMapBookEditPage')[0], "height", "100%");
     												_self._togglePageNavigation(false);
     										}
     								}
     						});

     				},
     				_createPageSlider: function () {
     						var divPageSlider, divPageSliderLeft, divPageSliderContent, divPageSliderRight, listItem, divPage, ulist, _self = this;
     						divPageSlider = query('.esriPageSliderContainer')[0];
     						if (divPageSlider) {
     								domConstruct.empty(divPageSlider);
     						}
     						divPageSliderLeft = domConstruct.create("div", { "class": "esriPageSliderLeft" }, divPageSlider);
     						divLeftArrowIcon = domConstruct.create("div", { "class": "esriLeftArrowIcon esriLeftArrowDisable" }, divPageSliderLeft);
     						on(divLeftArrowIcon, "click", function () {
     								if (!domClass.contains(this, "esriLeftArrowDisable")) {
     										_self._slidePage(true);
     								}
     						});

     						divPageSliderContent = domConstruct.create("div", { "class": "esriPageSliderContent" }, divPageSlider);
     						divPageSliderRight = domConstruct.create("div", { "class": "esriPageSliderRight" }, divPageSlider);
     						divRightArrowIcon = domConstruct.create("div", { "class": "esriRightArrowIcon" }, divPageSliderRight);
     						on(divRightArrowIcon, "click", function () {
     								if (!domClass.contains(this, "esriRightArrowDisable")) {
     										_self._slidePage(false);
     								}
     						});

     						ulist = domConstruct.create("ul", { "class": "esriPageSliderUlist" }, divPageSliderContent);
     						for (var i = 2; i < this.mapBookDetails[this.selectedMapBook].length; i++) {
     								listItem = domConstruct.create("li", { "class": "esriPageSliderListItem" }, ulist);
     								divPage = domConstruct.create("div", { "class": "esriPageSliderDiv esriBookPage", "index": this.mapBookDetails[this.selectedMapBook][i].index, "innerHTML": "Page " + (i - 1) }, listItem);
     								on(divPage, "click", function () {
     										_self._gotoPage(domAttr.get(this, "index"));
     								});
     						}

     				},
     				_highlightSelectedPage: function () {
     						if (domStyle.get(query(".esriMapBookEditPage")[0], "display") == "block") {
     								var preSelectedPage, bookPageList, sliderContentWidth, totalUlistWidth;
     								preSelectedPage = query('.esriPageSelected');
     								bookPageList = query('.esriBookPage');
     								if (bookPageList.length > 0) {
     										if (preSelectedPage[0]) {
     												domClass.remove(preSelectedPage[0], "esriPageSelected");
     										}
     										if (bookPageList[this.currentIndex]) {
     												domClass.add(bookPageList[this.currentIndex], "esriPageSelected");
     										}

     										sliderContentWidth = domStyle.get(query('.esriPageSliderContent')[0], 'width');
     										totalUlistWidth = domStyle.get(query('.esriPageSliderListItem')[0], "width") * (bookPageList.length - 2);
     										if (totalUlistWidth <= sliderContentWidth) {
     												domClass.add(query('.esriRightArrowIcon')[0], "esriRightArrowDisable");
     										}
     								}
     						}
     				},
     				_removeClass: function (node, className) {
     						if (domClass.contains(node, className)) {
     								domClass.remove(node, className)
     						}
     				},

     				_slidePage: function (isSlideLeft) {
     						var _self = this, pageWidth, pageUList, sliderContentWidth, pageUlistWidth, left;

     						pageWidth = domStyle.get(query('.esriPageSliderListItem')[0], "width");
     						pageUList = query('.esriPageSliderUlist')[0];
     						sliderContentWidth = domStyle.get(query('.esriPageSliderContent')[0], 'width');
     						pageUlistWidth = pageWidth * pageUList.childElementCount;
     						left = domStyle.get(pageUList, "margin-left");

     						isSlideLeft ? left += pageWidth : left -= pageWidth;
     						domStyle.set(pageUList, "margin-left", left + 'px');

     						if (left == 0) {
     								_self._removeClass(query('.esriRightArrowIcon')[0], "esriRightArrowDisable");
     								domClass.add(query('.esriLeftArrowIcon')[0], "esriLeftArrowDisable");
     						} else if (left <= (sliderContentWidth - pageUlistWidth)) {
     								domClass.add(query('.esriRightArrowIcon')[0], "esriRightArrowDisable");
     								_self._removeClass(query('.esriLeftArrowIcon')[0], "esriLeftArrowDisable");

     						} else {
     								_self._removeClass(query('.esriLeftArrowIcon')[0], "esriLeftArrowDisable");
     								_self._removeClass(query('.esriRightArrowIcon')[0], "esriRightArrowDisable");

     						}

     				},
     				_createDnDModuleList: function (divEditPageHeader) {
     						var divDndModule, dndIocnDiv, webmapIcon, textareaIcon, videoIcon, copyIcon, flickrIcon, imageIcon;
     						divDndModule = domConstruct.create("div", { "class": "esriDragAndDropPanel" }, divEditPageHeader);
     						domConstruct.create("div", { innerHTML: "Drag and Drop Module", "class": "esriDragAndDropTitle" }, divDndModule);
     						dndIocnDiv = domConstruct.create("div", { "class": "esriDragAndDropIcon" }, divDndModule);
     						webmapIcon = domConstruct.create("span", { "class": "esriDragAndDropWebmapIcon" }, dndIocnDiv);
     						textareaIcon = domConstruct.create("span", { "class": "esriDragAndDropTextareaIcon" }, dndIocnDiv);
     						videoIcon = domConstruct.create("span", { "class": "esriDragAndDropVideoIcon" }, dndIocnDiv);
     						copyIcon = domConstruct.create("span", { "class": "esriDragAndDropCopyIcon" }, dndIocnDiv);
     						flickrIcon = domConstruct.create("span", { "class": "esriDragAndDropFlickrIcon" }, dndIocnDiv);
     						imageIcon = domConstruct.create("span", { "class": "esriDragAndDropImageIcon" }, dndIocnDiv);
     				},

     				_renderTemplateOptionPage: function (divEditPageBody) {
     						var _self = this, divTemplateContainer, divTemplatelist, divEditPageFooter, divContinue, divCancel, tempIndex;
     						array.forEach(dojo.appConfigData.BookPageLayouts, function (layoutOption, index) {
     								divTemplateContainer = domConstruct.create("div", { "class": "esriTemplateContainer" }, divEditPageBody);
     								divTemplatelist = domConstruct.create("img", { "class": "esriTemplateImage", "src": layoutOption.templateIcon, "index": index }, divTemplateContainer);
     								on(divTemplatelist, "click", function () {
     										_self._clearTemplateSelection();
     										tempIndex = domAttr.get(this, "index");
     										if (!domClass.contains(this, "selectedTemplate")) {
     												domClass.add(this, "selectedTemplate");
     												domAttr.set(this, "src", dojo.appConfigData.BookPageLayouts[tempIndex].selectedTemplateIcon);
     										}
     								});
     						});
     						divEditPageFooter = domConstruct.create("div", { "class": "esriEditPageFooter" }, divEditPageBody);
     						divContinue = domConstruct.create("div", { "class": "esriCancelBtn", "innerHTML": nls.continueText }, divEditPageFooter);
     						divCancel = domConstruct.create("div", { "class": "esriContinueBtn", "innerHTML": nls.cancelText }, divEditPageFooter);
     						on(divContinue, "click", function () {
     								if (query('.selectedTemplate')[0]) {
     										_self._togglePageNavigation(true);
     										_self._createNewPage();
     										_self._createPageSlider();
     								}
     						});
     				},

     				_createNewPage: function () {
     						var selectedTempIndex, newPage;

     						selectedTempIndex = domAttr.get(query('.selectedTemplate')[0], "index");
     						newPage = dojo.appConfigData.BookPageLayouts[selectedTempIndex];
     						newPage.type = "BookPages";
     						newPage.index = this.mapBookDetails[this.selectedMapBook].length;
     						newPage.title = "Page " + (newPage.index - 1);
     						this.mapBookDetails[this.selectedMapBook].push(newPage);
     						domStyle.set(query('.esriEditPageBody')[0], "display", "none");
     						domStyle.set(query('.esriMapBookEditPage')[0], "height", "auto");
     						this._renderPage(newPage);
     						this._gotoPage(newPage.index);

     				},
     				_deletePage: function () {

     						var selectedPage = dom.byId('mapBookPagesUList').children[this.currentIndex];
     						domStyle.set(selectedPage, "display", "none");
     						var pageIndex = this.currentIndex;
     						var bookPages = dojo.moduleData[this.currentBookIndex].BookPages;
     						var spage = dojo.moduleData[this.currentBookIndex].BookPages[this.currentIndex - 2];
     						var bPageIndex = this.currentIndex - 2;
     						this.webmapArray.splice(pageIndex, 1);
     						//selectedPage.removeNode();
     						for (var i = bPageIndex; i < bookPages.length - 1; i++) {
     								var pageIn = i + 2;
     								dojo.moduleData[this.currentBookIndex].BookPages[i] = dojo.moduleData[this.currentBookIndex].BookPages[i + 1];
     								//bookPages[i] = bookPages[i + 1];
     								this.mapBookDetails[this.selectedMapBook][pageIn + 1].index = pageIn;
     								this.mapBookDetails[this.selectedMapBook][pageIn] = this.mapBookDetails[this.selectedMapBook][pageIn + 1];
     						}
     						dojo.moduleData[this.currentBookIndex].BookPages.splice(bookPages.length - 1);
     						this.mapBookDetails[this.selectedMapBook].splice(this.mapBookDetails[this.selectedMapBook].length - 1);
     						dom.byId('mapBookPagesUList').removeChild(selectedPage);

     						this._gotoPage(pageIndex - 1);

     				},
     				_togglePageNavigation: function (enableNavigation) {
     						if (enableNavigation) {
     								this.isNavigationEnabled = true;
     								this._removeClass(this.mapBookNextPage, "nextDisabledEditMode");
     								this._removeClass(this.mapBookPreviousPage, "esriPrevDisabledEditMode");
     						} else {
     								this.isNavigationEnabled = false;
     								domClass.add(this.mapBookNextPage, "nextDisabledEditMode");
     								domClass.add(this.mapBookPreviousPage, "esriPrevDisabledEditMode");
     						}

     				},

     				_clearTemplateSelection: function () {
     						var selectedTemp, selectedClass;
     						selectedTemp = query('.selectedTemplate');
     						array.forEach(selectedTemp, function (template, index) {
     								domClass.remove(template, "selectedTemplate");
     								domAttr.set(template, "src", dojo.appConfigData.BookPageLayouts[index].templateIcon);
     						});
     				},
     				_renderPage: function (page) {
     						var _self = this, listItem, pageHeight;
     						listItem = domConstruct.create("li", { "class": "esriMapBookPageListItem" }, null);
     						dom.byId("mapBookPagesUList").appendChild(listItem);
     						_self.currentPage = domConstruct.create("div", { "class": "esriMapBookPage" }, listItem);
     						_self.slidingPages.push(_self.currentPage);
     						domStyle.set(_self.currentPage, "width", Math.ceil(dom.byId("mapBookContentContainer").offsetWidth) + 'px');
     						_self._createPageLayout(page);
     						pageHeight = window.innerHeight - domStyle.get(dom.byId("mapBookHeaderContainer"), "height") - 5;

     						if (_self.isEditModeEnable) {
     								domStyle.set(_self.currentPage, "margin-top", domStyle.get(query(".esriEditPageHeader")[0], "height") + 'px');
     								pageHeight -= domStyle.get(query(".esriEditPageHeader")[0], "height");
     						}
     						if (page.index > 1) {
     								pageHeight -= domStyle.get(query(".esriFooterDiv")[0], "height");
     						}
     						domStyle.set(_self.currentPage, "height", pageHeight + 'px');
     				},

     				_createPageLayout: function (page) {
     						var _self = this, divPageTitle, parentContainer, content, pageLayout, pageContentHolder, mapBookPageContent, titleClass, pageLayoutClass, pageContentCount = 0, count = 0;
     						var currentDate, data = {}, arrContent = {};
     						titleClass = "esriGeorgiaFont esriPageTitle";
     						if (page.type == "CoverPage") {
     								mapBookPageContent = dojo.moduleData[_self.currentBookIndex].CoverPage;
     								titleClass += ' esriTitleFontSize';
     						}
     						else if (page.type == "ContentPage") {
     								mapBookPageContent = dojo.moduleData[_self.currentBookIndex].ContentPage;
     								divPageTitle = domConstruct.create("div", { "class": titleClass + " esriMapBookPageTitle esriMapBookColContent" }, _self.currentPage);
     								if (page.title) {
     										domAttr.set(divPageTitle, "innerHTML", page.title);
     								}
     						}
     						else if (page.type == "BookPages") {
     								mapBookPageContent = dojo.moduleData[_self.currentBookIndex].BookPages[page.index - 2];
     								divPageTitle = domConstruct.create("div", { "class": titleClass + " esriMapBookPageTitle esriMapBookColContent" }, _self.currentPage);
     								if (page.title) {
     										domAttr.set(divPageTitle, "innerHTML", page.title);
     								}
     								if (_self.isEditModeEnable) {
     										domClass.add(divPageTitle, "esriEditableModeContent");
     										domAttr.set(divPageTitle, "contentEditable", true);
     								}
     						}

     						array.forEach(page.content, function (currentContent, columnIndex) {
     								pageLayoutClass = "esriLayoutDiv" + columnIndex;
     								if (page.columns === 1) {
     										pageLayout = "esriOneColumnLayout";
     										pageLayoutClass = "esriLayoutDiv";
     								}
     								else if (page.columns === 2) {
     										pageLayout = "esriTwoColumnLayout";
     								}
     								else if (page.columns === 3) {
     										pageLayout = "esriThreeColumnLayout";
     								}

     								pageLayoutClass += ' esriMapBookColContent';
     								parentContainer = domConstruct.create("div", { "class": pageLayout }, _self.currentPage);
     								if (_self.isEditModeEnable) {
     										_self.mapBookDetails[_self.selectedMapBook][page.index].content[columnIndex] = [];
     								}
     								array.forEach(currentContent, function (currentModuleContent, contentIndex) {
     										pageContentHolder = domConstruct.create("div", { "class": pageLayoutClass }, parentContainer);

     										if (!_self.isEditModeEnable) {
     												if (mapBookPageContent.hasOwnProperty(currentModuleContent)) {
     														var pageContentModule, divVideoContent, divModuleInfo;
     														pageContentModule = mapBookPageContent[currentModuleContent];
     														domStyle.set(pageContentHolder, "height", pageContentModule.height + 'px');
     														pageContentHolder.type = pageContentModule.type;
     														if (currentModuleContent == "title") {
     																if (page.type == "CoverPage") {
     																		domClass.add(pageContentHolder, titleClass);
     																		domAttr.set(pageContentHolder, "innerHTML", pageContentModule.text);
     																}
     														}
     														else if (pageContentModule.type == "webmap") {
     																_self._createWebmapModule(pageContentModule, pageContentHolder, page);
     														}
     														else if (pageContentModule.type == "image") {
     																domClass.add(pageContentHolder, "esriArialFont");
     																_self._createImageModule(pageContentModule, pageContentHolder, pageContentCount, count);
     														}
     														else if (pageContentModule.type == "TOC") {
     																domClass.add(pageContentHolder, "esriArialFont");
     																if (query('.esriMapBookColContent .esriTOCcontainer')[0]) {
     																		domConstruct.destroy(query('.esriMapBookColContent .esriTOCcontainer')[0]);
     																}
     																pageContentHolder.appendChild(_self._renderTOCContent());
     														}
     														else if (pageContentModule.type == "video") {
     																if (pageContentModule.title) {
     																		divModuleInfo = domConstruct.create("div", { "class": "esriModuleTitle" }, null);
     																		domAttr.set(divModuleInfo, "innerHTML", pageContentModule.title);
     																		pageContentHolder.appendChild(divModuleInfo);
     																}
     																divVideoContent = domConstruct.create("div", { "innerHTML": _self._renderVideoContent(pageContentModule) }, null);
     																pageContentHolder.appendChild(divVideoContent);
     																if (pageContentModule.caption) {
     																		divModuleInfo = domConstruct.create("div", { "class": "esriModuleTitle" }, null);
     																		domAttr.set(divModuleInfo, "innerHTML", pageContentModule.caption);
     																		pageContentHolder.appendChild(divModuleInfo);
     																}
     														}
     														else if (pageContentModule.type == "logo") {
     																domAttr.set(pageContentHolder, "innerHTML", "<img src=" + pageContentModule.path + " height=" + pageContentModule.height + ">");
     														}
     														else if (pageContentModule.type == "flickr") {
     																if (pageContentModule.title) {
     																		divModuleInfo = domConstruct.create("div", { "class": "esriModuleTitle" }, null);
     																		domAttr.set(divModuleInfo, "innerHTML", pageContentModule.title);
     																		pageContentHolder.appendChild(divModuleInfo);
     																}
     																pageContentHolder.appendChild(_self._renderPhotoSetContent(pageContentModule));

     																if (pageContentModule.caption) {
     																		divModuleInfo = domConstruct.create("div", { "class": "esriModuleTitle" }, null);
     																		domAttr.set(divModuleInfo, "innerHTML", pageContentModule.caption);
     																		pageContentHolder.appendChild(divModuleInfo);
     																}
     														}
     														else {
     																if (currentModuleContent == "author") {
     																		domClass.add(pageContentHolder, "esriMapBookAuthor");
     																}
     																domClass.add(pageContentHolder, "esriArialFont");
     																domAttr.set(pageContentHolder, "innerHTML", pageContentModule.text);
     														}
     												}
     										} else {
     												domClass.add(pageContentHolder, "esriEditableModeContent");
     												//	domStyle.set(pageContentHolder, "height", currentModuleContent.height + 'px');
     												domAttr.set(pageContentHolder, "contentEditable", true);
     												domAttr.set(pageContentHolder, "innerHTML", nls.untitled);
     												currentDate = Date.now();
     												data = {};
     												_self.mapBookDetails[_self.selectedMapBook][page.index].content[columnIndex].push(currentDate.toString());
     												data["height"] = 100;
     												data["type"] = currentModuleContent;
     												data["text"] = "Untitled";
     												arrContent[currentDate] = data;

     										}
     										count++;
     								});

     								pageContentCount++;
     						});
     						if (_self.isEditModeEnable) {
     								dojo.moduleData[_self.currentBookIndex].BookPages.push(arrContent);
     						}
     				},
     				_updateTOC: function () {
     						var updatedTOC, oldTOC, _self = this, parent;
     						oldTOC = query('.esriTOCcontainer');
     						array.forEach(oldTOC, function (container) {
     								parent = container.parentElement;
     								updatedTOC = _self._renderTOCContent();
     								domConstruct.empty(parent);
     								parent.appendChild(updatedTOC);
     						});

     				},
     				_createWebmapModule: function (pageContentModule, pageContentHolder, page) {

     						var mapContent, mapTitle, mapContentBtns, mapContentImgs, imgViewFullMap, imgLegend, mapCaption, loadingIndicator, loadingIndicatorImage, _self = this;
     						if (pageContentModule.title) {
     								mapTitle = domConstruct.create("div", { "class": "esriModuleTitle" }, null);
     								domAttr.set(mapTitle, "innerHTML", pageContentModule.title);
     								pageContentHolder.appendChild(mapTitle);
     						}
     						mapContentBtns = domConstruct.create("div", { "id": "divMapContainer" + page.index, "class": "esriMapContainer" }, pageContentHolder);
     						mapContent = domConstruct.create("div", { "id": "map" + page.index }, mapContentBtns);
     						domClass.add(mapContent, "esriCTFullHeightWidth");

     						mapContentImgs = domConstruct.create("div", { "class": "mapContentImgs" }, null);
     						imgViewFullMap = domConstruct.create("span", { "index": page.index, "class": "imgfullMapView" }, mapContentImgs);
     						imgLegendData = domConstruct.create("span", { "index": page.index, "class": "imgLegend" }, mapContentImgs);
     						loadingIndicator = domConstruct.create("div", { id: "loadingmap" + page.index, "class": "mapLoadingIndicator" }, mapContent);
     						loadingIndicatorImage = domConstruct.create("div", { "class": "mapLoadingIndicatorImage" }, loadingIndicator);

     						on(imgLegendData, "click", function (evt) {
     								_self._toggleLegendContainer(evt);
     						});
     						var divFullMapView = domConstruct.create("div", { "class": "esriFullMap", "id": "viewFull" + page.index }, null);
     						_self.currentPage.parentElement.appendChild(divFullMapView);
     						on(imgViewFullMap, "click", function (evt) {
     								if (domClass.contains(dom.byId("divContentListPanel"), "esriContentPanelOpened")) {
     										domClass.remove(dom.byId("divContentListPanel"), "esriContentPanelOpened");
     										domClass.remove(query(".esriTocIcon")[0], "esriHeaderIconSelected");
     								}
     								_self._viewFullMap(evt);
     						});
     						if ("ontouchstart" in window) {
     								on(mapContent, swipe.end, function (e) {
     										e.stopPropagation();
     								});
     								touch.press(imgLegendData, function (evt) {
     										_self._toggleLegendContainer(evt);
     								});
     								touch.press(imgViewFullMap, function (evt) {
     										_self._viewFullMap(evt);
     								});
     						}
     						if (pageContentModule.caption) {
     								mapCaption = domConstruct.create("div", { "class": "esriModuleCaption" }, null);
     								domAttr.set(mapCaption, "innerHTML", pageContentModule.caption);
     								pageContentHolder.appendChild(mapCaption);
     						}
     						_self._renderWebMapContent(pageContentModule, mapContent.id, mapContentImgs);
     				},

     				_viewFullMap: function (evt) {
     						var _self = this, containerId, divFullMap, zoomSlider, divCustomMap;
     						containerId = domAttr.get(evt.currentTarget, "index");
     						divFullMap = dom.byId("viewFull" + containerId);
     						zoomSlider = query('#map' + containerId + ' .esriSimpleSlider')[0];

     						divCustomMap = dom.byId("divMapContainer" + containerId);
     						if (domStyle.get(divFullMap, "display") == "none") {
     								domStyle.set(divFullMap, "display", "block");
     								divFullMap.appendChild(dom.byId("map" + containerId));
     								if (zoomSlider) {
     										domStyle.set(zoomSlider, "display", "block");
     								}
     								array.some(_self.webmapArray, function (currentMap) {
     										if (("map" + containerId) == currentMap.id) {
     												currentMap.infoWindow.popupWindow = true;
     												currentMap.infoWindow.set("highlight", false);
     										}
     										on(currentMap, "click", function () {
     												if (!currentMap.infoWindow.highlight && domStyle.get(divFullMap, "display") == "block") {
     														currentMap.infoWindow.set("highlight", true);
     												}
     										});
     								});
     						} else {
     								domStyle.set(divFullMap, "display", "none");
     								divCustomMap.appendChild(dom.byId("map" + containerId));
     								if (zoomSlider) {
     										domStyle.set(zoomSlider, "display", "none");
     								}
     								array.some(_self.webmapArray, function (currentMap) {
     										if (("map" + containerId) == currentMap.id) {
     												currentMap.infoWindow.popupWindow = false;
     												currentMap.infoWindow.set("highlight", false);
     												currentMap.infoWindow.hide();
     										}
     								});
     						}
     				},

     				_toggleLegendContainer: function (evt) {
     						var containerId = "legendContentmap" + domAttr.get(evt.currentTarget, "index")
     						if (domClass.contains(dom.byId(containerId), "esriLegendContainerOpen")) {
     								domClass.remove(dom.byId(containerId), "esriLegendContainerOpen");
     						} else {
     								domClass.add(dom.byId(containerId), "esriLegendContainerOpen");
     						}
     				},
     				_createThreeColumnLayout: function () {

     				},
     				_createImageModule: function (pageContentModule, pageContentHolder, pageContentCount, count) {
     						var _self = this, innerDiv, imgModule, imgImg;
     						innerDiv = domConstruct.create("div", { "id": "innerDiv" + "Img" + count + pageContentCount, "style": 'height:' + pageContentModule.height + 'px; width:' + pageContentModule.height + 'px', "class": "innerDiv" }, pageContentHolder);
     						mapContentImgs = domConstruct.create("div", { "id": "Img" + count + pageContentCount }, innerDiv);

     						imgModule = domConstruct.create("img", { "class": "esriImageModule", "style": 'height:' + pageContentModule.height + 'px; width:' + pageContentModule.width + 'px', "src": pageContentModule.path }, mapContentImgs);
     						imgImg = domConstruct.create("div", { "class": "imgImg" }, mapContentImgs);
     						if (pageContentModule.allowfullscreen) {
     								imgViewFullMap = domConstruct.create("span", { "class": "imgfullMapView", "index": "Img" + count + pageContentCount, "ImgHeight": pageContentModule.height, "ImgWidth": pageContentModule.width }, imgImg);
     								_self.imageDiv = domConstruct.create("div", { "id": "esriFullImg" + count + pageContentCount, "class": "esriFullImage" }, _self.currentPage.parentElement);
     								on(imgViewFullMap, "click", function (evt) {
     										var imageContainer = domAttr.get(evt.currentTarget, "index");
     										var imageHeight = domAttr.get(evt.currentTarget, "ImgHeight");
     										var imageWidth = domAttr.get(evt.currentTarget, "ImgWidth");
     										if (domStyle.get(dom.byId("esriFull" + imageContainer), "display") == "none") {
     												domStyle.set(dom.byId("esriFull" + imageContainer), "display", "block");
     												domStyle.set(query('#' + imageContainer + " .esriImageModule")[0], "height", "");
     												domStyle.set(query('#' + imageContainer + " .esriImageModule")[0], "width", "");
     												dom.byId("esriFull" + imageContainer).appendChild(dom.byId(imageContainer));
     										}
     										else {
     												domStyle.set(dom.byId("esriFull" + imageContainer), "display", "none");
     												domStyle.set(query('#' + imageContainer + " .esriImageModule")[0], "height", imageHeight + "px");
     												domStyle.set(query('#' + imageContainer + " .esriImageModule")[0], "width", imageWidth + "px");
     												dom.byId("innerDiv" + imageContainer).appendChild(dom.byId(imageContainer));
     										}
     								});
     						}
     				},
     				_renderVideoContent: function (video) {
     						var embed, videoSize, videoWidth = "", videoHeight = "";
     						if (video.width) { videoWidth = ' width="100%"'; }
     						if (video.height) { videoHeight = ' height="' + video.height + '" '; }
     						videoSize = videoWidth + videoHeight;
     						switch (video.provider) {
     								case "vimeo":
     										embed = "<iframe width=" + "90%" + " height=" + video.height + "px" + "  src=" + 'http://player.vimeo.com/video/' + video.id + " frameborder=0 webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>";
     										break;
     								case "youtube":
     										embed = '<iframe src="http://www.youtube.com/embed/' + video.id + '" frameborder="0" ' + videoSize + ' allowfullscreen></iframe>';
     										break;
     								case "esrivideo":
     										embed = "<iframe width=" + "90%" + " height=" + video.height + "px" + "  src=" + 'http://video.esri.com/iframe/' + video.id + " frameborder=0 webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>";
     										break;
     								case "esri":
     										embed = "<iframe width=" + "90%" + "height=" + video.height + "  src=" + 'http://video.esri.com/iframe/' + video.id + " frameborder=0 webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>";
     										break;
     						}
     						return embed;
     				},


     				_createLegend: function (map) {
     						var legendContainer, legendContainerId, legendContent;

     						legendContainerId = "legendContent" + map.id;
     						if (dijit.registry.byId(legendContainerId)) {
     								dijit.registry.byId(legendContainerId).destroy();
     						}
     						legendContainer = domConstruct.create("div", { "id": legendContainerId, "class": "esriLegendContainer" }, null);
     						map.root.appendChild(legendContainer);

     						legendContent = new legendDijit({
     								map: map
     						}, legendContainerId);
     						legendContent.startup();

     				},
     				_createHomeButton: function (map) {
     						var homeBtnContainer, homeBtn, homeBtnId;
     						homeBtnId = "homeBtn" + map.id;
     						if (dijit.registry.byId(homeBtnId)) {
     								dijit.registry.byId(homeBtnId).destroy();
     						}
     						homeBtnContainer = domConstruct.create("div", { "id": homeBtnId, "class": "esriHomeButton" }, null);
     						var zoomSlider = query('#' + map.id + ' .esriSimpleSlider')[0];
     						zoomSlider.insertBefore(homeBtnContainer, zoomSlider.lastChild);
     						homeBtn = new homeButton({
     								map: map
     						}, homeBtnId);
     						homeBtn.startup();
     				},
     				_renderWebMapContent: function (currentModuleContent, mapId, mapContentImgs) {
     						var _self = this;
     						arcgisUtils.createMap(currentModuleContent.webmap_id, mapId, {
     								mapOptions: {
     										slider: true
     								},
     								ignorePopups: false
     						}).then(function (response) {
     								response.map.root.appendChild(mapContentImgs);
     								_self.webmapArray.push(response.map);
     								response.map.on("layers-add-result", function () {
     										initSlider();
     								});
     								response.map.infoWindow.popupWindow = false;
     								response.map.infoWindow.set("highlight", false);
     								response.map.infoWindow.hideHighlight();
     								domStyle.set(dom.byId("loading" + mapId), "display", "none");

     								_self._createLegend(response.map);
     								_self._createHomeButton(response.map);
     								if ("ontouchstart" in window) {
     										touch.over(dom.byId(mapId), function () {
     												response.map.resize();
     												response.map.reposition();
     										});
     								}
     								else {
     										on(dom.byId(mapId), "mouseover", function () {
     												response.map.resize();
     												response.map.reposition();
     										});
     								}
     								function initSlider() {
     										if (response.map.getLayer(response.map.layerIds[1]).timeInfo) {
     												sliderDiv = domConstruct.create("div", { "id": "Slider" + mapId, "class": "esriSliderDemo" }, response.map.root);
     												var timeSlider = new TimeSlider({
     														style: "width: 100%;"
     												}, dom.byId("Slider" + mapId));
     												response.map.setTimeSlider(timeSlider);
     												var timeExtent = new TimeExtent();
     												timeExtent.startTime = response.map.getLayer(response.map.layerIds[1]).timeInfo.timeExtent.startTime;
     												timeExtent.endTime = response.map.getLayer(response.map.layerIds[1]).timeInfo.timeExtent.endTime;
     												timeSlider.setThumbCount(2);
     												timeSlider.createTimeStopsByTimeInterval(timeExtent, 1, response.map.getLayer(response.map.layerIds[1]).timeInfo.defaultTimeIntervalUnits);
     												timeSlider.setThumbIndexes([0, 1]);
     												timeSlider.setThumbMovingRate(2000);
     												timeSlider.startup();

     												//add labels for every other time stop
     												var labels = array.map(timeSlider.timeStops, function (timeStop, i) {
     														if (i % 2 === 0) {
     																return timeStop.getUTCFullYear();
     														} else {
     																return "";
     														}
     												});

     												timeSlider.setLabels(labels);

     												timeSlider.on("time-extent-change", function (evt) {
     														var startValString = evt.startTime.getUTCFullYear();
     														var endValString = evt.endTime.getUTCFullYear();
     														// dom.byId("daterange").innerHTML = "<i>" + startValString + " and " + endValString + "<\/i>";
     												});
     										}
     								}
     						}, function (error) {
     								alert(error.toString());
     						});
     				},

     				_renderTOCContent: function () {
     						var _self = this, tocContent, anchorTag, divPageNo, divPageTitle;
     						tocContent = domConstruct.create("div", { "class": "esriTOCcontainer" }, null);
     						for (var pageIndex = 0; pageIndex < _self.mapBookDetails[_self.selectedMapBook].length; pageIndex++) {
     								anchorTag = domConstruct.create("div", { "class": "esriContentListDiv" }, null);
     								divPageTitle = domConstruct.create("div", { "value": pageIndex, "class": "esriTitleListDiv" }, anchorTag);
     								divPageNo = domConstruct.create("div", { "value": pageIndex, "class": "esriTitleIndexDiv" }, anchorTag);
     								if (pageIndex == 0) {
     										title = query(".esriMapBookTitle")[0].innerHTML;
     								}
     								else if (pageIndex == 1) {
     										title = nls.contentsPageTitle;
     								}
     								else {
     										title = _self.mapBookDetails[_self.selectedMapBook][pageIndex].title;
     								}
     								domAttr.set(divPageTitle, "innerHTML", title);
     								if (pageIndex > 1) {
     										domAttr.set(divPageNo, "innerHTML", (pageIndex - 1));
     								}
     								tocContent.appendChild(anchorTag);
     								touch.press(anchorTag, function (evt) {
     										_self._gotoPage(evt.target.value);
     										evt.stopPropagation();
     										evt.cancelBubble = true;
     										evt.cancelable = true;
     								});
     						}
     						domStyle.set(anchorTag, "border-bottom", "none");
     						return tocContent;
     				},

     				_renderPhotoSetContent: function (pageContentModule) {
     						var photsetContent = new flickrBadge({
     								"apikey": "4e02b880dc9fc2825fdfdc2972e6843c",
     								"setid": pageContentModule.photoset_id,
     								"username": "dylans",
     								"cols": 5,
     								"rows": 7,
     								"target": "_blank"
     						});
     						return photsetContent.domNode;
     				},

     				_gotoPage: function (pageIndex) {
     						if (this.isNavigationEnabled) {
     								this.currentIndex = pageIndex;
     								this._slideBookPage();
     								this._setPageNavigation();
     								this._setArrowVisibility();
     						}

     				}
     		});
     });