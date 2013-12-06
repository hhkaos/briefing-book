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
    "dojo/query",
    "esri/arcgis/utils",
    "dojo/text!./templates/mapBookCollectionTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!nls/localizedStrings",
     "dojox/gesture/swipe"
    ],
     function (declare, domConstruct, lang, array, domAttr, domStyle, domClass, dom, on, touch, query, arcgisUtils, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, nls, swipe) {
         return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
             templateString: template,
             nls: nls,
             mapBookDetails: {},
             currentIndex: null,
             pages: [],
             slidingPages: [],

             postCreate: function () {
                 var _self = this;
                 this._createMapBookList();
                 this._createContentListPanel();
                 domStyle.set(dom.byId("esriMapBookScrollContent"), "height", (window.innerHeight - domStyle.get(dom.byId("mapBookContainer"), "height") - 5) + 'px');

                 on(window, "resize", lang.hitch(this, function () {
                     _self._resizeMapBook();
                 }));

                 on(window, "orientationchange", lang.hitch(this, function () {
                     _self._resizeMapBook();
                 }));

                 if ("ontouchstart" in window) {
                     on(dojo.byId("esriMapPages"), swipe.end, function (e) {
                         if (e.dx > 0) {
                             _self._previousPage();
                         }
                         else if (e.dx <= 0) {
                             _self._nextPage();
                         }
                         _self._setPageNavigation();
                         e.cancelBubble = false;
                         e.cancelable = false;
                     });
                 }

                 this.own(on(dom.byId("mapBookPreviousPage"), "click", lang.hitch(this, function () {
                     this._previousPage();
                     this._setPageNavigation();
                 })));

                 this.own(on(dom.byId("mapBookNextPage"), "click", lang.hitch(this, function () {
                     this._nextPage();
                     this._setPageNavigation();
                 })));
             },

             _slideBookPage: function () {
                 var _self = this, pageWidth, left;
                 dom.byId("esriMapBookScrollContent").scrollTop = 0;
                 pageWidth = domStyle.get(query(".esriMapBookPage")[0], "width");
                 left = (_self.currentIndex) * Math.ceil(pageWidth);
                 dom.byId("ulist").style.marginLeft = -left + 'px';
             },

             _setPageNavigation: function () {
                 var _self = this, StringTitle;
                 if (_self.currentIndex >= 2) {
                     domStyle.set(query(".esriPaginationDiv")[0], "display", "block");
                     StringTitle = dojo.string.substitute("Page ${pageIndex} of ${totalPages}", { pageIndex: _self.currentIndex - 1, totalPages: (_self.mapBookDetails[_self.selectedMapBook].length - 2) });
                     dom.byId("esriPaginationSpan").innerHTML = StringTitle;
                 } else {
                     domStyle.set(query(".esriPaginationDiv")[0], "display", "none");
                 }
             },

             _setPreviousPageState: function (currentClass, newClass) {
                 if (domClass.contains(dom.byId("mapBookPreviousPage"), currentClass)) {
                     domClass.replace(dom.byId("mapBookPreviousPage"), newClass, currentClass);
                 }
             },

             _setNextPageState: function (currentClass, newClass) {
                 if (domClass.contains(dom.byId("mapBookNextPage"), currentClass)) {
                     domClass.replace(dom.byId("mapBookNextPage"), newClass, currentClass);
                 }
             },

             _previousPage: function () {
                 var _self = this;
                 if (!_self.currentIndex == 0) {
                     _self.currentIndex--;
                     _self._slideBookPage();
                 }
                 if (_self.currentIndex === 0) {
                     _self._setPreviousPageState("prev", "prevDisabled");
                     _self._setNextPageState("nextDisabled", "next");
                 }
                 else {
                     _self._setPreviousPageState("prevDisabled", "prev");
                     _self._setNextPageState("nextDisabled", "next");
                 }
                 if (domClass.contains(dom.byId("divContentListPanel"), "esriContentPanelOpened")) {
                     domClass.remove(dom.byId("divContentListPanel"), "esriContentPanelOpened");
                 }
             },

             _nextPage: function () {
                 var _self = this;
                 if (!(_self.currentIndex === _self.mapBookDetails[_self.selectedMapBook].length - 1)) {
                     _self.currentIndex++;
                     _self._slideBookPage();
                 }
                 if (_self.currentIndex === _self.mapBookDetails[_self.selectedMapBook].length - 1) {
                     _self._setPreviousPageState("prevDisabled", "prev");
                     _self._setNextPageState("next", "nextDisabled");
                 }
                 else {
                     _self._setPreviousPageState("prevDisabled", "prev");
                     _self._setNextPageState("nextDisabled", "next");
                 }
                 if (domClass.contains(dom.byId("divContentListPanel"), "esriContentPanelOpened")) {
                     domClass.remove(dom.byId("divContentListPanel"), "esriContentPanelOpened");
                 }
             },

             _createMapBookList: function () {
                 var count = 0, container, _self = this, currentMapBook;
                 array.forEach(dojo.bookListData.Books, function (currentBook) {
                     if (count % 4 === 0) {
                         container = domConstruct.create("div", { class: "esriMapBookListContainer" }, dom.byId("mapBookContent"));
                     }
                     count++;
                     currentMapBook = domConstruct.create("div", { class: "esriMapBookList", value: currentBook.title }, container);
                     mapBookname = domConstruct.create("div", { "class": "esriBookTitle", innerHTML: currentBook.title }, currentMapBook);
                     mapBookAuthor = domConstruct.create("div", { "class": "esriBookAuthor", innerHTML: currentBook.authorName }, currentMapBook);

                     _self.own(on(currentMapBook, "click", function (evt) {
                         dojo.byId("esriMapPages").style.display = "block";
                         query(".esriMapBookContent")[0].style.display = "none";
                         array.some(dojo.bookListData.Books, function (book) {
                             if (book.title == evt.currentTarget.value) {
                                 if (dom.byId("divContentList")) {
                                     domConstruct.empty(dom.byId("divContentList"));
                                 }
                                 query("#mapBookTitle")[0].innerHTML = book.title;
                                 if (dojo.appConfigData.AuthoringMode) {
                                     domStyle.set(query(".esrihomeButtonIcon")[0], "display", "block");
                                     domStyle.set(query(".esriTocIcon")[0], "display", "block");

                                 }
                                 _self._displayBookContent(book);
                                 _self.currentIndex = 0;
                                 if (_self.mapBookDetails[_self.selectedMapBook].length > 1) {
                                     _self._setPreviousPageState("prev", "prevDisabled");
                                     _self._setNextPageState("nextDisabled", "next");

                                 }
                                 return true;
                             }
                         });
                     }));
                 });
             },

             _resizeMapBook: function () {
                 var _self = this, left, totalPages, pageWidth;
                 totalPages = query('#ulist .esriMapBookPage');
                 pageWidth = domStyle.get(query("#mapBookContentContainer")[0], "width");
                 if (totalPages && dom.byId("ulist")) {
                     array.forEach(totalPages, function (page) {
                         domStyle.set(page, "width", pageWidth + 'px');
                     });
                     left = (_self.currentIndex) * Math.ceil(pageWidth);
                     dom.byId("ulist").style.marginLeft = -left + 'px';
                 }
                 domStyle.set(dom.byId("esriMapBookScrollContent"), "height", (window.innerHeight - domStyle.get(dom.byId("mapBookContainer"), "height") - 5) + 'px');
             },

             _createContentListPanel: function () {
                 var _self = this, divContentListPanel, divContentListHeader, divContentList;
                 divContentListPanel = domConstruct.create("div", { "class": "esriContentListPanelDiv ", "id": "divContentListPanel" }, dom.byId("mapBookContentContainer"));
                 divContentListHeader = domConstruct.create("div", { innerHTML: "Contents", "class": "esriContentListHeaderDiv " }, dom.byId("divContentListPanel"));
                 divContentList = domConstruct.create("div", { "id": "divContentList" }, dom.byId("divContentListPanel"));
             },

             _displayBookContent: function (book) {
                 var _self = this, contentPages, totalPages, listTOCContent;
                 domConstruct.empty(dom.byId("esriMapPages"));
                 _self.selectedMapBook = book.title;
                 _self.pages = [];
                 if (!_self.mapBookDetails[_self.selectedMapBook]) {
                     if (book.CoverPage) {
                         _self.pages.push(book.CoverPage);
                     }
                     if (book.ContentPage) {
                         _self.pages.push(book.ContentPage);
                     }
                     if (book.BookPages) {
                         if (book.BookPages.length == 0) {
                             dom.byId("divContentList").innerHTML = "No Pages Found";
                         }
                     }
                     array.forEach(book.BookPages, function (currentPage) {
                         _self.pages.push(currentPage);
                     });
                     _self.mapBookDetails[_self.selectedMapBook] = _self.pages;

                 }
                 listTOCContent = _self._renderTOCContent();
                 dom.byId("divContentList").appendChild(listTOCContent);
                 _self._renderPages(_self.mapBookDetails[_self.selectedMapBook]);
             },

             _renderPages: function (pages) {
                 var _self = this, page, mapBookUList;
                 mapBookUList = domConstruct.create("ul", { "id": "ulist", "class": "esriMapBookUList" }, dom.byId("esriMapPages"));
                 if (pages.length >= 1) {
                     domStyle.set(query(".esriPrevious")[0], "visibility", "visible");
                     domStyle.set(query(".esriNext")[0], "visibility", "visible");
                     if (pages.length == 1) {
                         domClass.replace(dom.byId("mapBookNextPage"), "esriNextDisabled", "esriNext");
                     }
                     for (var i = 0; i < pages.length; i++) {
                         page = pages[i];
                         page.index = i;
                         _self._renderPage(pages[i]);
                     }
                     domStyle.set(dom.byId("ulist"), "height", (domStyle.get(query('.esriMapBookPage')[0], "height") - 10) + 'px');
                 }
             },

             _renderPage: function (page) {
                 var _self = this, listItem;
                 listItem = domConstruct.create("li", { "class": "esriMapBookPageListItem" }, null);
                 dom.byId("ulist").appendChild(listItem);
                 _self.currentPage = domConstruct.create("div", { "class": "esriMapBookPage" }, listItem);
                 _self.slidingPages.push(_self.currentPage);
                 domStyle.set(_self.currentPage, "width", Math.ceil(dom.byId("mapBookContentContainer").offsetWidth) + 'px');
                 switch (page.content.length) {
                     case 1:
                         _self._createTwoColumnLayout(page);
                         break;
                     case 2:
                         _self._createTwoColumnLayout(page);
                         break;
                     case 3:
                         _self._createTwoColumnLayout(page);
                         break;
                 }
             },

             _createOneColumnLayout: function () {

             },

             _createTwoColumnLayout: function (page) {
                 var _self = this, html, content, pageLayout;

                 array.forEach(page.content, function (currentContent) {
                     if (page.columns === 1) {
                         pageLayout = "esriOneColumnLayout";
                     }
                     else if (page.columns === 2) {
                         pageLayout = "esriTwoColumnLayout";
                     }
                     else if (page.columns === 3) {
                         pageLayout = "esriThreeColumnLayout";
                     }
                     html = domConstruct.create("div", { "class": pageLayout }, _self.currentPage);
                     array.forEach(currentContent, function (currentModuleContent) {
                         if (dojo.moduleData.hasOwnProperty(currentModuleContent)) {
                             if (dojo.moduleData[currentModuleContent].type == "webmap") {
                                 var mapContainer, mapContent, mapTitle, mapContentBtns, mapContentImgs, imgViewFullMap, imgLegend, mapCaption;
                                 mapContainer = domConstruct.create("div", { "class": "esriLayoutDiv", "style": dojo.moduleData[currentModuleContent].height && "height:" + parseInt(dojo.moduleData[currentModuleContent].height) + "px" }, html);
                                 mapContent = domConstruct.create("div", { style: " height:100%" }, null);
                                 domAttr.set(mapContent, "id", "map" + page.index);
                                 if (dojo.moduleData[currentModuleContent].caption) {
                                     mapTitle = domConstruct.create("div", { "class": "esriModuleTitle" }, null);
                                     mapTitle.innerHTML = dojo.moduleData[currentModuleContent].title;
                                     mapContainer.appendChild(mapTitle);
                                 }
                                 mapContentBtns = domConstruct.create("div", { "class": "mapBtns" }, null);
                                 mapContentImgs = domConstruct.create("div", { "class": "mapContentImgs" }, null);
                                 imgViewFullMap = domConstruct.create("span", { "class": "imgfullMapView" }, mapContentImgs);
                                 imgLegend = domConstruct.create("span", { "class": "imgLegend" }, mapContentImgs);
                                 mapContainer.appendChild(mapContentBtns);
                                 mapContentBtns.appendChild(mapContent);
                                 if ("ontouchstart" in window) {
                                     on(mapContent, swipe.end, function (e) {
                                         e.stopPropagation();
                                     });
                                 }
                                 if (dojo.moduleData[currentModuleContent].caption) {
                                     mapCaption = domConstruct.create("div", { "class": "esriModuleCaption" }, null);
                                     mapCaption.innerHTML = dojo.moduleData[currentModuleContent].caption;
                                     mapContainer.appendChild(mapCaption);
                                 }
                                 content = _self._renderContentModule(dojo.moduleData[currentModuleContent], mapContent.id, mapContentImgs);

                             }
                             else if (dojo.moduleData[currentModuleContent].type == "TOC") {
                                 content = _self._renderContentModule(dojo.moduleData[currentModuleContent]);
                                 var tocContainer = domConstruct.create("div", { "class": "esriLayoutDiv esriArialFont", "style": dojo.moduleData[currentModuleContent].height && "height:" + parseInt(dojo.moduleData[currentModuleContent].height) + "px" }, html);
                                 tocContainer.appendChild(content);
                             }
                             else {
                                 content = _self._renderContentModule(dojo.moduleData[currentModuleContent]);
                                 dojo.moduleData[currentModuleContent].type == "title" ? className = "esriLayoutDiv esriGeorgiaFont" : className = "esriLayoutDiv esriArialFont";
                                 domConstruct.create("div", { "class": className, "innerHTML": content, "style": dojo.moduleData[currentModuleContent].height && "height:" + parseInt(dojo.moduleData[currentModuleContent].height) + "px" }, html);
                             }
                         }
                     });
                 });
             },

             _createThreeColumnLayout: function () {

             },

             _renderContentModule: function (currentModuleContent, mapId, mapContentImgs) {
                 var _self = this;
                 switch (currentModuleContent.type) {
                     case "html":
                         return currentModuleContent.html
                         break;
                     case "text":
                         return currentModuleContent.text
                         break;
                     case "image":
                         return "<img src=" + currentModuleContent.path + " " + "height =" + (currentModuleContent.height - 5) + ">"
                         break;
                     case "video":
                         _self._renderVideoContent(currentModuleContent);
                         break;
                     case "webmap":
                         return _self._renderWebMapContent(currentModuleContent, mapId, mapContentImgs);
                         break;
                     case "TOC":
                         return _self._renderTOCContent();
                         break;
                     case "flickr":
                         _self._renderPhotoSetContent(currentModuleContent);
                         break;
                     case "title":
                         return currentModuleContent.text
                 }
             },

             _renderVideoContent: function (video) {

             },

             _renderWebMapContent: function (currentModuleContent, mapId, mapContentImgs) {
                 arcgisUtils.createMap(currentModuleContent.webmap_id, mapId, {
                     mapOptions: {
                         slider: false
                     },
                     ignorePopups: true
                 }).then(lang.hitch(this, function (response) {
                     response.map.root.appendChild(mapContentImgs);
                 }), lang.hitch(this, function (error) {
                 }));
             },

             _renderTOCContent: function () {
                 var _self = this, tocContent, anchorTag, divPageNo, divPageTitle;
                 tocContent = domConstruct.create("div", { "class": "esriTOCcontainer" }, null);
                 for (var pageIndex = 0; pageIndex < _self.mapBookDetails[_self.selectedMapBook].length; pageIndex++) {
                     if (pageIndex > 1) {
                         anchorTag = domConstruct.create("div", { "class": "esriContentListDiv" }, null);
                         divPageNo = domConstruct.create("div", { "class": "esriTitleIndexDiv" }, anchorTag);
                         divPageNo.innerHTML = (pageIndex - 1);
                         divPageTitle = domConstruct.create("div", { "value": pageIndex, "class": "esriTitleListDiv" }, anchorTag);
                         divPageTitle.innerHTML = _self.mapBookDetails[_self.selectedMapBook][pageIndex].title;
                         tocContent.appendChild(anchorTag);
                         touch.press(anchorTag, function (evt) {
                             _self._gotoPage(evt.target.value);
                         });
                     }
                 }
                 return tocContent;
             },

             _renderPhotoSetContent: function () {

             },

             _gotoPage: function (pageIndex) {
                 var _self = this;
                 _self.currentIndex = pageIndex;
                 _self._slideBookPage();
                 _self._setPageNavigation();

                 if (domClass.contains(dom.byId("divContentListPanel"), "esriContentPanelOpened")) {
                     domClass.remove(dom.byId("divContentListPanel"), "esriContentPanelOpened");
                 }
                 if (_self.currentIndex === _self.mapBookDetails[_self.selectedMapBook].length - 1) {
                     _self._setPreviousPageState("prevDisabled", "prev");
                     _self._setNextPageState("next", "nextDisabled");
                 }
                 else {
                     _self._setPreviousPageState("prevDisabled", "prev");
                     _self._setNextPageState("nextDisabled", "next");
                 }
             }
         });
     });