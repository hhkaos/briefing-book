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
], function (declare, lang, array, domConstruct, domAttr, domStyle, domClass, dom, on, touch, topic, query, dojoString, dndSource, esriRequest, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, nls, swipe, mapbookDijits, pageNavigation, moduleRenderer, pageRenderer) {
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
		postCreate: function () {
			var _self = this;

			dojo.subscribe("/dojo/resize/stop", function (resizerObj) {
				dojo.bookInfo[dojo.currentBookIndex].BookConfigData.UnSaveEditsExists = true;
				_self._setNewHeight(resizerObj);
			});
			topic.subscribe("createBookListHandler", function () {
				_self.isEditModeEnable = false;
				_self._createMapBookList();
			});
			topic.subscribe("saveBookHandler", function () {
				topic.publish("_saveBookHandler", dojo.currentBookIndex);
			});
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
				dojo.currentBookIndex = bookIndex;
				_self.isEditModeEnable = true;
				_self._displaySelectedBookContent(dojo.bookInfo[bookIndex]);
			});
			topic.subscribe("destroyWebmapHandler", function () {
				array.forEach(_self.webmapArray, function (webmap) {
					webmap.destroy();
				});
			});

			topic.subscribe("copySelectedBookHandler", function () {
				topic.publish("_copySelectedBookHandler", dojo.currentBookIndex);
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
			this.mapBookDetails = [];
			domConstruct.empty(dom.byId("mapBookContent"));
			array.forEach(dojo.bookInfo, function (currentBook, bookIndex) {
				if (count % 25 === 0) {
					container = domConstruct.create("div", { "class": "esriMapBookListContainer" }, dom.byId("mapBookContent"));
				}
				count++;
				mapBookContainer = domConstruct.create("div", { "class": "esriBookContainer" }, container);
				currentMapBook = domConstruct.create("div", { "class": "esriMapBookList", "index": bookIndex, "value": currentBook.BookConfigData.title }, mapBookContainer);
				mapBookdivClose = domConstruct.create("div", { "class": "esriBookclose" }, currentMapBook);
				mapBookdivContainer = domConstruct.create("div", { "class": "esriBookTitlediv" }, currentMapBook);
				mapBookdivContainerInner = domConstruct.create("div", { "class": "esriBookTitledivInner" }, mapBookdivContainer);
				mapBookname = domConstruct.create("div", { "class": "esriBookTitle", "title": currentBook.BookConfigData.title, "innerHTML": currentBook.BookConfigData.title }, mapBookdivContainerInner);
				mapBookAuthor = domConstruct.create("div", { "class": "esriBookAuthor", "innerHTML": currentBook.BookConfigData.author }, currentMapBook);
				_self.webmapArray = [];
				if (currentBook.BookConfigData.title.length > 20) {
					domAttr.set(mapBookname, "title", currentBook.BookConfigData.title);
				}
				_self.own(on(currentMapBook, "click", function (evt) {
					if (domClass.contains(evt.target, "esriBookclose") && dojo.appConfigData.AuthoringMode) {
						dojo.currentBookIndex = parseInt(domAttr.get(evt.target.parentElement, "index"));
						_self._deleteSeletedBook(domAttr.get(evt.target.parentElement, "value"));
					} else {
						if (dojo.appConfigData.AuthoringMode) {
							if (domClass.contains(query('.esriDeleteBookIcon')[0], "esriHeaderIconSelected")) {
								return 0;
							}
						}
						dojo.currentBookIndex = parseInt(domAttr.get(this, "index"));
						mapbookTitle = domAttr.get(this, "value");
						array.some(dojo.bookInfo, function (book, index) {
							if (book.BookConfigData.title == mapbookTitle && dojo.currentBookIndex == index) {
								_self._displaySelectedBookContent(book.BookConfigData);
							}
						});
					}
				}));
			});
			if (query('.esriDeleteBookIcon')[0]) {
				this._removeClass(query('.esriDeleteBookIcon')[0], "esriHeaderIconSelected");
			}
			if (query('.esriEditIcon')[0]) {
				this._removeClass(query('.esriEditIcon')[0], "esriHeaderIconSelected");
			}
			domStyle.set(dom.byId("outerLoadingIndcator"), "display", "none");
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
				domStyle.set(query(".esriNewBookIcon")[0], "display", "none");
				domStyle.set(query(".esriRefreshIcon")[0], "display", "none");
				domStyle.set(query(".esriEditIcon")[0], "display", "block");
				domStyle.set(query(".esriDeleteIcon")[0], "display", "none");
				if (dojo.bookInfo[dojo.currentBookIndex].BookConfigData.owner == dojo.currentUser) {
					domStyle.set(query(".esriSaveIcon")[0], "display", "block");
				}
				domStyle.set(query(".esriCopyBookIcon")[0], "display", "block");
			}
			array.forEach(this.webmapArray, function (webmap) {
				webmap.destroy();
			});
			this.webmapArray = [];
			this._displayBookContent(book);
			this.currentIndex = 0;

			if (this.mapBookDetails[dojo.currentBookIndex].length == 1) {
				domClass.add(this.mapBookNextPage, "esriNextDisabled");
			} else {
				if (this.mapBookDetails[dojo.currentBookIndex].length == 2 && this.mapBookDetails[dojo.currentBookIndex][1] == "EmptyContent") {
					domClass.add(this.mapBookNextPage, "esriNextDisabled");
				} else {
					this._removeClass(this.mapBookNextPage, "esriNextDisabled");
				}
				domClass.add(this.mapBookPreviousPage, "esriPrevDisabled");
			}
		},

		_enableMapBookEditing: function () {
			var divTitle, mapBookContents;
			if (this.isEditModeEnable && dojo.bookInfo[dojo.currentBookIndex].BookConfigData.owner !== dojo.currentUser) {
				this.isEditModeEnable = false;
				domClass.remove(query('.esriEditIcon')[0], "esriHeaderIconSelected");
				alert(nls.validateBookOwner);
			}
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
				if (query(".esriMapBookEditPage")[0]) {
					domStyle.set(query(".esriMapBookEditPage")[0], "display", "none");
					domStyle.set(query('.esriEditPageBody')[0], "display", "none");
					domStyle.set(query('.esriMapBookEditPage')[0], "height", "auto");
				}
				array.forEach(mapBookContents, function (node) {
					domClass.remove(node, "esriEditableModeContent");
				});

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
			var confirmMsg, confirmDeleteBook;
			confirmMsg = dojoString.substitute(nls.confirmDeletingOfSelectedBook, { bookName: "'" + bookTitle + "'" })
			confirmDeleteBook = confirm(confirmMsg);

			if (confirmDeleteBook) {
				topic.publish("deleteItemHandler", dojo.currentBookIndex);
			}
			if (dojo.bookInfo.length == 0) {
				domStyle.set(query('.esriDeleteBookIcon')[0], "display", "none");
			}
		},

		_resizeMapBook: function () {
			var marginleft, totalPages, pageWidth, editHeaderHeight, pageHeight, bookPageHeight, listcontentPage, marginTop = 0;
			totalPages = query('#mapBookPagesUList .esriMapBookPageListItem');
			pageWidth = domStyle.get(query("#mapBookContentContainer")[0], "width");
			bookPageHeight = pageHeight = dojo.window.getBox().h - (domStyle.get(dom.byId("mapBookHeaderContainer"), "height")) - 5;
			domStyle.set(dom.byId("mapBookScrollContent"), "height", pageHeight + 'px');
			if (dom.byId('divContentList')) {
				domStyle.set(dom.byId('divContentList'), "height", pageHeight - domStyle.get(query('.esriContentListHeaderDiv ')[0], "height") - 10 + 'px');
			}
			if (dijit.byId("settingDialog")) {
				dijit.byId("settingDialog").resize();
			}
			if (this.isEditModeEnable) {
				editHeaderHeight = domStyle.get(query(".esriEditPageHeader")[0], "height") + 10;
				pageHeight -= editHeaderHeight;
				bookPageHeight = pageHeight;
				marginTop = editHeaderHeight;
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
						listcontentPage.style.width = pageWidth + 'px';
						listcontentPage.style.height = bookPageHeight + 'px';
						listcontentPage.style.marginTop = marginTop + 'px';
					}
				});
				if (this.currentIndex !== 0 && this.mapBookDetails[dojo.currentBookIndex][1] == "EmptyContent") {
					marginleft = (this.currentIndex - 1) * Math.ceil(pageWidth);
				} else {
					marginleft = this.currentIndex * Math.ceil(pageWidth);
				}
				dom.byId("mapBookPagesUList").style.marginLeft = -marginleft + 'px';
			}
		},

		_createContentListPanel: function () {
			domConstruct.create("div", { "class": "esriContentListPanelDiv esriArialFont", "id": "divContentListPanel" }, dom.byId("mapBookContentContainer"));
			domConstruct.create("div", { "innerHTML": nls.tocContentsCaption, "class": "esriContentListHeaderDiv " }, dom.byId("divContentListPanel"));
			domConstruct.create("div", { "id": "divContentList" }, dom.byId("divContentListPanel"));
		},

		_displayBookContent: function (book) {
			var listTOCContent, arrPages = [];
			if (dom.byId("esriMapPages")) {
				domConstruct.empty(dom.byId("esriMapPages"));
			}
			this.DNDArray = [];
			if (!this.mapBookDetails[dojo.currentBookIndex]) {
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
				} else {
					arrPages.push("EmptyContent");
				}
				if (!book.hasOwnProperty('BookPages')) {
					dojo.bookInfo[dojo.currentBookIndex].BookConfigData.BookPages = [];
					dojo.bookInfo[dojo.currentBookIndex].ModuleConfigData.BookPages = [];
				}
				array.forEach(book.BookPages, function (currentPage) {
					currentPage.type = "BookPages";
					arrPages.push(currentPage);
				});
				this.mapBookDetails[dojo.currentBookIndex] = arrPages;
			}
			this._renderPages(this.mapBookDetails[dojo.currentBookIndex]);
			this._renderTOCContent(dom.byId("divContentList"));
			domStyle.set(dom.byId("outerLoadingIndcator"), "display", "none");

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
					dojo.bookInfo[dojo.currentBookIndex].BookConfigData.UnSaveEditsExists = true;
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

			bookData = this._getConfigData(dojo.bookInfo[dojo.currentBookIndex].BookConfigData);
			targetNodes = targetContainer.getAllNodes();

			var nodeIndex = parseInt(domAttr.get(nodes[0], "index"));
			for (var i = 0; i < targetNodes.length; i++) {
				if (targetNodes[i].id == nodes[0].id) {
					if (i == nodeIndex - 2) {
						return;
					} else {
						this.currentIndex = nodeIndex;
						if (i == targetNodes.length - 1) {
							currentPageIndex = parseInt(domAttr.get(targetNodes[i - 1], "index"));
							this._appendPageAtLast(currentPageIndex + 1);
						} else {
							currentPageIndex = parseInt(domAttr.get(targetNodes[i + 1], "index"));
							this._changePageSequence(currentPageIndex);
							if (currentPageIndex == 2) {
								currentPageIndex++;
							}
						}
					}
				}
				domAttr.set(targetNodes[i], "index", i + 2);
			}
			this._createPageSlider();
			this._updateTOC();
			this._gotoPage(this.currentIndex);
		},

		_changePageSequence: function (currentPageIndex) {
			var selectedPage, bookPages, mapBookDetails, bookListdata;
			var currentListItemIndex = this.currentIndex, refListItemIndex = currentPageIndex;
			if (this.mapBookDetails[dojo.currentBookIndex][1] == "EmptyContent") {
				currentListItemIndex--;
				refListItemIndex--;
			}
			selectedPage = dom.byId('mapBookPagesUList').children[currentListItemIndex];
			dom.byId('mapBookPagesUList').insertBefore(selectedPage, dom.byId('mapBookPagesUList').children[refListItemIndex]);

			bookPages = dojo.bookInfo[dojo.currentBookIndex].ModuleConfigData.BookPages;
			bookListdata = dojo.bookInfo[dojo.currentBookIndex].BookConfigData.BookPages;
			mapBookDetails = this.mapBookDetails[dojo.currentBookIndex];
			mapbookdata = this.mapBookDetails[dojo.currentBookIndex][this.currentIndex];
			bookdata = dojo.bookInfo[dojo.currentBookIndex].BookConfigData.BookPages[this.currentIndex - 2];
			moduleData = bookPages[this.currentIndex - 2];
			mapBookDetails.splice(currentPageIndex, 0, mapbookdata);
			bookPages.splice(currentPageIndex - 2, 0, moduleData);
			bookListdata.splice(currentPageIndex - 2, 0, bookdata);
			var arrIndex = this.currentIndex;
			if (currentPageIndex > this.currentIndex) {
				mapBookDetails.splice(this.currentIndex, 1);
				bookPages.splice(this.currentIndex - 2, 1);
				bookListdata.splice(this.currentIndex - 2, 1);
				currentPageIndex--;
			} else {
				mapBookDetails.splice(this.currentIndex + 1, 1);
				bookPages.splice(this.currentIndex - 1, 1);
				bookListdata.splice(this.currentIndex - 1, 1);
			}
			this._setBookPageIndex(bookListdata);
			this.currentIndex = currentPageIndex;
		},

		_appendPageAtLast: function (currentPageIndex) {
			var currentListItemIndex = this.currentIndex, refListItemIndex, selectedPage, bookPages, mapBookDetails, bookListdata;
			refListItemIndex = currentPageIndex;
			if (this.mapBookDetails[dojo.currentBookIndex][1] == "EmptyContent") {
				currentListItemIndex--;
				refListItemIndex--;
			}
			selectedPage = dom.byId('mapBookPagesUList').children[currentListItemIndex];
			dom.byId('mapBookPagesUList').appendChild(selectedPage);

			bookPages = dojo.bookInfo[dojo.currentBookIndex].ModuleConfigData.BookPages;
			bookListdata = dojo.bookInfo[dojo.currentBookIndex].BookConfigData.BookPages;
			mapBookDetails = this.mapBookDetails[dojo.currentBookIndex];

			mapBookDetails.splice(currentPageIndex + 1, 0, mapBookDetails[this.currentIndex]);
			bookPages.splice(currentPageIndex - 1, 0, bookPages[this.currentIndex - 2]);
			bookListdata.splice(currentPageIndex - 1, 0, bookListdata[this.currentIndex - 2]);

			mapBookDetails.splice(this.currentIndex, 1);
			bookPages.splice(this.currentIndex - 2, 1);
			bookListdata.splice(this.currentIndex - 2, 1);
			this._setBookPageIndex(bookListdata);
			this.currentIndex = currentPageIndex;
		},

		_saveModuleSequence: function (srcContainer, targetContainer) {
			var moduleKey, bookData, targetColIndex, srcColIndex, targetNodes, sourceNodes;
			targetColIndex = parseInt(domAttr.get(targetContainer.node, "columnIndex"));
			targetNodes = targetContainer.getAllNodes();
			bookData = this._getConfigData(dojo.bookInfo[dojo.currentBookIndex].BookConfigData);
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
			this.mapBookDetails[dojo.currentBookIndex][this.currentIndex].content = bookData.content;
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
			var _self = this, pageTitleHolder, columnWidth, newBookPage, pageContentContainer, parentContainer, pageContentHolder, mapBookPageContent, pageLayoutClass, moduleIndex, arrContent = {};
			var dndCont, pageTitleClass = "esriMapBookPageTitle esriMapBookColContent";
			if (!this.isEditModeEnable) {
				mapBookPageContent = this._getConfigData(dojo.bookInfo[dojo.currentBookIndex].ModuleConfigData);
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
			if (page.type !== "CoverPage") {
				pageTitleHolder = domConstruct.create("div", { "moduleIndex": "pageTitle" + this.currentIndex, "type": "text", "class": pageTitleClass }, currentPageContainer);
				this._createTitleModule(mapBookPageContent.title, pageTitleHolder);
			}
			array.forEach(page.content, function (currentContent, columnIndex) {
				columnWidth = page.columnWidth[columnIndex] + '%';
				pageLayoutClass = _self._setColumnClass(page.columns, columnIndex);
				parentContainer = domConstruct.create("div", { "columnIndex": columnIndex, "pageIndex": page.index, "class": "esriColumnLayout" }, currentPageContainer);
				domStyle.set(parentContainer, "width", columnWidth);
				dndCont = new dndSource(parentContainer, { accept: ["mapbookPageModule"], withHandles: true });
				if (!_self.isEditModeEnable || (page.index == 0 && columnIndex == 0)) {
					_self._disableDnd(dndCont);
				} else {
					newBookPage.content[columnIndex] = [];
					_self._enableDnd(dndCont);
				}
				dndContentArray = [];
				array.forEach(currentContent, function (currentModuleContent, contentIndex) {
					if (currentModuleContent && currentModuleContent.length > 0) {
						moduleIndex = contentIndex + '' + columnIndex + '' + page.index + '' + dojo.currentBookIndex;
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
					dojo.bookInfo[dojo.currentBookIndex].BookConfigData[page.type].push(newBookPage);
					dojo.bookInfo[dojo.currentBookIndex].ModuleConfigData.BookPages.push(arrContent);
					_self.mapBookDetails[dojo.currentBookIndex].push(newBookPage);
				} else {
					dojo.bookInfo[dojo.currentBookIndex].BookConfigData[page.type] = newBookPage;
					dojo.bookInfo[dojo.currentBookIndex].ModuleConfigData[page.type] = arrContent;
					_self.mapBookDetails[dojo.currentBookIndex][_self.currentIndex] = newBookPage;
				}
			}
		},

		_createColumnContent: function (currentModuleContent, pageContentHolder, newBookPage, arrContent) {
			var mapBookPageContent, pageModule, moduleIndex;
			mapBookPageContent = this._getConfigData(dojo.bookInfo[dojo.currentBookIndex].ModuleConfigData);
			moduleIndex = domAttr.get(pageContentHolder, "moduleIndex");
			pageModule = domConstruct.create("div", { "class": "divPageModule dojoDndHandle" }, pageContentHolder);
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
				moduleData = this._getConfigData(dojo.bookInfo[dojo.currentBookIndex].ModuleConfigData);
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
						labelValue += nls.unitInPixel;
					}
					domAttr.set(label, "innerHTML", labelValue);
					if (key == "text") {
						inputContainer = this._createTextEditor(moduleSettingContent, moduleAttr, key);
						domStyle.set(label, "display", "none");
					} else if (key == "HTML") {
						inputContainer = this._createTextArea(moduleSettingContent, moduleAttr, key);
					} else if (key == "provider") {
						inputContainer = this._createComboBox(moduleSettingContent, moduleAttr, key);
					} else {
						if (key == "URL" || key == "apiKey" || key == "username") {
							isValidationRequired = true;
						} else {
							isValidationRequired = false;
						}
						inputContainer = this._createTextBox(moduleSettingContent, moduleAttr, key, isValidationRequired);
					}
					moduleInputs.push(inputContainer);
					if (key == "type" || key == "height" || key == "width") {
						domStyle.set(moduleSettingContent, "display", "none");
					}
				}

				dijit.byId("settingDialog").titleNode.innerHTML = dialogTitle;
				dijit.byId("settingDialog").setContent(divModuleSetting);
				btns = domConstruct.create("div", { "class": "esriButtonContainer" }, divModuleSetting);
				btnSave = domConstruct.create("div", { "moduleKey": moduleKey, "class": "esriSettingSave", "type": isNewModule, "innerHTML": "Save" }, btns);
				on(btnSave, "click", function () {
					dojo.bookInfo[dojo.currentBookIndex].BookConfigData.UnSaveEditsExists = true;
					_self._validateInputFields(this, moduleContainer, moduleType, moduleInputs);
				});
			}
			dijit.byId("settingDialog").show();
			dijit.byId("settingDialog").resize();
		},

		_validateInputFields: function (btnNode, moduleContainer, moduleType, moduleInputs) {
			var moduleKey, isNewModule, inputData;

			for (var i = 0; i < moduleInputs.length; i++) {
				if (moduleInputs[i].state == "Error") {
					alert(nls.errorMessages.fieldInputIsNotValid);
					return;
				} else if (moduleInputs[i].required) {
					inputData = moduleInputs[i].value;
					inputData = dojo.isString(inputData) ? inputData.trim() : inputData;
					if (inputData == "") {
						alert(nls.fieldIsEmpty);
						return;
					}
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
		}

	});
});
