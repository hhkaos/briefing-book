define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
	"dojo/dom-construct",
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
    "dijit/_editor/plugins/FontChoice",
	"dijit/_editor/plugins/LinkDialog",
	"esri/request",
    "dojo/text!./templates/mapBookCollectionTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!nls/localizedStrings",
    "dojox/gesture/swipe",
    "../mapBookCollection/mapbookDijits",
	"../mapBookCollection/pageNavigation",
	"../mapBookCollection/moduleRenderer",
	"../mapBookCollection/pageRenderer",
	"dojo/parser"
],
  function (declare, lang, array, domConstruct, domAttr, domStyle, domClass, dom, on, touch, topic, query, dojoString, dndSource, FontChoice, LinkDialog, esriRequest, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, nls, swipe, mapbookDijits, pageNavigation, moduleRenderer, pageRenderer) {
  	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, mapbookDijits, pageNavigation, moduleRenderer, pageRenderer], {
  		templateString: template,
  		nls: nls,
  		mapBookDetails: {},
  		currentIndex: null,
  		currentBookIndex: 0,
  		webmapArray: [],
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
  				_self.isEditModeEnable = true;
  				_self._displaySelectedBookContent(dojo.bookListData.Books[bookIndex]);
  			});
  			topic.subscribe("destroyWebmapHandler", function () {
  				array.forEach(_self.webmapArray, function (webmap) {
  					webmap.destroy();
  				});
  			});

  			dom.byId("divCTParentDivContainer").appendChild(this.divOuterContainer);
  			_self._createMapBookList();
  			_self._createMapBookEsriLogo();
  			_self._createContentListPanel();
  			_self._resizeMapBook();

  			_self.own(on(window, "resize", function () {
  				_self._resizeMapBook();
  			}));

  			_self.own(on(window, "orientationchange", function () {
  				_self._resizeMapBook();
  			}));

  			_self.own(on(this.mapBookPreviousPage, "click", function () {
  				_self._handlePageNavigation(this, true);
  			}));

  			_self.own(on(this.mapBookNextPage, "click", function () {
  				_self._handlePageNavigation(this, false);
  			}));
  		},

  		_createMapBookList: function () {
  			var count = 0, container, _self = this, currentMapBook, mapbookTitle;
  			domConstruct.empty(dom.byId("mapBookContent"));
  			array.forEach(dojo.bookListData.Books, function (currentBook, bookIndex) {
  				if (count % 25 === 0) {
  					container = domConstruct.create("div", { "class": "esriMapBookListContainer" }, dom.byId("mapBookContent"));
  				}
  				count++;
  				mapBookContainer = domConstruct.create("div", { "class": "esriBookContainer" }, container);
  				currentMapBook = domConstruct.create("div", { "class": "esriMapBookList", "index": bookIndex, "value": currentBook.title }, mapBookContainer);
  				mapBookdivClose = domConstruct.create("div", { "class": "esriBookclose" }, currentMapBook);
  				mapBookdivContainer = domConstruct.create("div", { "class": "esriBookTitlediv" }, currentMapBook);
  				mapBookdivContainerInner = domConstruct.create("div", { "class": "esriBookTitledivInner" }, mapBookdivContainer);
  				mapBookname = domConstruct.create("div", { "class": "esriBookTitle", "title": currentBook.title, "innerHTML": currentBook.title }, mapBookdivContainerInner);
  				mapBookAuthor = domConstruct.create("div", { "class": "esriBookAuthor", "innerHTML": currentBook.author }, currentMapBook);
  				_self.webmapArray = [];
  				if (currentBook.title.length > 20) {
  					domAttr.set(mapBookname, "title", currentBook.title);
  				}
  				_self.own(on(currentMapBook, "click", function (evt) {
  					if (domClass.contains(evt.target, "esriBookclose") && dojo.appConfigData.AuthoringMode) {
  						_self.currentBookIndex = parseInt(domAttr.get(evt.target.parentElement, "index"));
  						_self._deleteSeletedBook(domAttr.get(evt.target.parentElement, "value"));
  					} else {
  						if (dojo.appConfigData.AuthoringMode) {
  							if (domClass.contains(query('.esriDeleteBookIcon')[0], "esriHeaderIconSelected")) {
  								return 0;
  							}
  						}
  						_self.currentBookIndex = parseInt(domAttr.get(this, "index"));
  						mapbookTitle = domAttr.get(this, "value");
  						array.some(dojo.bookListData.Books, function (book, index) {
  							if (book.title == mapbookTitle && _self.currentBookIndex == index) {
  								_self._displaySelectedBookContent(book);
  							}
  						});

  					}
  				}));
  			});
  			if (query('.esriDeleteBookIcon')[0]) {
  				this._removeClass(query('.esriDeleteBookIcon')[0], "esriHeaderIconSelected");
  			}
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
  				this._toggleDeleteBookOption(false);
  				domStyle.set(query(".esriDeleteBookIcon")[0], "display", "none");
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
  			this._displayBookContent(book);
  			this.currentIndex = 0;

  			if (this.mapBookDetails[this.selectedMapBook].length == 1) {
  				domClass.add(this.mapBookNextPage, "esriNextDisabled");
  			} else {
  				if (this.mapBookDetails[this.selectedMapBook].length == 2 && this.mapBookDetails[this.selectedMapBook][1] == "EmptyContent") {
  					domClass.add(this.mapBookNextPage, "esriNextDisabled");
  				} else {
  					this._removeClass(this.mapBookNextPage, "esriNextDisabled");
  				}
  				domClass.add(this.mapBookPreviousPage, "esriPrevDisabled");
  			}
  		},

  		_enableMapBookEditing: function () {
  			var divTitle, mapBookContents;
  			this._resizeMapBook();
  			mapBookContents = query('.esriMapBookColContent');
  			if (this.currentIndex > 1) {
  				divTitle = query('.esriMapBookPageTitle', dom.byId("mapBookPagesUList").children[this.currentIndex])[0];
  				if (divTitle && divTitle.innerHTML.length == 0) {
  					domAttr.set(divTitle, "innerHTML", "Page " + (this.currentIndex - 1));
  				}
  			}
  			if (this.isEditModeEnable) {
  				domStyle.set(query(".esriMapBookEditPage")[0], "display", "block");
  				array.forEach(mapBookContents, function (node) {
  					domClass.add(node, "esriEditableModeContent");
  				});
  				this._setSliderWidth();
  				this._setSliderArrows();
  				this._highlightSelectedPage();

  			} else {
  				this._updateTOC();
  				domStyle.set(query(".esriMapBookEditPage")[0], "display", "none");
  				array.forEach(mapBookContents, function (node) {
  					domClass.remove(node, "esriEditableModeContent");
  				});
  				domStyle.set(query('.esriEditPageBody')[0], "display", "none");
  				domStyle.set(query('.esriMapBookEditPage')[0], "height", "auto");
  				this._togglePageNavigation(true);
  			}
  			this._toggleDnd(this.isEditModeEnable);
  		},

  		_createMapBookEsriLogo: function () {
  			var logoContainer = query(".esriMapBookEsriLogo")[0];
  			if (logoContainer) {
  				domConstruct.create("img", { "src": "themes/images/esri-logo.png" }, logoContainer);
  			}
  		},

  		_deleteSeletedBook: function (bookTitle) {
  			var confirmMsg = dojoString.substitute(nls.confirmDeletingOfSelectedBook, { bookName: "'" + bookTitle + "'" })
  			var confirmDeleteBook = confirm(confirmMsg);
  			if (confirmDeleteBook) {
  				dojo.moduleData.splice(this.currentBookIndex, 1);
  				dojo.bookListData.Books.splice(this.currentBookIndex, 1);
  				delete this.mapBookDetails[this.selectedMapBook];
  				this._createMapBookList();
  			}
  			if (dojo.bookListData.Books.length == 0) {
  				domStyle.set(query('.esriDeleteBookIcon')[0], "display", "none");
  				domStyle.set(query('.esriDownloadIcon')[0], "display", "none");
  			}
  		},

  		_resizeMapBook: function () {
  			var marginleft, totalPages, pageWidth, pageHeight, bookPageHeight, listcontentPage, marginTop = 0;
  			totalPages = query('#mapBookPagesUList .esriMapBookPageListItem');
  			pageWidth = domStyle.get(query("#mapBookContentContainer")[0], "width");
  			bookPageHeight = pageHeight = dojo.window.getBox().h - (domStyle.get(dom.byId("mapBookHeaderContainer"), "height")) - 5;
  			domStyle.set(dom.byId("mapBookScrollContent"), "height", pageHeight + 'px');
  			if (this.isEditModeEnable) {
  				pageHeight -= 150;
  				bookPageHeight = pageHeight;
  				marginTop = 150;
  				domStyle.set(query(".esriEditPageBody")[0], "height", bookPageHeight - 5 + 'px');
  				this._setSliderWidth();
  				this._setSliderArrows();
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
  				if (this.currentIndex !== 0 && this.mapBookDetails[this.selectedMapBook][1] == "EmptyContent") {
  					marginleft = (this.currentIndex - 1) * Math.ceil(pageWidth);
  				} else {
  					marginleft = this.currentIndex * Math.ceil(pageWidth);
  				}
  				dom.byId("mapBookPagesUList").style.marginLeft = -marginleft + 'px';
  			}
  		},

  		_createContentListPanel: function () {
  			var divContentListPanel, divContentListHeader, divContentList;
  			divContentListPanel = domConstruct.create("div", { "class": "esriContentListPanelDiv esriArialFont", "id": "divContentListPanel" }, dom.byId("mapBookContentContainer"));
  			divContentListHeader = domConstruct.create("div", { "innerHTML": nls.tocContentsCaption, "class": "esriContentListHeaderDiv " }, dom.byId("divContentListPanel"));
  			divContentList = domConstruct.create("div", { "id": "divContentList" }, dom.byId("divContentListPanel"));
  		},

  		_displayBookContent: function (book) {
  			var listTOCContent, arrPages = [];
  			if (dom.byId("esriMapPages")) {
  				domConstruct.empty(dom.byId("esriMapPages"));
  			}
  			this.selectedMapBook = book.title;
  			this.DNDArray = [];
  			if (!this.mapBookDetails[this.selectedMapBook]) {
  				if (book.hasOwnProperty('CoverPage')) {
  					book.CoverPage.type = "CoverPage";
  					arrPages.push(book.CoverPage);
  				} else {
  					this.isEditModeEnable = true;
  					arrPages.push(this._createCoverPage());
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
  					dojo.bookListData.Books[this.currentBookIndex].BookPages = [];
  					dojo.moduleData[this.currentBookIndex].BookPages = [];
  				}
  				array.forEach(book.BookPages, function (currentPage) {
  					currentPage.type = "BookPages";
  					arrPages.push(currentPage);
  				});
  				this.mapBookDetails[this.selectedMapBook] = arrPages;
  			}
  			this._renderPages(this.mapBookDetails[this.selectedMapBook]);
  			this._renderTOCContent(dom.byId("divContentList"));
  		},

  		_createDnDModuleList: function () {
  			var _self = this, divDndModule, dndModuleContent, dndIocnDiv, divEditPageHeader, sampleArray;

  			divEditPageHeader = query('.esriEditPageHeader')[0];
  			this._destroyExistingNode(dom.byId("DNDContainer"), false);
  			if (divEditPageHeader) {
  				divDndModule = domConstruct.create("div", { "dndContType": "newDndModule", "id": "DNDContainer", "class": "esriDragAndDropPanel" }, divEditPageHeader);
  				dndModuleContent = new dndSource("DNDContainer", { creator: _self._createAvatar, accept: [] });
  				domConstruct.create("div", { "innerHTML": nls.dndModuleText, "class": "esriDragAndDropTitle" }, divDndModule);
  				dndIocnDiv = domConstruct.create("div", { "class": "esriDragAndDropIcon" }, null);
  				domConstruct.create("span", { "class": "esriDragAndDropWebmapIcon", "type": "webmap", "title": nls.webMapIconTitle }, dndIocnDiv);
  				domConstruct.create("span", { "class": "esriDragAndDropTextareaIcon", "type": "text", "title": nls.textAreaIconTitle }, dndIocnDiv);
  				domConstruct.create("span", { "class": "esriDragAndDropVideoIcon", "type": "video", "title": nls.videoIconTitle }, dndIocnDiv);
  				domConstruct.create("span", { "class": "esriDragAndDropHTMLIcon", "type": "HTML", "title": nls.freeFormIconTitle }, dndIocnDiv);
  				domConstruct.create("span", { "class": "esriDragAndDropFlickrIcon", "type": "flickr", "title": nls.flickrIconTitle }, dndIocnDiv);
  				domConstruct.create("span", { "class": "esriDragAndDropImageIcon", "type": "image", "title": nls.imageIconTitle }, dndIocnDiv);
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
  					var srcContType = domAttr.get(srcContainer.node, "dndContType");
  					if (srcContType == "newDndModule") {
  						_self._identifySeletedModule(targetContainer, nodes);
  					} else {
  						targetContainer.sync();
  						srcContainer.sync();
  						if (srcContType == "pageCarousal") {
  							setTimeout(function () {
  								_self._reArrangePageSequence(srcContainer, nodes, targetContainer);
  							}, 0);
  						} else {
  							setTimeout(function () {
  								_self._saveModuleSequence(srcContainer, targetContainer);
  							}, 0);
  						}
  					}
  				});
  			}
  		},

  		_reArrangePageSequence: function (srcContainer, nodes, targetContainer) {
  			var targetNodes, newIndex, currentPageIndex, bookData;

  			bookData = this._getConfigData(dojo.bookListData.Books[this.currentBookIndex]);
  			targetNodes = targetContainer.getAllNodes();

  			var nodeIndex = parseInt(domAttr.get(nodes[0], "index"));
  			for (var i = 0; i < targetNodes.length; i++) {
  				if (targetNodes[i].id == nodes[0].id) {
  					if (i == nodeIndex - 2) {
  						return;
  					} else {
  						currentPageIndex = i + 2;
  						this.currentIndex = nodeIndex;
  					}
  				}
  				domAttr.set(targetNodes[i], "index", i + 2);
  			}
  			this._reArrangePageList(currentPageIndex);
  			this._gotoPage(this.currentIndex);
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
  					firstChild = targetNodes[i].firstElementChild ? targetNodes[i].firstElementChild : targetNodes[i].firstChild;
  					if (firstChild) {
  						domClass.replace(firstChild, "esriLayoutDiv" + targetColIndex, "esriLayoutDiv" + srcColIndex);
  					}
  				} else {
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

  		_createNewPageLayout: function (addpageBtn) {
  			templateType = domAttr.get(addpageBtn, "isBookPageLayout");
  			if (query('.selectedTemplate')[0]) {
  				this._togglePageNavigation(true);
  				this._createNewPage(templateType);
  				this._createPageSlider();
  				this._setSliderWidth();
  				this._highlightSelectedPage();
  				this._setSliderArrows();
  			}
  		},

  		_createPageLayout: function (page, currentPageContainer) {
  			var _self = this, pageTitleHolder, columnWidth, newBookPage, pageContentContainer, parentContainer, pageContentHolder, mapBookPageContent, titleClass, pageLayoutClass, moduleIndex, arrContent = {};
  			var dndCont, pageTitleClass = "esriMapBookPageTitle esriMapBookColContent";
  			if (!this.isEditModeEnable) {
  				mapBookPageContent = this._getConfigData(dojo.moduleData[_self.currentBookIndex]);
  			} else {
  				newBookPage = {};
  				mapBookPageContent = lang.clone(dojo.appConfigData.ModuleDefaultsConfig);
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
  			} else {
  				pageTitleHolder = domConstruct.create("div", { "type": "text", "class": pageTitleClass }, currentPageContainer);
  				this._createTitleModule(mapBookPageContent.title, pageTitleHolder);
  			}
  			array.forEach(page.content, function (currentContent, columnIndex) {
  				columnWidth = page.columnWidth[columnIndex] + '%';
  				pageLayoutClass = _self._setColumnClass(page.columns, columnIndex);
  				parentContainer = domConstruct.create("div", { "columnIndex": columnIndex, "pageIndex": page.index, "class": "esriColumnLayout" }, currentPageContainer);
  				domStyle.set(parentContainer, "width", columnWidth);
  				dndCont = new dndSource(parentContainer, { accept: ["mapbookPageModule"] });
  				if (!_self.isEditModeEnable || (page.index == 0 && columnIndex == 0)) {
  					_self._disableDnd(dndCont);
  				} else {
  					newBookPage.content[columnIndex] = [];
  					_self._enableDnd(dndCont);
  				}
  				dndContentArray = [];
  				array.forEach(currentContent, function (currentModuleContent, contentIndex) {
  					if (currentModuleContent.length > 0) {
  						moduleIndex = contentIndex + '' + columnIndex + '' + page.index + '' + _self.currentBookIndex;
  						pageContentContainer = domConstruct.create("div", { "dndType": "mapbookPageModule" }, null);
  						pageContentHolder = domConstruct.create("div", { "class": pageLayoutClass }, pageContentContainer);
  						_self._setModuleIndex(pageContentHolder, moduleIndex, columnIndex, contentIndex);
  						pageModule = _self._createColumnContent(currentModuleContent, pageContentHolder, newBookPage, arrContent);
  						pageContentContainer.dndType = "mapbookPageModule";
  						dndContentArray.push(pageContentContainer);
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

  		_createColumnContent: function (currentModuleContent, pageContentHolder, newBookPage, arrContent) {
  			var mapBookPageContent, pageModule, moduleIndex;
  			mapBookPageContent = this._getConfigData(dojo.moduleData[this.currentBookIndex]);
  			moduleIndex = domAttr.get(pageContentHolder, "moduleIndex");
  			pageModule = domConstruct.create("div", { "class": "divPageModule" }, pageContentHolder);
  			domAttr.set(pageModule, "moduleIndex", moduleIndex);
  			if (currentModuleContent && currentModuleContent.length > 0) {
  				if (!this.isEditModeEnable) {
  					domAttr.set(pageContentHolder.parentElement, "moduleKey", currentModuleContent);
  					if (mapBookPageContent.hasOwnProperty(currentModuleContent)) {
  						pageContentModule = mapBookPageContent[currentModuleContent];
  						domAttr.set(pageContentHolder.parentElement, "type", pageContentModule.type);
  						domAttr.set(pageContentHolder, "type", pageContentModule.type);
  						this._renderModuleContent(pageContentModule.type, pageModule, pageContentModule);
  					}
  				} else {
  					this._renderNewPageModule(pageContentHolder.parentElement, newBookPage, currentModuleContent, arrContent);
  				}
  				return pageModule;
  			}
  		},

  		_showModuleSettingDialog: function (moduleType, isNewModule, moduleContainer, moduleKey) {
  			var label, dialogTitle, moduleInfo, moduleData, divModuleSetting, divTextEditor, inputContainer, _self = this, moduleAttr = {}, moduleInputs = [];

  			moduleInfo = lang.clone(dojo.appConfigData.ModuleDefaultsConfig);
  			moduleIconPath = dojo.appConfigData.DefaultModuleIcons[moduleType].URL;
  			dialogTitle = '<img class="esriSettingModuleIcon" src=' + moduleIconPath + '>' + dojoString.substitute(nls.settingDialogTitle, { modType: moduleType.charAt(0).toUpperCase() + moduleType.slice(1) });

  			if (!isNewModule) {
  				moduleData = this._getConfigData(dojo.moduleData[this.currentBookIndex]);
  				moduleAttr = moduleData[moduleKey];
  				if (!moduleAttr) {
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
  					if (key == "height" || key == "width") {
  						labelValue += ' (px)';
  					}
  					domAttr.set(label, "innerHTML", labelValue);
  					if (key == "text" && moduleKey !== "title") {
  						inputContainer = this._createTextEditor(moduleSettingContent, moduleAttr, key);
  					} else if (key == "HTML") {
  						inputContainer = this._createTextArea(moduleSettingContent, moduleAttr, key);
  					} else {
  						if (key == "webmap" || key == "id" || key == "URL" || key == "height") {
  							isValidationRequired = true;
  						} else {
  							isValidationRequired = false;
  						}
  						inputContainer = this._createTextBox(moduleSettingContent, moduleAttr, key, isValidationRequired);
  					}
  					moduleInputs.push(inputContainer);
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
  			var moduleKey, isNewModule;

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

  		_updateTOC: function () {
  			var oldTOC;
  			oldTOC = query('.esriMapBookColContent .esriTOCcontainer')[0];
  			if (oldTOC) {
  				this._renderTOCContent(oldTOC.parentElement);
  			}
  			this._renderTOCContent(dom.byId("divContentList"));
  		}

  	});
  });

