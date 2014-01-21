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
    "dojo/string",
    "dojo/dnd/Source",
    "dojo/dnd/Target",
    "dojo/dnd/Manager",
    "esri/arcgis/utils",
    "esri/urlUtils",
    "esri/dijit/HomeButton",
    "esri/dijit/Legend",
    "dijit/form/Button",
    "dijit/Dialog",
    "dijit/Editor",
    "dijit/_editor/plugins/AlwaysShowToolbar",
    "dijit/_editor/plugins/FontChoice",
	"dijit/_editor/plugins/LinkDialog",
	"dijit/form/Textarea",
    "esri/request",
    "esri/TimeExtent",
    "esri/dijit/TimeSlider",
    "dojo/text!./templates/mapBookCollectionTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!nls/localizedStrings",
    "dojox/image/FlickrBadge",
    "dojox/gesture/swipe",
    "dojox/image/Lightbox",
    "dojo/parser"
],
     function (declare, domConstruct, lang, array, domAttr, domStyle, domClass, dom, on, touch, topic, query, dojoString, dndSource, Target, Manager, arcgisUtils, urlUtils, homeButton, legendDijit, button, dialog, editor, alwaysShowToolbar, FontChoice, LinkDialog, Textarea, esriRequest, TimeExtent, TimeSlider, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, nls, flickrBadge, swipe, lightBox) {
     	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
     		templateString: template,
     		nls: nls,
     		mapBookDetails: {},
     		currentIndex: null,
     		currentBookIndex: 0,
     		webmapArray: [],
     		pages: [],
     		slidingPages: [],
     		isDND: false,
     		DNDArray: [],
     		isNavigationEnabled: true,
     		isEditModeEnable: false,
     		selectedMapBook: null,
     		postCreate: function () {
     			var _self = this;
     			topic.subscribe("editMapBookHandler", function (isEditModeEnable) {
     				_self.isEditModeEnable = isEditModeEnable;
     				_self._enableMapBookEditing();
     			});
     			topic.subscribe("deletePageHandler", function () {
     				_self.isNavigationEnabled = true;
     				_self._deletePage();
     			});
     			topic.subscribe("addBookHandler", function (bookIndex) {
     				_self._createMapBookList();
     				_self.currentBookIndex = bookIndex;
     				_self._displaySelectedBookContent(dojo.bookListData.Books[bookIndex]);
     			});
     			topic.subscribe("destroyWebmapHandler", function () {
     				array.forEach(_self.webmapArray, function (webmap) {
     					webmap.destroy();
     				});
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

     			this.own(on(this.mapBookPreviousPage, "click", function () {
     				_self._handlePageNavigation(this, true);
     			}));

     			this.own(on(this.mapBookNextPage, "click", function () {
     				_self._handlePageNavigation(this, false);
     			}));
     		},

     		_checkPageContent: function () {

     			var flag = true;
     			if (this.isEditModeEnable) {
     				if (dom.byId("mapBookPagesUList")) {
     					var currentPage = dom.byId("mapBookPagesUList").children[this.currentIndex];
     					var pageModuleData = query('.divPageModule', currentPage);
     					array.forEach(pageModuleData, function (module, index) {
     						if (module.innerHTML == 'Untitled' || module.innerHTML == '') {
     							flag = false;
     						}
     					});
     				}
     				if (flag) {
     					this._removeClass(query(".esriEditIcon")[0], "disableEditing");
     				} else {
     					domClass.add(query(".esriEditIcon")[0], "disableEditing");
     				}
     			}
     			return flag;
     		},

     		_handlePageNavigation: function (currentObj, isSlideLeft) {
     			var _self = this;
     			if (_self.isNavigationEnabled) {
     				if (!dojo.moduleData[_self.currentBookIndex].ContentPage) {
     					domStyle.set(query('.esriEditPageBody')[0], "display", "block");
     					domStyle.set(query('.esriMapBookEditPage')[0], "height", "100%");
     					domStyle.set(query('.contentLayoutOption')[0], "display", "block");
     					domStyle.set(query('.pageLayoutOption')[0], "display", "none");
     					_self._togglePageNavigation(false);
     				} else {
     					currentClass = isSlideLeft ? "esriPrevDisabled" : "esriNextDisabled";
     					if (!domClass.contains(currentObj, currentClass)) {
     						if (_self.currentIndex > 0 && _self.isEditModeEnable) {
     							var title = query('.esriMapBookPageTitle', dom.byId("mapBookPagesUList").children[_self.currentIndex])[0];
     							if (title && title.innerHTML.length > 0) {
     								_self._updateTOC();
     							} else {
     								alert(nls.pageRequireMessage);
     								return 0;
     							}
     						}
     						_self._slideMapBookPage(isSlideLeft);
     					}
     				}
     			}
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
     				mapBookAuthor = domConstruct.create("div", { "class": "esriBookAuthor", "innerHTML": currentBook.author }, currentMapBook);
     				_self.webmapArray = [];
     				if (currentBook.title.length > 20) {
     					domAttr.set(mapBookname, "title", currentBook.title);
     				}
     				_self.own(on(currentMapBook, "click", function (evt) {
     					_self.currentBookIndex = parseInt(domAttr.get(this, "index"));

     					array.some(dojo.bookListData.Books, function (book, index) {
     						if (book.title == evt.currentTarget.value && _self.currentBookIndex == index) {
     							_self._displaySelectedBookContent(book);
     						}
     					});
     				}));
     			});
     		},

     		_displaySelectedBookContent: function (book) {
     			dom.byId("esriMapPages").style.display = "block";
     			dom.byId("mapBookScrollContent").style.display = "none";
     			if (dom.byId("divContentList")) {
     				domConstruct.empty(dom.byId("divContentList"));
     			}
     			domAttr.set(query(".esriMapBookTitle")[0], "innerHTML", book.title);
     			domStyle.set(query(".esrihomeButtonIcon")[0], "display", "block");
     			domStyle.set(query(".esriTocIcon")[0], "display", "block");

     			if (dojo.appConfigData.AuthoringMode) {
     				domStyle.set(query(".esriDownloadIcon")[0], "display", "none");
     				domStyle.set(query(".esriNewBookIcon")[0], "display", "none");
     				domStyle.set(query(".esriRefreshIcon")[0], "display", "none");
     				domStyle.set(query(".esriEditIcon")[0], "display", "block");
     				domStyle.set(query(".esriDeleteIcon")[0], "display", "none");
     			}
     			array.forEach(this.webmapArray, function (webmap) {
     				webmap.destroy();
     			});
     			this.webmapArray = [];
     			this._displayBookContent(book, this.currentBookIndex);
     			this.currentIndex = 0;

     			if (this.mapBookDetails[this.selectedMapBook].length == 1) {
     				domClass.add(this.mapBookNextPage, "esriNextDisabled");
     			} else {
     				this._removeClass(this.mapBookNextPage, "esriNextDisabled");
     				domClass.add(this.mapBookPreviousPage, "esriPrevDisabled");
     			}
     		},

     		_enableMapBookEditing: function () {
     			var _self = this, divTitle, isModuleValid, mapBookContents;
     			_self._resizeMapBook();
     			mapBookContents = query('.esriMapBookColContent');
     			if (_self.currentIndex > 1) {
     				divTitle = query('.esriMapBookPageTitle', dom.byId("mapBookPagesUList").children[_self.currentIndex])[0];
     				if (divTitle && divTitle.innerHTML.length == 0) {
     					domAttr.set(divTitle, "innerHTML", "Page " + (_self.currentIndex - 1));
     				}
     			}
     			if (_self.isEditModeEnable) {
     				domStyle.set(query(".esriMapBookEditPage")[0], "display", "block");
     				setTimeout(function () {
     					_self._setSliderWidth();
     					_self._setSliderArrows();
     				}, 100);
     				array.forEach(mapBookContents, function (node) {
     					domClass.add(node, "esriEditableModeContent");
     				});
     				_self._highlightSelectedPage();
     				_self._toggleDnd(true);
     			} else {

     				_self._updateTOC();
     				domStyle.set(query(".esriMapBookEditPage")[0], "display", "none");
     				array.forEach(mapBookContents, function (node) {
     					domClass.remove(node, "esriEditableModeContent");
     				});
     				domStyle.set(query('.esriEditPageBody')[0], "display", "none");
     				domStyle.set(query('.esriMapBookEditPage')[0], "height", "auto");
     				_self._togglePageNavigation(true);
     				_self._toggleDnd(false);
     			}

     		},

     		_toggleDnd: function (enableDnd) {
     			var pageIndex, columnIndex;
     			array.forEach(this.DNDArray, function (dndCont) {
     				if (enableDnd) {
     					pageIndex = domAttr.get(dndCont.node.parentElement, "pageIndex");
     					columnIndex = domAttr.get(dndCont.node, "columnIndex");
     					if (!(pageIndex === "0" && columnIndex === "0")) {
     						dndCont.delay = 0;
     						dndCont.checkAcceptance = function (source, nodes) {
     							return true;
     						};
     					}
     				} else {
     					dndCont.delay = 1000;
     					dndCont.checkAcceptance = function (source, nodes) {
     						return false;
     					};
     				}
     			});
     		},

     		_updateCoverPage: function () {
     			var coverPageTitle = query('.esriPageTitle', dom.byId('mapBookPagesUList').children[0]);
     			if (coverPageTitle[0]) {
     				dojo.moduleData[this.currentBookIndex].CoverPage.title["text"] = coverPageTitle[0].innerHTML;
     			}
     		},

     		_updateContentPage: function () {

     			var moduleDataContent = dojo.moduleData[this.currentBookIndex].ContentPage;
     			var mapBookContents = query('.esriMapBookColContent', dom.byId('mapBookPagesUList').children[1]);
     			if (mapBookContents[0]) {
     				moduleDataContent.title = mapBookContents[0].innerHTML;
     			}
     		},

     		_updateBookPage: function (pageIndex) {

     			var selectedPage, pageTitle;
     			selectedPage = dom.byId('mapBookPagesUList').children[pageIndex];
     			pageTitle = query('.esriMapBookPageTitle', selectedPage)[0];
     			if (pageTitle) {
     				dojo.bookListData.Books[this.currentBookIndex].BookPages[pageIndex - 2].title = pageTitle.innerHTML;
     			}
     		},

     		_resizeMapBook: function () {
     			var marginleft, totalPages, pageWidth, pageHeight, bookPageHeight, listcontentPage, marginTop = 0, _self = this;
     			totalPages = query('#mapBookPagesUList .esriMapBookPageListItem');
     			pageWidth = domStyle.get(query("#mapBookContentContainer")[0], "width");
     			bookPageHeight = pageHeight = dojo.window.getBox().h - (domStyle.get(dom.byId("mapBookHeaderContainer"), "height")) - 5;
     			domStyle.set(dom.byId("mapBookScrollContent"), "height", pageHeight + 'px');
     			if (_self.isEditModeEnable) {
     				pageHeight -= 150;
     				bookPageHeight = pageHeight;
     				marginTop = 150;
     				domStyle.set(query(".esriEditPageBody")[0], "height", bookPageHeight - 5 + 'px');
     				_self._setSliderWidth();
     				_self._setSliderArrows();


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
     						listcontentPage.style.marginTop = marginTop + 'px';
     					}
     				});
     				marginleft = _self.currentIndex * Math.ceil(pageWidth);
     				dom.byId("mapBookPagesUList").style.marginLeft = -marginleft + 'px';
     			}
     		},

     		_createContentListPanel: function () {
     			var divContentListPanel, divContentListHeader, divContentList;
     			divContentListPanel = domConstruct.create("div", { "class": "esriContentListPanelDiv esriArialFont", "id": "divContentListPanel" }, dom.byId("mapBookContentContainer"));
     			divContentListHeader = domConstruct.create("div", { "innerHTML": nls.tocContentsCaption, "class": "esriContentListHeaderDiv " }, dom.byId("divContentListPanel"));
     			divContentList = domConstruct.create("div", { "id": "divContentList" }, dom.byId("divContentListPanel"));
     		},

     		_displayBookContent: function (book, index) {
     			var _self = this, contentPages, totalPages, flag, listTOCContent, arrPages = [];
     			if (dom.byId("esriMapPages")) {
     				domConstruct.empty(dom.byId("esriMapPages"));
     			}
     			this.selectedMapBook = book.title;
     			this.DNDArray = [];
     			if (!_self.mapBookDetails[_self.selectedMapBook]) {
     				if (book.hasOwnProperty('CoverPage')) {
     					book.CoverPage.type = "CoverPage";
     					arrPages.push(book.CoverPage);
     				} else {
     					this.isEditModeEnable = true;
     					arrPages.push(_self._createCoverPage());
     				}
     				if (book.hasOwnProperty('ContentPage')) {
     					book.ContentPage.type = "ContentPage";
     					arrPages.push(book.ContentPage);
     				}
     				if (book.hasOwnProperty('BookPages')) {
     					if (book.BookPages.length == 0) {
     						domAttr.set(dom.byId("divContentList"), "innerHTML", nls.noPages);
     					}
     				} else {
     					dojo.bookListData.Books[_self.currentBookIndex].BookPages = [];
     					dojo.moduleData[_self.currentBookIndex].BookPages = [];
     				}
     				array.forEach(book.BookPages, function (currentPage) {
     					currentPage.type = "BookPages";
     					arrPages.push(currentPage);
     				});
     				_self.mapBookDetails[_self.selectedMapBook] = arrPages;
     			}
     			_self._renderPages(_self.mapBookDetails[_self.selectedMapBook]);
     			_self._renderTOCContent(dom.byId("divContentList"));

     		},

     		_createCoverPage: function () {
     			var coverPage, moduleDataCoverPage;
     			moduleDataCoverPage = {};
     			if (!dojo.moduleData[this.currentBookIndex]) {
     				dojo.moduleData[this.currentBookIndex] = {};
     			}
     			defaultTitle = lang.clone(dojo.appConfigData.ModuleDefaultsConfig.title);
     			defaultTitle.text = dojo.bookListData.Books[this.currentBookIndex].title;
     			moduleDataCoverPage.title = defaultTitle;
     			coverPage = lang.clone(dojo.appConfigData.CoverPageLayout);

     			coverPage.title = dojo.bookListData.Books[this.currentBookIndex].title;

     			dojo.bookListData.Books[this.currentBookIndex]["CoverPage"] = coverPage;
     			dojo.moduleData[this.currentBookIndex]["CoverPage"] = {};
     			this._removeClass(this.mapBookNextPage, "esriNextDisabled");
     			return coverPage;
     		},

     		_renderPages: function (pages) {
     			var _self = this, page, mapBookUList, settingDialog;
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
     			if (dijit.byId("settingDialog")) {
     				dijit.byId("settingDialog").destroy();
     			}
     			settingDialog = new dialog({
     				title: "Setting Dialog",
     				content: "Test content.",
     				id: "settingDialog",
     				draggable: false
     			});
     			settingDialog.startup();
     			settingDialog.hide();
     			_self._renderEditPage();
     		},

     		_renderEditPage: function () {
     			var divEditPage, isModuleValid, divEditPageHeader, divEditPageList, imgEditCoverPage, imgEditContentPage, divAddNewPage, tempContHeight, divEditPageBody, divPageSlider, _self = this;

     			divEditPage = domConstruct.create("div", { "class": "esriMapBookEditPage" }, dom.byId('esriMapPages'));
     			divEditPageHeader = domConstruct.create("div", { "class": "esriEditPageHeader" }, divEditPage);
     			divEditPageList = domConstruct.create("div", { "class": "esriEditPageOptionList" }, divEditPageHeader);
     			if (dojo.bookListData.Books[this.currentBookIndex].CoverPage) {
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
     				if (dojo.bookListData.Books[_self.currentBookIndex].ContentPage) {
     					_self._gotoPage(1);
     				} else {
     					domStyle.set(query('.esriEditPageBody')[0], "display", "block");
     					domStyle.set(query('.esriMapBookEditPage')[0], "height", "100%");
     					domStyle.set(query('.contentLayoutOption')[0], "display", "block");
     					domStyle.set(query('.pageLayoutOption')[0], "display", "none");
     					_self._togglePageNavigation(false);

     				}
     			});

     			divAddNewPage = domConstruct.create("div", { "class": "esriAddNewPageDiv" }, divEditPageHeader);
     			domConstruct.create("div", { "class": "esriAddNewPageImg" }, divAddNewPage);
     			domConstruct.create("div", { "class": "esriAddNewPageLabel", "innerHTML": nls.addPage }, divAddNewPage);
     			divEditPageBody = domConstruct.create("div", { "class": "esriEditPageBody" }, divEditPage);
     			divPageSlider = domConstruct.create("div", { "class": "esriPageSliderContainer" }, divEditPageHeader);

     			_self._createPageSlider();
     			_self._createDnDModuleList();
     			_self._renderTemplateOptionPage(divEditPageBody, dojo.appConfigData.BookPageLayouts, true);
     			_self._renderTemplateOptionPage(divEditPageBody, dojo.appConfigData.ContentPageLayouts, false);
     			tempContHeight = dojo.window.getBox().h - domStyle.get(dom.byId("mapBookHeaderContainer"), "height") - domStyle.get(query(".esriEditPageHeader")[0], "height") - 10;
     			domStyle.set(divEditPageBody, "height", tempContHeight + 'px')
     			on(divAddNewPage, "click", function () {
     				if (query('.esriEditPageBody')[0]) {
     					if (dojo.bookListData.Books[_self.currentBookIndex].ContentPage) {
     						_self._clearTemplateSelection();
     						if (domStyle.get(query('.esriEditPageBody')[0], "display") == "none") {
     							domStyle.set(query('.esriEditPageBody')[0], "display", "block");
     							domStyle.set(query('.esriMapBookEditPage')[0], "height", "100%");
     							domStyle.set(query('.contentLayoutOption')[0], "display", "none");
     							domStyle.set(query('.pageLayoutOption')[0], "display", "block");
     							_self._togglePageNavigation(false);
     						}
     					} else {
     						alert(nls.errorMessages.contentPageRequired);
     					}
     				}
     			});
     			if (_self.isEditModeEnable) {
     				_self._enableMapBookEditing();
     				domStyle.set(query('.esriMapBookEditPage')[0], "display", "block");
     			}
     			if (!dojo.bookListData.Books[_self.currentBookIndex].ContentPage) {
     				_self.isEditModeEnable = false;
     				_self._enableMapBookEditing();
     				domStyle.set(query('.esriMapBookEditPage')[0], "display", "none");
     			}
     		},

     		_createPageSlider: function () {
     			var divPageSlider, divPageSliderLeft, divPageSliderContent, divPageSliderRight, listItem, divPage, ulist, _self = this;
     			divPageSlider = query('.esriPageSliderContainer')[0];
     			if (divPageSlider) {
     				domConstruct.empty(divPageSlider);
     			}
     			if (this.mapBookDetails[this.selectedMapBook].length > 2) {
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
     				_self.pageIndex = 0;
     				ulist = domConstruct.create("ul", { "class": "esriPageSliderUlist" }, divPageSliderContent);
     				for (var i = 2; i < this.mapBookDetails[this.selectedMapBook].length; i++) {
     					listItem = domConstruct.create("li", { "class": "esriPageSliderListItem" }, ulist);
     					divPage = domConstruct.create("div", { "class": "esriPageSliderDiv esriBookPage", "index": i, "innerHTML": "Page " + (i - 1) }, listItem);
     					on(divPage, "click", function (evt) {
     						_self._gotoPage(parseInt(domAttr.get(evt.currentTarget, "index")));
     					});
     				}
     				if (this.mapBookDetails[this.selectedMapBook].length == 2) {
     					domStyle.set(divPageSlider, "display", "none");
     				} else {
     					domStyle.set(divPageSlider, "display", "inline-block");
     				}
     			}
     		},

     		_highlightSelectedPage: function () {
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
     				if (domStyle.get(query(".esriPageSliderContainer")[0], "display") == "inline-block") {
     					if (query('.esriPageSliderListItem')[0]) {
     						sliderContentWidth = domStyle.get(query('.esriPageSliderContent')[0], 'width');
     						totalUlistWidth = domStyle.get(query('.esriPageSliderListItem')[0], "width") * (bookPageList.length - 2);
     						if (totalUlistWidth <= sliderContentWidth) {
     							domClass.add(query('.esriRightArrowIcon')[0], "esriRightArrowDisable");
     						}
     					}
     				}
     			}
     		},

     		_removeClass: function (node, className) {
     			if (domClass.contains(node, className)) {
     				domClass.remove(node, className)
     			}
     		},

     		_setSliderArrows: function () {
     			var sliderleft, pageUlistWidth, sliderContentWidth, pageWidth, pageUList;
     			if (query('.esriPageSliderContent')[0]) {
     				sliderContentWidth = domStyle.get(query('.esriPageSliderContent')[0], 'width');
     				pageUList = query('.esriPageSliderUlist')[0];
     				uListChild = query('.esriPageSliderUlist')[0].children.length;
     				if (domStyle.get(query(".esriPageSliderContainer")[0], "display") == "inline-block") {
     					pageWidth = domStyle.get(query('.esriPageSliderListItem')[0], "width");
     					pageUlistWidth = pageWidth * pageUList.childElementCount;
     					sliderleft = pageWidth * this.pageIndex;
     					if (this.pageIndex == 0) {
     						domClass.add(query('.esriLeftArrowIcon')[0], "esriLeftArrowDisable");
     						if (sliderContentWidth < pageUlistWidth) {
     							this._removeClass(query('.esriRightArrowIcon')[0], "esriRightArrowDisable");
     						} else {
     							domClass.add(query('.esriRightArrowIcon')[0], "esriRightArrowDisable");
     						}
     					}
     					else {
     						this._removeClass(query('.esriLeftArrowIcon')[0], "esriLeftArrowDisable");
     						if (sliderContentWidth >= pageUlistWidth + sliderleft) {
     							domClass.add(query('.esriRightArrowIcon')[0], "esriRightArrowDisable");
     						} else {
     							this._removeClass(query('.esriRightArrowIcon')[0], "esriRightArrowDisable");
     						}
     					}
     				}
     			}
     		},

     		_slidePage: function (isSlideLeft, pageNo) {
     			var pageWidth, pageUList, sliderLeft = 0;
     			if (domStyle.get(query(".esriPageSliderContainer")[0], "display") == "inline-block") {
     				pageWidth = domStyle.get(query('.esriPageSliderListItem')[0], "width");
     				pageUList = query('.esriPageSliderUlist')[0];
     				if (isSlideLeft) { this.pageIndex++; } else { this.pageIndex-- };
     				sliderLeft = this.pageIndex * pageWidth;
     				domStyle.set(pageUList, "margin-left", sliderLeft + 'px');
     				pageUList.style.marginLeft = sliderLeft + 'px';
     				this._setSliderArrows();
     			}
     		},

     		_createDnDModuleList: function () {
     			var _self = this, divDndModule, dndModuleContent, dndIocnDiv, webmapIcon, textareaIcon, videoIcon, copyIcon, flickrIcon, imageIcon;
     			var divEditPageHeader = query('.esriEditPageHeader')[0];

     			if (dom.byId("DNDContainer")) {
     				domConstruct.destroy(dom.byId("DNDContainer"));
     			}
     			if (divEditPageHeader) {
     				divDndModule = domConstruct.create("div", { "id": "DNDContainer", "class": "esriDragAndDropPanel" }, divEditPageHeader);
     				dndModuleContent = new dndSource("DNDContainer", { "type": "header", creator: _self._createAvatar, accept: [] });
     				domConstruct.create("div", { "innerHTML": nls.dndModuleText, "class": "esriDragAndDropTitle" }, divDndModule);
     				dndIocnDiv = domConstruct.create("div", { "class": "esriDragAndDropIcon" }, null);
     				webmapIcon = domConstruct.create("span", { "class": "esriDragAndDropWebmapIcon", "type": "webmap", "title": nls.webMapIconTitle }, dndIocnDiv);
     				textareaIcon = domConstruct.create("span", { "class": "esriDragAndDropTextareaIcon", "title": nls.textAreaIconTitle }, dndIocnDiv);
     				videoIcon = domConstruct.create("span", { "class": "esriDragAndDropVideoIcon", "title": nls.videoIconTitle }, dndIocnDiv);
     				copyIcon = domConstruct.create("span", { "class": "esriDragAndDropCopyIcon", "title": nls.freeFormIconTitle }, dndIocnDiv);
     				flickrIcon = domConstruct.create("span", { "class": "esriDragAndDropFlickrIcon", "title": nls.flickrIconTitle }, dndIocnDiv);
     				imageIcon = domConstruct.create("span", { "class": "esriDragAndDropImageIcon", "title": nls.imageIconTitle }, dndIocnDiv);
     				sampleArray = [];
     				dndModuleContent.copyOnly = true;
     				for (var i = 0; i < dndIocnDiv.children.length; i++) {
     					sampleArray.push({ data: dndIocnDiv.children[i].outerHTML, type: ["text"] });
     				}
     				dndModuleContent.insertNodes(false, sampleArray);
     				dndModuleContent.forInItems(function (item, id, map) {
     					domClass.add(id, item.type[0]);
     				});
     				dndModuleContent.checkAcceptance = function (source, nodes) {
     					return false;
     				};

     				on(dndModuleContent, "DndDrop", function (srcContainer, nodes, copy, targetContainer) {
     					if (srcContainer.type == "header") {
     						var nodesArray = targetContainer.getAllNodes();
     						for (var i = 0; i < nodesArray.length; i++) {
     							if (targetContainer.getAllNodes()[i].innerHTML == nodes[0].innerHTML) {
     								_self.currentNode = nodesArray[i];
     								_self.currentNode.index = i;
     								_self.currentNode.innerHTML = '';
     								firstChildClassName = nodes[0].firstElementChild ? nodes[0].firstElementChild.className : nodes[0].firstChild.className;
     								if (firstChildClassName == "esriDragAndDropWebmapIcon") {
     									_self._showModuleSettingDialog("webmap", true, targetContainer, nodesArray.length);
     									break;
     								}
     								else if (firstChildClassName == "esriDragAndDropVideoIcon") {
     									_self._showModuleSettingDialog("video", true, targetContainer, nodesArray.length);
     									break;
     								}
     								else if (firstChildClassName == "esriDragAndDropFlickrIcon") {
     									_self._showModuleSettingDialog("flickr", true, targetContainer, nodesArray.length);
     									break;
     								}
     								else if (firstChildClassName == "esriDragAndDropTextareaIcon") {
     									_self._showModuleSettingDialog("text", true, targetContainer, nodesArray.length);
     									break;
     								}
     								else if (firstChildClassName == "esriDragAndDropImageIcon") {
     									_self._showModuleSettingDialog("image", true, targetContainer, nodesArray.length);
     									break;
     								}
     								else if (firstChildClassName == "esriDragAndDropCopyIcon") {
     									_self._showModuleSettingDialog("HTML", true, targetContainer, nodesArray.length);
     									break;
     								}
     							}
     						}
     					}
     					else {
     						targetContainer.sync();
     						srcContainer.sync();
     						setTimeout(function () {
     							_self._saveModuleSequence(srcContainer, targetContainer);
     						}, 0);
     					}
     				});
     			}
     		},

     		_saveModuleSequence: function (srcContainer, targetContainer) {
     			var moduleKey, bookData, targetColIndex, srcColIndex, targetNodes, sourceNodes;
     			targetColIndex = parseInt(domAttr.get(targetContainer.node, "columnIndex"));
     			targetNodes = targetContainer.getAllNodes();
     			bookData = this._getConfigData(dojo.bookListData.Books[this.currentBookIndex]);
     			bookData.content[targetColIndex] = [];
     			if (srcContainer) {
     				srcColIndex = parseInt(domAttr.get(srcContainer.node, "columnIndex"));
     				sourceNodes = srcContainer.getAllNodes();
     			}
     			for (var i = 0; i < targetNodes.length; i++) {
     				if (srcContainer) {
     					targetNodes[i].firstElementChild ? firstChild = targetNodes[i].firstElementChild : firstChild = targetNodes[i].firstChild;
     					domClass.replace(firstChild, "esriLayoutDiv" + targetColIndex, "esriLayoutDiv" + srcColIndex);
     				}
     				else {
     					domClass.add(firstChild, "esriLayoutDiv" + targetColIndex);
     				}
     				moduleKey = domAttr.get(targetNodes[i], "moduleKey");
     				bookData.content[targetColIndex].push(moduleKey);
     			}
     			if (srcContainer) {
     				bookData.content[srcColIndex] = [];
     				for (var i = 0; i < sourceNodes.length; i++) {
     					moduleKey = domAttr.get(sourceNodes[i], "moduleKey");
     					bookData.content[srcColIndex].push(moduleKey);
     				}
     			}
     			this.mapBookDetails[this.selectedMapBook][this.currentIndex].content = bookData.content;
     		},

     		_renderTemplateOptionPage: function (divEditPageBody, configLayout, isBookPageLayout) {
     			var _self = this, layoutType, templateType, divTemplateContainer, divTemplatelist, divEditPageBodyContent, divEditPageFooter, divContinue, divCancel, tempIndex;
     			if (isBookPageLayout) {
     				layoutType = "pageLayoutOption";
     			} else {
     				layoutType = "contentLayoutOption";
     			}
     			divEditPageBodyContent = domConstruct.create("div", { "class": layoutType }, divEditPageBody);
     			var divTitle = domConstruct.create("div", { "class": "esriLabelSelectlayout", "innerHTML": nls.selectAnyLayout }, divEditPageBodyContent);
     			array.forEach(configLayout, function (layoutOption, index) {
     				divTemplateContainer = domConstruct.create("div", { "class": "esriTemplateContainer" }, divEditPageBodyContent);
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
     			});
     			divEditPageFooter = domConstruct.create("div", { "class": "esriEditPageFooter" }, divEditPageBodyContent);
     			divContinue = domConstruct.create("div", { "isBookPageLayout": isBookPageLayout, "class": "esriCancelBtn", "innerHTML": nls.continueText }, divEditPageFooter);
     			divCancel = domConstruct.create("div", { "class": "esriContinueBtn", "innerHTML": nls.cancelText }, divEditPageFooter);
     			on(divContinue, "click", function () {
     				templateType = domAttr.get(this, "isBookPageLayout");
     				if (query('.selectedTemplate')[0]) {
     					_self._togglePageNavigation(true);
     					_self._createNewPage(templateType);
     					_self._createPageSlider();
     					_self._setSliderWidth();
     					_self._highlightSelectedPage();
     					_self._setSliderArrows();
     				}
     			});
     			on(divCancel, "click", function () {
     				_self.isNavigationEnabled = true;
     				domStyle.set(query('.esriEditPageBody')[0], "display", "none");
     				domStyle.set(query('.esriMapBookEditPage')[0], "height", "auto");
     			});
     		},

     		_setSliderWidth: function () {
     			var sliderContainerWidth = domStyle.get(query('.esriEditPageHeader')[0], "width") - domStyle.get(query('.esriEditPageOptionList')[0], "width") - domStyle.get(query('.esriAddNewPageDiv')[0], "width");

     			if (query('.esriPageSliderContainer')[0]) {
     				if (sliderContainerWidth > 0) {
     					domStyle.set(query('.esriPageSliderContainer')[0], "width", sliderContainerWidth - 20 + 'px');
     				}
     			}
     			var SliderContainer = domStyle.get(query('.esriPageSliderContainer')[0], "width");
     			if (query('.esriPageSliderContent')[0]) {
     				if (SliderContainer > 0) {
     					domStyle.set(query('.esriPageSliderContent')[0], "width", SliderContainer - 80 + 'px');
     				}
     			}
     		},

     		_createNewPage: function (isBookPageLayout) {
     			var selectedTempIndex, newPage = {}, pageIndex, flag = false;
     			var currentPageIndex = this.currentIndex;
     			selectedTempIndex = parseInt(domAttr.get(query('.selectedTemplate')[0], "index"));
     			pageIndex = this.mapBookDetails[this.selectedMapBook].length;

     			if (isBookPageLayout) {
     				newPage = dojo.appConfigData.BookPageLayouts[selectedTempIndex];
     				newPage.type = "BookPages";
     				if (currentPageIndex > 2 && currentPageIndex !== pageIndex - 1) {
     					pageIndex = this.currentIndex + 1;
     					flag = true;
     				}
     				newPage.title = "Page " + (pageIndex - 1);
     			} else {
     				newPage = dojo.appConfigData.ContentPageLayouts[selectedTempIndex];
     				newPage.type = "ContentPage";
     				newPage.title = "Contents";
     				if (dojo.bookListData.Books[this.currentBookIndex].contentPage) {
     					dojo.bookListData.Books[this.currentBookIndex].contentPage = {};
     					dojo.moduleData[this.currentBookIndex].contentPage = {};
     				}
     			}
     			newPage.index = this.mapBookDetails[this.selectedMapBook].length;
     			domStyle.set(query('.esriEditPageBody')[0], "display", "none");
     			domStyle.set(query('.esriMapBookEditPage')[0], "height", "auto");
     			this._renderPage(newPage);
     			if (flag) {
     				this._insertNewPage(currentPageIndex + 1);
     			}
     			this._gotoPage(this.currentIndex);
     			this._updateTOC();
     			this._togglePageNavigation(true);

     		},

     		_insertNewPage: function (currentPageIndex) {

     			var selectedPage, bookPages, mapBookDetails, bookListdata;

     			selectedPage = dom.byId('mapBookPagesUList').children[this.currentIndex];

     			dom.byId('mapBookPagesUList').insertBefore(selectedPage, dom.byId('mapBookPagesUList').children[currentPageIndex]);
     			bookPages = dojo.moduleData[this.currentBookIndex].BookPages;
     			bookListdata = dojo.bookListData.Books[this.currentBookIndex].BookPages;

     			mapBookDetails = this.mapBookDetails[this.selectedMapBook];

     			this.mapBookDetails[this.selectedMapBook].splice(currentPageIndex, 0, mapBookDetails[this.currentIndex]);
     			bookPages.splice(currentPageIndex - 2, 0, bookPages[this.currentIndex - 2]);
     			bookListdata.splice(currentPageIndex - 2, 0, bookListdata[this.currentIndex - 2]);

     			this.mapBookDetails[this.selectedMapBook].splice(this.currentIndex + 1, 1);
     			bookPages.splice(this.currentIndex - 1, 1);
     			bookListdata.splice(this.currentIndex - 1, 1);

     			for (var i = currentPageIndex - 2; i < bookPages.length; i++) {
     				bookListdata[i].index = i + 2;
     			}
     			this.currentIndex = currentPageIndex;
     		},

     		_deletePage: function () {
     			var selectedPage, pageModuleContent, bookPages, bookPageIndex, _self = this;

     			selectedPage = dom.byId('mapBookPagesUList').children[this.currentIndex];
     			domStyle.set(selectedPage, "display", "none");
     			bookPages = dojo.moduleData[this.currentBookIndex].BookPages;
     			moduleData = dojo.moduleData[this.currentBookIndex].BookPages[this.currentIndex - 2];
     			bookPageIndex = this.currentIndex - 2;
     			pageModuleContent = query('.esriMapBookColContent', selectedPage);
     			this.mapBookDetails[this.selectedMapBook].splice(bookPageIndex + 2, 1);
     			for (var i = bookPageIndex; i < bookPages.length - 1; i++) {
     				this.mapBookDetails[this.selectedMapBook][i].index = i;
     			}
     			array.forEach(pageModuleContent, function (node) {
     				if (domAttr.get(node, "type") == "webmap") {
     					var moduleIndex = domAttr.get(node, "moduleIndex");
     					_self._destroyMap("map" + moduleIndex);
     				}
     			});

     			dojo.moduleData[this.currentBookIndex].BookPages.splice(bookPageIndex, 1);
     			dom.byId('mapBookPagesUList').removeChild(selectedPage);
     			this._createPageSlider();
     			this._setSliderWidth();
     			this._gotoPage(this.currentIndex - 1);
     			this._updateTOC();
     		},

     		_togglePageNavigation: function (enableNavigation) {
     			if (enableNavigation) {
     				this.isNavigationEnabled = true;
     				this._removeClass(this.mapBookNextPage, "esriNextDisabledEditMode");
     				this._removeClass(this.mapBookPreviousPage, "esriPrevDisabledEditMode");
     			} else {
     				this.isNavigationEnabled = false;
     				domClass.add(this.mapBookNextPage, "esriNextDisabledEditMode");
     				domClass.add(this.mapBookPreviousPage, "esriPrevDisabledEditMode");
     			}
     		},

     		_clearTemplateSelection: function (isBookPageLayout) {
     			var configLayout, selectedTemp, selectedClass, _self = this;

     			selectedTemp = query('.pageLayoutOption .esriTemplateImage');
     			configLayout = dojo.appConfigData.BookPageLayouts

     			array.forEach(selectedTemp, function (template, index) {
     				_self._removeClass(template, "selectedTemplate")
     				domAttr.set(template, "src", configLayout[index].templateIcon);
     			});

     			selectedTemp = query('.contentLayoutOption .esriTemplateImage');
     			configLayout = dojo.appConfigData.ContentPageLayouts


     			array.forEach(selectedTemp, function (template, index) {
     				_self._removeClass(template, "selectedTemplate")
     				domAttr.set(template, "src", configLayout[index].templateIcon);
     			});
     		},

     		_renderPage: function (page) {
     			var _self = this, listItem, pageHeight;
     			listItem = domConstruct.create("li", { "class": "esriMapBookPageListItem" }, null);
     			dom.byId("mapBookPagesUList").appendChild(listItem);
     			_self.currentIndex = page.index;
     			_self.currentPage = domConstruct.create("div", { "class": "esriMapBookPage", "pageIndex": page.index }, listItem);
     			_self.slidingPages.push(_self.currentPage);
     			domStyle.set(_self.currentPage, "width", Math.ceil(dom.byId("mapBookContentContainer").offsetWidth) + 'px');
     			_self._createPageLayout(page);
     			pageHeight = dojo.window.getBox().h - domStyle.get(dom.byId("mapBookHeaderContainer"), "height") - 5;

     			if (_self.isEditModeEnable) {
     				if (query(".esriEditPageHeader")[0]) {
     					domStyle.set(_self.currentPage, "margin-top", domStyle.get(query(".esriEditPageHeader")[0], "height") + 'px');
     					pageHeight -= domStyle.get(query(".esriEditPageHeader")[0], "height");
     					_self.currentPage.style.marginTop = domStyle.get(query(".esriEditPageHeader")[0], "height") + 'px';
     				}
     			}
     			if (page.index > 1) {
     				if (query(".esriFooterDiv")[0]) {
     					pageHeight -= domStyle.get(query(".esriFooterDiv")[0], "height");
     				}
     			}
     			domStyle.set(_self.currentPage, "height", pageHeight + 'px');
     		},

     		_createPageLayout: function (page) {
     			var _self = this, divPageTitle, newBookPage, moduleConfigData, parentContainer, pageContentHolder, mapBookPageContent, titleClass, pageLayoutClass;
     			var newModuleKey, data = {}, moduleIndex, pageModule, pageContentModule, arrContent = {};
     			var pageTitleClass = "esriMapBookPageTitle esriMapBookColContent";
     			if (!this.isEditModeEnable) {
     				mapBookPageContent = this._getConfigData(dojo.moduleData[_self.currentBookIndex]);
     			} else {
     				mapBookPageContent = lang.clone(dojo.appConfigData.ModuleDefaultsConfig);
     				newBookPage = {};
     				pageTitleClass += " esriEditableModeContent";
     				newBookPage = lang.clone(page);
     				if (page.title) {
     					mapBookPageContent.title["text"] = page.title;
     					arrContent["title"] = mapBookPageContent.title;
     				}
     			}


     			titleClass = "esriGeorgiaFont esriPageTitle";
     			if (page.type == "CoverPage") {
     				titleClass += ' esriTitleFontSize';
     			}
     			else {
     				pageTitleHolder = domConstruct.create("div", { "type": "text", "class": pageTitleClass }, _self.currentPage);
     				this._createTitleModule(mapBookPageContent.title, pageTitleHolder);
     			}
     			array.forEach(page.content, function (currentContent, columnIndex) {
     				var columnWidth = page.columnWidth[columnIndex] + '%';
     				if (page.columns === 1) {
     					pageLayoutClass = "esriLayoutDiv";
     				} else {
     					pageLayoutClass = "esriLayoutDiv" + columnIndex;
     				}
     				pageLayoutClass += ' esriMapBookColContent';
     				parentContainer = domConstruct.create("div", { "columnIndex": columnIndex, "pageIndex": page.index, "id": "cont" + columnIndex + page.index, "class": "esriColumnLayout" }, _self.currentPage);
     				domStyle.set(parentContainer, "width", columnWidth);
     				dndCont = new dndSource(parentContainer.id, { accept: ["webmap", "title", "image", "video", "TOC", "text"] });
     				if (!_self.isEditModeEnable || (page.index == 0 && columnIndex == 0)) {
     					dndCont.delay = 1000;
     					dndCont.checkAcceptance = function (source, nodes) {
     						return false;
     					};
     				} else {
     					newBookPage.content[columnIndex] = [];
     					dndCont.delay = 0;
     					dndCont.checkAcceptance = function (source, nodes) {
     						return true;
     					};
     				}
     				dndContentArray = [];
     				array.forEach(currentContent, function (currentModuleContent, contentIndex) {

     					pageContentContainer = domConstruct.create("div", {}, null);
     					pageContentHolder = domConstruct.create("div", { "class": pageLayoutClass + "  dojoDndItem" }, pageContentContainer);
     					pageModule = domConstruct.create("div", { "class": "divPageModule" }, pageContentHolder);
     					moduleIndex = contentIndex + '' + columnIndex + '' + page.index + '' + _self.currentBookIndex;
     					domAttr.set(pageContentHolder, "moduleIndex", moduleIndex);
     					domAttr.set(pageContentHolder, "columnIndex", columnIndex);
     					domAttr.set(pageContentHolder, "contentIndex", contentIndex);
     					domAttr.set(pageModule, "moduleIndex", moduleIndex);
     					if (currentModuleContent.length > 0) {
     						if (!_self.isEditModeEnable) {
     							domAttr.set(pageContentContainer, "moduleKey", currentModuleContent);
     							if (mapBookPageContent.hasOwnProperty(currentModuleContent)) {
     								pageContentModule = mapBookPageContent[currentModuleContent];
     								domAttr.set(pageContentHolder, "type", pageContentModule.type);
     								_self._renderModuleContent(pageContentModule.type, pageModule, pageContentModule);
     							}
     						} else {

     							pageContentModule = lang.clone(mapBookPageContent[currentModuleContent]);
     							domClass.add(pageContentHolder, "esriEditableModeContent");
     							domAttr.set(pageContentHolder, "type", pageContentModule.type);
     							domStyle.set(pageModule, "height", pageContentModule.height + "px");
     							if (currentModuleContent == "title" || currentModuleContent == "author") {
     								newModuleKey = currentModuleContent;
     								pageContentModule[pageContentModule.type] = dojo.bookListData.Books[_self.currentBookIndex][currentModuleContent];
     							} else {
     								newModuleKey = ((new Date()).getTime() + contentIndex).toString(); //get unique key in microseconds
     							}
     							domAttr.set(pageContentContainer, "moduleKey", newModuleKey);
     							newBookPage.content[columnIndex][contentIndex] = newModuleKey;
     							pageContentModule["uid"] = newModuleKey;
     							arrContent[newModuleKey] = pageContentModule;
     							if (currentModuleContent !== "TOC") {
     								if (pageContentModule[pageContentModule.type]) {
     									domAttr.set(pageModule, "innerHTML", pageContentModule[pageContentModule.type]);
     								} else {
     									domAttr.set(pageModule, "innerHTML", nls.untitled);

     								} _self._createEditMenu(pageModule.parentElement, newModuleKey);

     							} else {
     								_self._renderTOCContent(pageModule);
     							}
     						}
     						if (pageContentModule) {
     							pageContentContainer.type = pageContentModule.type;
     							domAttr.set(pageContentContainer, "type", pageContentModule.type);
     							dndContentArray.push(pageContentContainer);
     						}
     					}
     				});

     				on(dndCont, "DndStart", function () {
     					_self._setSliderWidth();
     				});

     				dndCont.insertNodes(false, dndContentArray);
     				dndCont.forInItems(function (item, id, map) {
     					domClass.add(id, item.type[0]);
     				});
     				dndCont.sync();
     				_self.DNDArray.push(dndCont);


     			});
     			if (_self.isEditModeEnable) {
     				_self._createDnDModuleList();
     				if (page.type == "BookPages") {
     					dojo.bookListData.Books[_self.currentBookIndex][page.type].push(newBookPage);
     					dojo.moduleData[_self.currentBookIndex].BookPages.push(arrContent);
     					_self.mapBookDetails[_self.selectedMapBook].push(newBookPage);
     				} else {
     					dojo.bookListData.Books[_self.currentBookIndex][page.type] = newBookPage;
     					dojo.moduleData[_self.currentBookIndex][page.type] = arrContent;
     					_self.mapBookDetails[_self.selectedMapBook][_self.currentIndex] = newBookPage;
     				}
     			}
     		},

     		_createLogo: function (pageContentModule, pageModule) {
     			var divLogo = domConstruct.create("div", {}, pageModule);
     			domAttr.set(divLogo, "innerHTML", "<img src=" + pageContentModule.path + " height=" + pageContentModule.height + ">");
     			this._createEditMenu(pageModule.parentElement, pageContentModule.uid);
     		},

     		_createEditMenu: function (pageContentHolder, moduleId) {
     			var _self = this, divEditIcon, divEditOption, divDeleteIcon, moduleContainer;
     			divEditOption = domConstruct.create("div", { "class": "esriEditContentOption" }, null);
     			pageContentHolder.appendChild(divEditOption);

     			var columnIndex = domAttr.get(pageContentHolder, "columnIndex");
     			if (!(this.currentIndex == 0 && columnIndex === "0" || moduleId === "title")) {
     				divDeleteIcon = domConstruct.create("div", { "key": moduleId, "class": "esriDeletetModuleIcon", "title": "Delete Module" }, divEditOption);
     				domAttr.set(divDeleteIcon, "type", domAttr.get(pageContentHolder, "type"));
     				on(divDeleteIcon, "click", function () {
     					var deleteModuleFlag = confirm(nls.confirmModuleDeleting);
     					if (deleteModuleFlag) {
     						moduleContainer = this.parentElement.parentElement;
     						_self._deleteModule(domAttr.get(this, "type"), false, moduleContainer, domAttr.get(this, "key"));

     					}
     				});
     			}
     			divEditIcon = domConstruct.create("div", { "key": moduleId, "class": "esriEditModuleIcon", "title": "Edit Module" }, divEditOption);
     			domAttr.set(divEditIcon, "type", domAttr.get(pageContentHolder, "type"));

     			on(divEditIcon, "click", function (evt) {
     				moduleContainer = evt.srcElement.parentElement.parentElement;
     				_self._showModuleSettingDialog(domAttr.get(this, "type"), false, moduleContainer, domAttr.get(this, "key"));

     			});
     		},

     		_deleteModule: function (moduleType, isNewModule, moduleContainer, moduleKey) {
     			var colIndex, columnData, isModuleValid, moduleIndex, moduleData, mapId;

     			moduleIndex = domAttr.get(moduleContainer, "moduleIndex");
     			domConstruct.destroy(moduleContainer);
     			colIndex = parseInt(domAttr.get(moduleContainer, "columnIndex"));
     			bookList = this._getConfigData(dojo.bookListData.Books[this.currentBookIndex]);
     			moduleData = this._getConfigData(dojo.moduleData[this.currentBookIndex]);

     			var contentIndex = parseInt(domAttr.get(moduleContainer, "contentIndex"));
     			this.mapBookDetails[this.selectedMapBook][this.currentIndex].content[colIndex][contentIndex] = [];
     			bookList.content[colIndex][contentIndex] = [];

     			delete moduleData[moduleKey];
     			if (moduleType == "webmap") {
     				mapId = "map" + moduleIndex;
     				this._destroyMap(mapId);
     			}
     		},

     		_destroyMap: function (mapId) {
     			var mapIndex, isMapExist = false;
     			array.forEach(this.webmapArray, function (currentMap, index) {
     				if (mapId == currentMap.id) {
     					mapIndex = index;
     					isMapExist = true;
     					if (dijit.registry.byId("legendContent" + currentMap.id)) {
     						dijit.registry.byId("legendContent" + currentMap.id).destroy();
     					}
     					currentMap.destroy();
     				}
     			});
     			if (isMapExist) {
     				this.webmapArray.splice(mapIndex, 1);
     			}
     		},

     		_showModuleSettingDialog: function (moduleType, isNewModule, moduleContainer, moduleKey) {
     			var label, dialogTitle, moduleInfo, moduleData, divModuleSetting, divTextEditor, inputContainer, _self = this, moduleAttr = {}, moduleInputs = [];

     			moduleInfo = lang.clone(dojo.appConfigData.ModuleDefaultsConfig);
     			moduleIconPath = dojo.appConfigData.DefaultModuleIcons[moduleType].path;
     			dialogTitle = '<img class="esriSettingModuleIcon" src=' + moduleIconPath + '>' + dojoString.substitute(nls.settingDialogTitle, { modType: moduleType.charAt(0).toUpperCase() + moduleType.slice(1) });

     			if (!isNewModule) {
     				moduleData = this._getConfigData(dojo.moduleData[this.currentBookIndex]);
     				moduleAttr = moduleData[moduleKey];
     				if (!moduleAttr) {
     					this._removeClass(query(".esriEditIcon")[0], "disableEditing");
     					return 0;
     				}
     			}
     			if (moduleInfo.hasOwnProperty(moduleType)) {
     				divModuleSetting = domConstruct.create("div", { "class": "esriModuleSettings" }, null);

     				for (var key in moduleInfo[moduleType]) {
     					if (isNewModule) {
     						moduleAttr[key] = moduleInfo[moduleType][key];
     					}
     					moduleSettingContent = domConstruct.create("div", { "class": "esriModuleContent" }, divModuleSetting);
     					label = domConstruct.create("div", { "class": "esriSettingLabel" }, moduleSettingContent);

     					var labelValue = key.charAt(0).toUpperCase() + key.slice(1);
     					labelValue = labelValue.replace("_", ' ');
     					if (key == "height") {
     						labelValue += '(px)';
     					}
     					domAttr.set(label, "innerHTML", labelValue);
     					if (key == "text" && moduleKey !== "title") {
     						if (dijit.byId("textEditor")) {
     							dijit.byId("textEditor").destroy();
     						}

     						divTextEditor = domConstruct.create("div", { "class": "esriTextArea" }, moduleSettingContent);
     						inputContainer = new editor({
     							height: '250px',
     							required: true,
     							plugins: ['bold', 'italic', 'underline', 'subscript', 'superscript', '|', 'indent', 'outdent', 'justifyLeft', 'justifyCenter', 'justifyRight'],
     							extraPlugins: ['createLink', { name: 'fontName', plainText: true }, { name: 'fontSize', plainText: true}],
     							"class": "esriSettingInput",
     							id: "textEditor"
     						}, divTextEditor);
     						inputContainer.startup();

     						inputContainer.setValue(moduleAttr[key]);
     						domAttr.set(inputContainer.domNode, "inputKey", key);
     						moduleInputs.push(inputContainer);

     					} else if (key == "HTML") {
     						divTextEditor = domConstruct.create("div", { "class": "esriTextArea" }, moduleSettingContent);
     						divTextArea = new Textarea({
     							value: moduleAttr[key],
     							"class": "esriSettingInput"
     						}, divTextEditor);
     						divTextArea.startup();
     						domAttr.set(divTextArea.domNode, "inputKey", key);
     						moduleInputs.push(divTextArea);

     					} else {
     						if (key == "webmap" || key == "id" || key == "photoset_id" || key == "path" || key == "height") {
     							isValidationRequired = true;
     						}
     						else {
     							isValidationRequired = false;
     						}
     						moduleDivContainer = domConstruct.create("div", { "inputKey": key, "class": "esriSettingInputHolder" }, moduleSettingContent);
     						moduleInputContainer = new dijit.form.ValidationTextBox({
     							required: isValidationRequired,
     							"class": "esriSettingInput"
     						}, moduleDivContainer);
     						moduleInputContainer.startup();
     						moduleInputs.push(moduleInputContainer);
     						moduleInputContainer.setValue(moduleAttr[key]);
     						domAttr.set(moduleInputContainer.domNode, "inputKey", key);
     						if (key == "height" && moduleKey === "title") {
     							moduleInputContainer.textbox.readOnly = true;
     						}
     					}
     					if (key == "type") {
     						domStyle.set(moduleSettingContent, "display", "none");
     					}
     				}

     				dijit.byId("settingDialog").titleNode.innerHTML = dialogTitle;
     				dijit.byId("settingDialog").setContent(divModuleSetting);
     				btns = domConstruct.create("div", { "class": "esriButtonContainer" }, divModuleSetting);
     				btnSave = domConstruct.create("div", { "moduleKey": moduleKey, "class": "esriSettingSave", "type": isNewModule, "innerHTML": "Save" }, btns);
     				on(btnSave, "click", function () {
     					_self._validateInputFields(this, moduleContainer, moduleType, moduleInputs);
     				});
     			}
     			dijit.byId("settingDialog").show();
     		},

     		_validateInputFields: function (btnNode, moduleContainer, moduleType, moduleInputs) {

     			var moduleKey, isNewModule, isModuleValid;
     			for (var i = 0; i < moduleInputs.length; i++) {
     				if (moduleInputs[i].value == "" && moduleInputs[i].required) {
     					alert(nls.fieldIsEmpty);
     					return;
     				}
     			}
     			moduleKey = domAttr.get(btnNode, "moduleKey");
     			isNewModule = domAttr.get(btnNode, "type");
     			if (isNewModule) {
     				this._createNewModule(moduleContainer, moduleType, moduleKey, moduleInputs);
     				domAttr.set(btnNode, "type", false);
     			} else {
     				this._updateExistingModule(moduleContainer, moduleType, moduleKey, moduleInputs);
     			}
     		},

     		_updateExistingModule: function (moduleContainer, moduleType, moduleKey, moduleInputs) {

     			var moduleIndex, inputFields, moduleData, moduleAttr, pageModule, divText;
     			moduleIndex = domAttr.get(moduleContainer, "moduleIndex");
     			domConstruct.empty(moduleContainer);
     			inputFields = query('.esriSettingInput');
     			moduleData = {};
     			for (var j = 0; j < inputFields.length; j++) {
     				inputKey = domAttr.get(inputFields[j], "inputKey");
     				moduleData[inputKey] = moduleInputs[j].value;
     			}
     			moduleContent = this._getConfigData(dojo.moduleData[this.currentBookIndex]);
     			moduleAttr = moduleContent[moduleKey];
     			for (attr in moduleAttr) {
     				if (moduleData[attr]) {
     					moduleAttr[attr] = moduleData[attr];
     				}
     			}
     			bookListData = this._getConfigData(dojo.bookListData.Books[this.currentBookIndex]);
     			moduleIndex = domAttr.get(moduleContainer, "moduleIndex");
     			if (moduleKey == "title" && this.currentIndex !== 0) {
     				this._createTitleModule(moduleAttr, moduleContainer);
     				bookListData.title = moduleAttr["text"];
     				this.mapBookDetails[this.selectedMapBook][this.currentIndex][moduleKey] = moduleAttr["text"];
     				this._updateTOC();
     			} else {
     				pageModule = domConstruct.create("div", { "moduleIndex": moduleIndex, "class": "divPageModule" }, moduleContainer);
     				domAttr.set(pageModule, "type", moduleType);
     				this._renderModuleContent(moduleType, pageModule, moduleAttr);
     			}
     			dijit.byId("settingDialog").hide();
     		},

     		_createTitleModule: function (moduleData, pageTitleHolder) {
     			var divText = domConstruct.create("div", { "class": "esriGeorgiaFont esriPageTitle", "innerHTML": moduleData[moduleData.type] }, pageTitleHolder);
     			domStyle.set(divText, "height", moduleData["height"] + 'px');
     			this._createEditMenu(pageTitleHolder, moduleData.uid);
     		},

     		_renderModuleContent: function (moduleType, pageModule, moduleData) {

     			var moduleIndex = domAttr.get(pageModule.parentElement, "moduleIndex");
     			switch (moduleType) {
     				case "webmap":
     					{
     						this._createWebmapModule(moduleData, pageModule, moduleIndex);
     						break;
     					}
     				case "video":
     					{
     						this._renderVideoContent(moduleData, pageModule);
     						break;
     					}
     				case "image":
     					{
     						this._createImageModule(moduleData, pageModule, moduleIndex);
     						break;
     					}
     				case "flickr":
     					{
     						this._renderPhotoSetContent(moduleData, pageModule);
     						break;
     					}
     				case "logo":
     					{
     						this._createLogo(moduleData, pageModule);
     						break;
     					}
     				case "TOC":
     					{
     						this._renderTOCContent(pageModule);
     						break;
     					}
     				default:
     					{
     						this._createTextModule(moduleData, pageModule);
     						break;
     					}
     			}

     		},

     		_createTextModule: function (moduleData, pageModule) {
     			var bookPages, divText;
     			divText = domConstruct.create("div", { "innerHTML": moduleData[moduleData.type] }, pageModule);
     			domStyle.set(divText, "height", moduleData["height"] + 'px');
     			if (moduleData.uid == "author") {
     				domClass.add(divText, "esriArialFont esriMapBookAuthor");
     				dojo.bookListData.Books[this.currentBookIndex].author = moduleData.text;
     				query('.esriBookAuthor')[this.currentBookIndex].innerHTML = moduleData.text;
     			} else if (moduleData.uid == "title") {
     				domClass.add(divText, "esriGeorgiaFont esriPageTitle esriTitleFontSize");
     				dojo.bookListData.Books[this.currentBookIndex].title = moduleData.text;
     				this.mapBookDetails[this.selectedMapBook][this.currentIndex].title = moduleData.text;
     				query('.esriBookTitle')[this.currentBookIndex].innerHTML = moduleData.text;
     				query('.esriMapBookList')[this.currentBookIndex].value = moduleData.text;
     				bookPages = lang.clone(this.mapBookDetails[this.selectedMapBook]);
     				delete this.mapBookDetails[this.selectedMapBook];
     				this.selectedMapBook = moduleData.text;
     				this.mapBookDetails[this.selectedMapBook] = bookPages;

     			} else {
     				domClass.add(divText, "esriArialFont esriText");
     			}
     			this._createEditMenu(pageModule.parentElement, moduleData.uid);

     		},

     		_createNewModule: function (targetContainer, moduleType, index, moduleInputs) {
     			var columnIndex, inputFields, moduleData, divModuleContent, inputKey, moduleAttr, bookList, newModuleKey, newModuleIndex;

     			columnIndex = parseInt(domAttr.get(targetContainer.node, "columnIndex"));
     			newModuleIndex = index + '' + columnIndex + '' + this.currentIndex + "new" + '' + this.currentBookIndex;
     			inputFields = query('.esriSettingInput');
     			moduleData = {};
     			for (var j = 0; j < inputFields.length; j++) {
     				inputKey = domAttr.get(inputFields[j], "inputKey");
     				moduleData[inputKey] = moduleInputs[j].value;
     			}
     			newModuleKey = ((new Date()).getTime()).toString();
     			moduleData["uid"] = newModuleKey;
     			moduleData["type"] = moduleType;

     			divModuleContent = domConstruct.create("div", { "class": "esriEditableModeContent esriMapBookColContent dojoDndItem esriLayoutDiv" + columnIndex }, null);
     			domAttr.set(divModuleContent, "moduleIndex", newModuleIndex);
     			pageModule = domConstruct.create("div", { "moduleIndex": newModuleIndex, "class": "divPageModule" }, divModuleContent);
     			domAttr.set(divModuleContent, "type", moduleType);
     			this._renderModuleContent(moduleType, pageModule, moduleData);
     			this.currentNode.appendChild(divModuleContent);
     			bookList = this._getConfigData(dojo.bookListData.Books[this.currentBookIndex]);
     			moduleAttr = this._getConfigData(dojo.moduleData[this.currentBookIndex]);
     			if (!bookList.content[columnIndex]) {
     				bookList.content[columnIndex] = [];
     			}
     			bookList.content[columnIndex].splice(this.currentNode.index, 0, newModuleKey);
     			moduleAttr[newModuleKey] = moduleData;
     			this.mapBookDetails[this.selectedMapBook][this.currentIndex].content = bookList.content;
     			dijit.byId("settingDialog").hide();
     		},

     		_getConfigData: function (configData) {
     			var data;
     			if (this.currentIndex == 0) {
     				data = configData.CoverPage;
     			} else if (this.currentIndex == 1) {
     				data = configData.ContentPage;
     			} else {
     				if (configData.BookPages.length > (this.currentIndex - 2)) {
     					data = configData.BookPages[this.currentIndex - 2];
     				}
     			}
     			return data;
     		},

     		_updateTOC: function () {
     			var oldTOC;
     			oldTOC = query('.esriMapBookColContent .esriTOCcontainer')[0];
     			if (oldTOC) {
     				this._renderTOCContent(oldTOC.parentElement);
     			}
     			this._renderTOCContent(dom.byId("divContentList"));
     		},

     		_createWebmapModule: function (pageContentModule, pageModule, moduleIndex) {

     			var divMapModuleHolder, mapContent, mapTitle, mapContentBtns, mapContentImgs, imgViewFullMap, imgLegend, mapCaption, loadingIndicator, loadingIndicatorImage, _self = this;
     			var divFullMapView, cPage;
     			divMapModuleHolder = domConstruct.create("div", { "class": "mapModule" }, pageModule);
     			if (pageContentModule.webmap) {
     				if (pageContentModule.title) {
     					mapTitle = domConstruct.create("div", { "class": "esriModuleTitle" }, null);
     					domAttr.set(mapTitle, "innerHTML", pageContentModule.title);
     					divMapModuleHolder.appendChild(mapTitle);
     				}
     				mapContentBtns = domConstruct.create("div", { "id": "divMapContainer" + moduleIndex, "class": "esriMapContainer" }, divMapModuleHolder);
     				domStyle.set(mapContentBtns, "height", pageContentModule.height + 'px');
     				mapContent = domConstruct.create("div", { "id": "map" + moduleIndex }, mapContentBtns);
     				domClass.add(mapContent, "esriCTFullHeightWidth");

     				mapContentImgs = domConstruct.create("div", { "class": "mapContentImgs" }, null);
     				imgViewFullMap = domConstruct.create("span", { "index": moduleIndex, "title": nls.fullScreen, "class": "imgfullMapView" }, mapContentImgs);
     				imgLegendData = domConstruct.create("span", { "index": moduleIndex, "title": nls.legendTitle, "class": "imgLegend" }, mapContentImgs);
     				loadingIndicator = domConstruct.create("div", { id: "loadingmap" + moduleIndex, "class": "mapLoadingIndicator" }, mapContent);
     				loadingIndicatorImage = domConstruct.create("div", { "class": "mapLoadingIndicatorImage" }, loadingIndicator);

     				on(imgLegendData, "click", function (evt) {
     					_self._toggleLegendContainer(evt);
     				});
     				divFullMapView = domConstruct.create("div", { "class": "esriFullMap", "id": "viewFull" + moduleIndex }, null);
     				cPage = dom.byId("mapBookPagesUList").children[_self.currentIndex];
     				cPage.appendChild(divFullMapView);

     				on(imgViewFullMap, "click", function (evt) {
     					if (domClass.contains(dom.byId("divContentListPanel"), "esriContentPanelOpened")) {
     						domClass.remove(dom.byId("divContentListPanel"), "esriContentPanelOpened");
     						domClass.remove(query(".esriTocIcon")[0], "esriHeaderIconSelected");
     					}
     					_self._viewFullMap(evt);
     				});

     				if (pageContentModule.caption) {
     					mapCaption = domConstruct.create("div", { "class": "esriModuleCaption" }, null);
     					domAttr.set(mapCaption, "innerHTML", pageContentModule.caption);
     					divMapModuleHolder.appendChild(mapCaption);
     				}
     				_self._renderWebMapContent(pageContentModule, mapContent.id, mapContentImgs, pageModule.parentElement);
     			} else {
     				domStyle.set(divMapModuleHolder, "height", pageContentModule.height + 'px');

     			}
     			_self._createEditMenu(pageModule.parentElement, pageContentModule.uid);

     		},

     		_viewFullMap: function (evt) {
     			var _self = this, containerId, divFullMap, zoomSlider, divCustomMap, timeSlider, mapContainer;
     			containerId = domAttr.get(evt.srcElement, "index");
     			mapContainer = dom.byId("map" + containerId);
     			divFullMap = dom.byId("viewFull" + containerId);
     			zoomSlider = query('.esriSimpleSlider', mapContainer)[0];
     			timeSlider = query('.esriTimeSlider', mapContainer)[0];
     			esriLogo = query('.esriControlsBR', mapContainer)[0];
     			divCustomMap = dom.byId("divMapContainer" + containerId);

     			if (domStyle.get(divFullMap, "display") == "none") {
     				domStyle.set(divFullMap, "display", "block");
     				divFullMap.appendChild(dom.byId("map" + containerId));
     				if (zoomSlider) {
     					domStyle.set(zoomSlider, "display", "block");
     				}
     				if (timeSlider && esriLogo) {
     					domStyle.set(esriLogo, "bottom", "50px");
     				}
     				array.some(_self.webmapArray, function (currentMap) {
     					if (mapContainer.id == currentMap.id) {
     						currentMap.infoWindow.popupWindow = true;
     						currentMap.infoWindow.set("highlight", false);
     						currentMap.resize();
     					}
     					on(currentMap, "click", function () {
     						if (!currentMap.infoWindow.highlight && domStyle.get(divFullMap, "display") == "block") {
     							currentMap.infoWindow.set("highlight", true);
     						}
     					});
     				});
     			} else {
     				domStyle.set(divFullMap, "display", "none");
     				divCustomMap.appendChild(mapContainer);
     				if (zoomSlider) {
     					domStyle.set(zoomSlider, "display", "none");
     				}
     				if (esriLogo) {
     					domStyle.set(esriLogo, "bottom", "5px");
     				}
     				array.some(_self.webmapArray, function (currentMap) {
     					if (mapContainer.id == currentMap.id) {
     						currentMap.infoWindow.popupWindow = false;
     						currentMap.infoWindow.set("highlight", false);
     						currentMap.resize();
     						currentMap.infoWindow.hide();
     					}
     				});
     			}
     		},

     		_toggleLegendContainer: function (evt) {
     			var containerId = "legendContentmap" + domAttr.get(evt.srcElement, "index")
     			if (domClass.contains(dom.byId(containerId), "esriLegendContainerOpen")) {
     				domClass.remove(dom.byId(containerId), "esriLegendContainerOpen");
     			} else {
     				domClass.add(dom.byId(containerId), "esriLegendContainerOpen");
     			}
     		},

     		_createImageModule: function (pageContentModule, pageModule, moduleIndex) {
     			var _self = this, innerDiv, imgModule, imgImg, imageContainer, imageHeight, imageWidth;
     			innerDiv = domConstruct.create("div", { "id": "innerDiv" + "Img" + moduleIndex, "style": 'height:' + pageContentModule.height + 'px; width:' + pageContentModule.height + 'px', "class": "innerDiv" }, pageModule);
     			imgModule = domConstruct.create("img", { "class": "esriImageModule", "style": 'height:' + pageContentModule.height + 'px; width:' + pageContentModule.width + 'px', "src": pageContentModule.path }, innerDiv);
     			if (pageContentModule.path == '') {
     				domAttr.set(innerDiv, "innerHTML", "Image");
     			}
     			imgModule.path = pageContentModule.path;
     			on(imgModule, "click", function (evt) {
     				var dialog = new dojox.image.LightboxDialog({});
     				dialog.startup();
     				dialog.show({ title: "", href: evt.currentTarget.path });
     			});
     			_self._createEditMenu(pageModule.parentElement, pageContentModule.uid);

     		},

     		_renderVideoContent: function (pageContentModule, pageModule) {
     			var embed = '', divModuleInfo, videoSize, videoWidth = "", videoHeight = "";
     			videoSize = pageContentModule.height + pageContentModule.width;
     			if (pageContentModule.title) {
     				embed += '<div class="esriModuleTitle">' + pageContentModule.title + '</div>';
     			}
     			switch (pageContentModule.provider) {
     				case "vimeo":
     					embed += "<iframe width=" + "90%" + " height=" + pageContentModule.height + "px" + "  src=" + 'http://player.vimeo.com/video/' + pageContentModule.id + " frameborder=0 webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>";
     					break;
     				case "youtube":
     					embed += "<iframe width=" + "90%" + " height=" + pageContentModule.height + "px src= 'http://www.youtube.com/embed/' " + pageContentModule.id + " frameborder='0' allowfullscreen></iframe>";
     					break;
     				case "esrivideo":
     					embed += "<iframe width=" + "90%" + " height=" + pageContentModule.height + "px" + "  src=" + 'http://video.esri.com/iframe/' + pageContentModule.id + " frameborder=0 webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>";
     					break;
     				case "esri":
     					embed += "<iframe width=" + "90%" + "height=" + pageContentModule.height + "  src=" + 'http://video.esri.com/iframe/' + pageContentModule.id + " frameborder=0 webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>";
     					break;
     			}
     			if (pageContentModule.caption) {
     				embed += '<div class="esriModuleCaption">' + pageContentModule.caption + '</div>';
     			}
     			pageModule.innerHTML = embed;
     			this._createEditMenu(pageModule.parentElement, pageContentModule.uid);

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

     		_renderWebMapContent: function (currentModuleContent, mapId, mapContentImgs, moduleContainer) {
     			var _self = this, webmapUrl;

     			webmapUrl = urlUtils.urlToObject(currentModuleContent.webmap);
     			if (webmapUrl.query) {
     				if (webmapUrl.query['webmap']) {
     					webmapUrl.path = webmapUrl.query['webmap'];
     				} else if (webmapUrl.query['id']) {
     					webmapUrl.path = webmapUrl.query['id'];
     				}
     			}
     			_self._destroyMap(mapId);
     			if (webmapUrl.path) {
     				arcgisUtils.createMap(webmapUrl.path, mapId, {
     					mapOptions: {
     						slider: true
     					},
     					ignorePopups: false
     				}).then(function (response) {
     					response.map.root.appendChild(mapContentImgs);
     					_self.webmapArray.push(response.map);
     					response.map.on("layers-add-result", function () {
     						_self._initTimeSlider(response);
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
     				}, function (error) {
     					alert(nls.errorMessages.invalidMapUrl);
     					if (_self.isEditModeEnable) {
     						domClass.add(query(".esriEditIcon")[0], "disableEditing");
     						_self._showModuleSettingDialog("webmap", false, moduleContainer, currentModuleContent.uid);
     					}
     				});
     			}
     		},

     		_initTimeSlider: function (response) {
     			var webmap, showTimeSlider, itemData, timeSlider, webmapTimeSlider, timeExtent;
     			webmap = response.map;
     			showTimeSlider = false;
     			itemData = response.itemInfo.itemData;
     			for (var i = 0; i < itemData.operationalLayers.length; i++) {
     				if (itemData.operationalLayers[i].layerObject.timeInfo) {
     					if (!(itemData.operationalLayers[i].timeAnimation == false)) {
     						showTimeSlider = true;
     						break;
     					}
     				}
     			}

     			if (showTimeSlider) {
     				if (dijit.byId("Slider" + webmap.id)) {
     					dijit.byId("Slider" + webmap.id).destroy();
     				}
     				sliderDiv = domConstruct.create("div", { "id": "Slider" + webmap.id, "class": "esriSliderDemo" }, webmap.root);
     				timeSlider = new TimeSlider({
     					style: "width: 100%;"
     				}, dom.byId("Slider" + webmap.id));
     				webmap.setTimeSlider(timeSlider);
     				webmapTimeSlider = itemData.widgets.timeSlider;
     				timeExtent = new TimeExtent();
     				timeExtent.startTime = new Date(webmapTimeSlider.properties.startTime);
     				timeExtent.endTime = new Date(webmapTimeSlider.properties.endTime);
     				timeSlider.setThumbCount(webmapTimeSlider.properties.thumbCount);
     				timeSlider.createTimeStopsByTimeInterval(timeExtent, webmapTimeSlider.properties.timeStopInterval.interval, webmapTimeSlider.properties.timeStopInterval.units);
     				timeSlider.startup();
     			}
     		},

     		_renderTOCContent: function (parentNode, moduleData) {
     			var _self = this, tocContent, anchorTag, divPageNo, divPageTitle, tocContent;
     			tocContent = query('.esriTOCcontainer', parentNode)[0];
     			if (tocContent) {
     				domConstruct.destroy(tocContent);
     			}
     			tocContent = domConstruct.create("div", { "class": "esriTOCcontainer" }, null);

     			for (var pageIndex = 0; pageIndex < _self.mapBookDetails[_self.selectedMapBook].length; pageIndex++) {
     				anchorTag = domConstruct.create("div", { "class": "esriContentListDiv" }, null);
     				divPageTitle = domConstruct.create("div", { "value": pageIndex, "class": "esriTitleListDiv" }, anchorTag);
     				divPageNo = domConstruct.create("div", { "value": pageIndex, "class": "esriTitleIndexDiv" }, anchorTag);

     				title = _self.mapBookDetails[_self.selectedMapBook][pageIndex].title;
     				domAttr.set(divPageTitle, "innerHTML", title);
     				if (pageIndex > 1) {
     					domAttr.set(divPageNo, "innerHTML", (pageIndex - 1));
     				}
     				tocContent.appendChild(anchorTag);
     				on(anchorTag, "click", function (evt) {
     					if (!domClass.contains(this.parentElement.parentElement.parentElement, "esriEditableModeContent")) {
     						_self._gotoPage(evt.target.value);
     						evt.cancelBubble = true;
     						evt.cancelable = true;
     					}
     					evt.stopPropagation();
     				});
     			}
     			if (anchorTag) {
     				domStyle.set(anchorTag, "border-bottom", "none");
     			}
     			if (moduleData) {
     				domStyle.set(parentNode, "height", moduleData.height + "px");
     			}
     			parentNode.appendChild(tocContent);
     		},

     		_renderPhotoSetContent: function (moduleData, pageModule) {
     			var divModuleInfo, photsetContent;
     			photsetContent = new flickrBadge({
     				"apikey": "4e02b880dc9fc2825fdfdc2972e6843c",
     				"setid": moduleData.photoset_id,
     				"username": "dylans",
     				"cols": moduleData.columns,
     				"rows": moduleData.rows,
     				"target": "_blank"
     			});
     			photsetContent.startup();
     			if (moduleData.title) {
     				divModuleInfo = domConstruct.create("div", { "class": "esriModuleTitle" }, null);
     				domAttr.set(divModuleInfo, "innerHTML", moduleData.title);
     				pageModule.appendChild(divModuleInfo);
     			}
     			pageModule.appendChild(photsetContent.domNode);

     			if (moduleData.caption) {
     				divModuleInfo = domConstruct.create("div", { "class": "esriModuleTitle" }, null);
     				domAttr.set(divModuleInfo, "innerHTML", moduleData.caption);
     				pageModule.appendChild(divModuleInfo);
     			}
     			this._createEditMenu(pageModule.parentElement, moduleData.uid);
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