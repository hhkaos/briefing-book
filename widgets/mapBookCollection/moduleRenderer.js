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
    "dojox/image/FlickrBadge",
    "dojox/image/Lightbox",
    "esri/arcgis/utils",
    "esri/urlUtils",
    "dojo/parser"
],
  function (declare, array, lang, domConstruct, domAttr, domStyle, domClass, dom, on, query, nls, FlickrBadge, Lightbox, arcgisUtils, urlUtils) {
  	return declare([], {

  		_identifySeletedModule: function (targetContainer, nodes) {
  			var moduleType, nodesArray, dndNode;
  			nodesArray = targetContainer.getAllNodes();
  			for (var i = 0; i < nodesArray.length; i++) {
  				if (targetContainer.getAllNodes()[i].innerHTML == nodes[0].innerHTML) {
  					this.currentNode = nodesArray[i];
  					this.currentNode.index = i;
  					this.currentNode.innerHTML = '';
  					dndNode = nodes[0].firstElementChild ? nodes[0].firstElementChild : nodes[0].firstChild;
  					moduleType = domAttr.get(dndNode, "type");
  					this._showModuleSettingDialog(moduleType, true, targetContainer, nodesArray.length);
  					break;
  				}
  			}
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

  		_deleteModule: function (moduleType, isNewModule, moduleContainer, moduleKey) {
  			var colIndex, contentIndex, moduleIndex, moduleData, mapId;
  			moduleIndex = domAttr.get(moduleContainer, "moduleIndex");
  			this._destroyExistingNode(moduleContainer.parentElement, false);
  			colIndex = parseInt(domAttr.get(moduleContainer, "columnIndex"));
  			bookList = this._getConfigData(dojo.bookListData.Books[this.currentBookIndex]);
  			moduleData = this._getConfigData(dojo.moduleData[this.currentBookIndex]);
  			contentIndex = array.indexOf(bookList.content[colIndex], moduleKey);
  			this.mapBookDetails[this.currentBookIndex][this.currentIndex].content[colIndex][contentIndex] = [];
  			bookList.content[colIndex][contentIndex] = [];
  			delete moduleData[moduleKey];
  			if (moduleType == "webmap") {
  				mapId = "map" + moduleIndex;
  				this._destroyMap(mapId);
  			}
  		},

  		_renderNewPageModule: function (pageContentContainer, newBookPage, currentModuleContent, arrContent) {
  			var newModuleKey, pageModule, contentIndex, columnIndex, _self = this;

  			pageModule = query('.divPageModule', pageContentContainer)[0];
  			pageContentModule = lang.clone(dojo.appConfigData.ModuleDefaultsConfig[currentModuleContent]);
  			contentIndex = parseInt(domAttr.get(pageModule.parentElement, "contentIndex"));
  			columnIndex = parseInt(domAttr.get(pageModule.parentElement, "columnIndex"));
  			pageContentModule["height"] = newBookPage.height[columnIndex][contentIndex];
  			domClass.add(pageModule.parentElement, "esriEditableModeContent");
  			domAttr.set(pageModule.parentElement, "type", pageContentModule.type);
  			if (currentModuleContent == "title" || currentModuleContent == "author") {
  				newModuleKey = currentModuleContent;
  				pageContentModule[pageContentModule.type] = dojo.bookListData.Books[this.currentBookIndex][currentModuleContent];
  			} else {
  				newModuleKey = ((new Date()).getTime()).toString() + contentIndex + '' + columnIndex; //get unique key in microseconds
  			}
  			console.log(contentIndex + '  ' + newModuleKey);
  			domAttr.set(pageContentContainer, "moduleKey", newModuleKey);
  			newBookPage.content[columnIndex][contentIndex] = newModuleKey;

  			pageContentModule["uid"] = newModuleKey;
  			arrContent[newModuleKey] = pageContentModule;
  			if (currentModuleContent !== "TOC") {
  				if (currentModuleContent == "title") {
  					this._createTextModule(pageContentModule, pageModule)
  				} else if (currentModuleContent == "logo") {
  					this._createLogo(pageContentModule, pageModule);
  				} else {
  					if (pageContentModule[pageContentModule.type]) {
  						domAttr.set(pageModule, "innerHTML", pageContentModule[pageContentModule.type]);
  					} else {
  						domAttr.set(pageModule, "innerHTML", currentModuleContent.charAt(0).toUpperCase() + currentModuleContent.slice(1));
  					}
  					this._createEditMenu(pageModule.parentElement, newModuleKey);
  					domStyle.set(pageModule, "height", pageContentModule.height + "px");
  				}
  			} else {
  				this._renderTOCContent(pageModule);
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
  				if (moduleKey == "author" && inputKey == "text") {
  					dojo.bookListData.Books[this.currentBookIndex].author = moduleInputs[1].editNode.innerText;
  				}
  			}
  			moduleContent = this._getConfigData(dojo.moduleData[this.currentBookIndex]);
  			moduleAttr = moduleContent[moduleKey];
  			for (var attr in moduleAttr) {
  				if (moduleData.hasOwnProperty(attr)) {
  					moduleAttr[attr] = moduleData[attr];
  				}
  			}
  			bookListData = this._getConfigData(dojo.bookListData.Books[this.currentBookIndex]);
  			moduleIndex = domAttr.get(moduleContainer, "moduleIndex");
  			if (moduleKey == "title" && this.currentIndex !== 0) {
  				this._createTitleModule(moduleAttr, moduleContainer);
  				bookListData.title = moduleAttr["text"];
  				this.mapBookDetails[this.currentBookIndex][this.currentIndex][moduleKey] = moduleAttr["text"];
  				this._updateTOC();
  			} else {
  				pageModule = domConstruct.create("div", { "moduleIndex": moduleIndex, "class": "divPageModule" }, moduleContainer);
  				domAttr.set(pageModule, "type", moduleType);
  				this._renderModuleContent(moduleType, pageModule, moduleAttr);
  			}
  			dijit.byId("settingDialog").hide();
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
  			domAttr.set(divModuleContent, "columnIndex", columnIndex);
  			domAttr.set(divModuleContent, "contentIndex", index);
  			pageModule = domConstruct.create("div", { "moduleIndex": newModuleIndex, "class": "divPageModule" }, divModuleContent);
  			domAttr.set(divModuleContent, "type", moduleType);
  			this._renderModuleContent(moduleType, pageModule, moduleData);
  			domAttr.set(this.currentNode, "moduleKey", newModuleKey);
  			this.currentNode.appendChild(divModuleContent);
  			bookList = this._getConfigData(dojo.bookListData.Books[this.currentBookIndex]);
  			moduleAttr = this._getConfigData(dojo.moduleData[this.currentBookIndex]);
  			if (!bookList.content[columnIndex]) {
  				bookList.content[columnIndex] = [];
  			}
  			bookList.content[columnIndex].splice(this.currentNode.index, 0, newModuleKey);
  			moduleAttr[newModuleKey] = moduleData;
  			this.mapBookDetails[this.currentBookIndex][this.currentIndex].content = bookList.content;
  			dijit.byId("settingDialog").hide();
  		},

  		_createLogo: function (pageContentModule, pageModule) {
  			var divLogo = domConstruct.create("div", {}, pageModule);
  			domAttr.set(divLogo, "innerHTML", "<img src=" + pageContentModule.URL + " />");
  			domStyle.set(divLogo, "height", pageContentModule.height + 'px');
  			this._createEditMenu(pageModule.parentElement, pageContentModule.uid);
  		},

  		_createTitleModule: function (moduleData, pageTitleHolder) {
  			var divText = domConstruct.create("div", { "class": "esriGeorgiaFont esriPageTitle", "innerHTML": moduleData[moduleData.type] }, pageTitleHolder);
  			domStyle.set(divText, "height", moduleData["height"] + 'px');
  			this._createEditMenu(pageTitleHolder, moduleData.uid);
  		},

  		_createTextModule: function (moduleData, pageModule) {
  			var bookPages, divText, moduleIndex;
  			moduleIndex = domAttr.get(pageModule.parentElement, "moduleIndex");
  			divText = domConstruct.create("div", { "innerHTML": moduleData[moduleData.type] }, pageModule);
  			if (moduleData.uid == "author") {
  				domClass.add(divText, "esriArialFont esriMapBookAuthor");
  				query('.esriBookAuthor')[this.currentBookIndex].innerHTML = dojo.bookListData.Books[this.currentBookIndex].author;
  			} else if (moduleData.uid == "title") {
  				this._createCoverPageTitle(divText, moduleData);
  			} else {
  				domClass.add(divText, "esriArialFont esriText");
  			}
  			domStyle.set(divText, "height", moduleData["height"] + 'px');

  			this._createEditMenu(pageModule.parentElement, moduleData.uid);
  		},

  		_createCoverPageTitle: function (divText, moduleData) {
  			domClass.add(divText, "esriGeorgiaFont esriPageTitle esriTitleFontSize");
  			dojo.bookListData.Books[this.currentBookIndex].title = moduleData.text;
  			this.mapBookDetails[this.currentBookIndex][this.currentIndex].title = moduleData.text;
  			query('.esriBookTitle')[this.currentBookIndex].innerHTML = moduleData.text;
  			query('.esriMapBookList')[this.currentBookIndex].value = moduleData.text;
  			bookPages = lang.clone(this.mapBookDetails[this.currentBookIndex]);
			delete this.mapBookDetails[this.currentBookIndex];
  			this.mapBookDetails[this.currentBookIndex] = bookPages;
  			if (query('.esriMapBookTitle')[0]) {
  				domAttr.set(query('.esriMapBookTitle')[0], "innerHTML", moduleData.text);
  			}
  			domAttr.set(query('.esriBookTitle')[this.currentBookIndex], "title", moduleData.text);
  			this._updateTOC();
  		},

  		_createWebmapModule: function (pageContentModule, pageModule, moduleIndex) {
  			var divMapModuleHolder, mapContent, mapContentBtns, mapContentImgs, btnViewFullMap, loadingIndicator, loadingIndicatorImage, _self = this;
  			divMapModuleHolder = domConstruct.create("div", { "class": "mapModule" }, pageModule);
  			if (pageContentModule.URL) {
  				this._createModuleHeaderTitle(divMapModuleHolder, pageContentModule);
  				mapContentBtns = domConstruct.create("div", { "id": "divMapContainer" + moduleIndex, "class": "esriMapContainer" }, divMapModuleHolder);
  				domStyle.set(mapContentBtns, "height", pageContentModule.height + 'px');
  				mapContent = domConstruct.create("div", { "id": "map" + moduleIndex }, mapContentBtns);
  				domClass.add(mapContent, "esriCTFullHeightWidth");

  				mapContentImgs = domConstruct.create("div", { "class": "mapContentImgs" }, null);
  				btnViewFullMap = domConstruct.create("span", { "index": moduleIndex, "title": nls.fullScreen, "class": "imgfullMapView" }, mapContentImgs);
  				imgLegendData = domConstruct.create("span", { "index": moduleIndex, "title": nls.legendTitle, "class": "imgLegend" }, mapContentImgs);
  				loadingIndicator = domConstruct.create("div", { id: "loadingmap" + moduleIndex, "class": "mapLoadingIndicator" }, mapContent);
  				loadingIndicatorImage = domConstruct.create("div", { "class": "mapLoadingIndicatorImage" }, loadingIndicator);

  				on(imgLegendData, "click", function () {
  					_self._toggleLegendContainer(this);
  				});
  				this._createFullViewMap(btnViewFullMap, moduleIndex);
  				this._createModuleCaption(divMapModuleHolder, pageContentModule);
  				this._renderWebMapContent(pageContentModule, mapContent.id, mapContentImgs, pageModule.parentElement);
  			} else {
  				domStyle.set(divMapModuleHolder, "height", pageContentModule.height + 'px');
  				domAttr.set(divMapModuleHolder, "innerHTML", pageContentModule.type.charAt(0).toUpperCase() + pageContentModule.type.slice(1));
  			}
  			this._createEditMenu(pageModule.parentElement, pageContentModule.uid);

  		},

  		_renderWebMapContent: function (currentModuleContent, mapId, mapContentImgs, moduleContainer) {
  			var _self = this, webmapUrl;

  			webmapUrl = urlUtils.urlToObject(currentModuleContent.URL);
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
  						_self._createTimeSlider(response);
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
  					} else {
  						on(dom.byId(mapId), "mouseover", function () {
  							response.map.resize();
  							response.map.reposition();
  						});
  					}
  				}, function (error) {
  				});
  			}
  		},

  		_createModuleHeaderTitle: function (divMapModuleHolder, pageContentModule) {
  			var mapTitle;
  			if (pageContentModule.title) {
  				mapTitle = domConstruct.create("div", { "class": "esriModuleTitle" }, null);
  				domAttr.set(mapTitle, "innerHTML", pageContentModule.title);
  				divMapModuleHolder.appendChild(mapTitle);
  			}
  		},

  		_createModuleCaption: function (divMapModuleHolder, pageContentModule) {
  			var mapCaption;
  			if (pageContentModule.caption) {
  				mapCaption = domConstruct.create("div", { "class": "esriModuleCaption" }, null);
  				domAttr.set(mapCaption, "innerHTML", pageContentModule.caption);
  				divMapModuleHolder.appendChild(mapCaption);
  			}
  		},

  		_createFullViewMap: function (btnViewFullMap, moduleIndex) {
  			var divFullMapView, currentPage, _self = this, fullMapIndex = this.currentIndex;
  			divFullMapView = domConstruct.create("div", { "class": "esriFullMap", "id": "viewFull" + moduleIndex }, null);
  			if (this.mapBookDetails[this.currentBookIndex][1] == "EmptyContent" && this.currentIndex !== 0) {
  				fullMapIndex--;
  			}
  			currentPage = dom.byId("mapBookPagesUList").children[fullMapIndex];
  			currentPage.appendChild(divFullMapView);

  			on(btnViewFullMap, "click", function (evt) {
  				if (domClass.contains(dom.byId("divContentListPanel"), "esriContentPanelOpened")) {
  					domClass.remove(dom.byId("divContentListPanel"), "esriContentPanelOpened");
  					domClass.remove(query(".esriTocIcon")[0], "esriHeaderIconSelected");
  				}
  				_self._toggleFullMapView(this);
  			});
  		},

  		_createImageModule: function (pageContentModule, pageModule, moduleIndex) {
  			var innerDiv, imgModule, imageHeight, imgPath, imageDialog;
  			innerDiv = domConstruct.create("div", { "id": "innerDiv" + "Img" + moduleIndex, "style": 'height:' + pageContentModule.height + 'px;', "class": "innerDiv" }, pageModule);
  			imgModule = domConstruct.create("img", { "class": "esriImageModule", "style": 'height:' + pageContentModule.height + 'px;', "src": pageContentModule.URL }, innerDiv);
  			if (domStyle.get(pageModule, "width") > 0 && domStyle.get(pageModule, "width") < pageContentModule.width) {
  				domStyle.set(innerDiv, "width", "100%");
  				domStyle.set(imgModule, "width", "100%");
  			} else {
  				domStyle.set(innerDiv, "width", pageContentModule.width + 'px');
  				domStyle.set(imgModule, "width", pageContentModule.width + 'px');
  			}

  			if (pageContentModule.URL == '') {
  				domAttr.set(innerDiv, "innerHTML", "Image");
  			}
  			imgModule.URL = pageContentModule.URL;
  			on(imgModule, "click", function () {
  				imgPath = this.URL;
  				imageDialog = new Lightbox.LightboxDialog({});
  				imageDialog.startup();
  				imageDialog.show({ title: "", href: imgPath });
  			});
  			this._createEditMenu(pageModule.parentElement, pageContentModule.uid);
  		},

  		_renderVideoContent: function (pageContentModule, pageModule) {
  			var embed = '', urlParam = pageContentModule.URL;
  			if (pageContentModule.title) {
  				embed += '<div class="esriModuleTitle">' + pageContentModule.title + '</div>';
  			}
  			var videoURL = pageContentModule.URL.match(/.com/);
  			if (videoURL) {
  				videoURL = urlUtils.urlToObject(pageContentModule.URL);
  			}

  			switch (pageContentModule.provider) {
  				case "vimeo":
  					if (videoURL) {
  						urlParam = pageContentModule.URL.split('/');
  						urlParam = urlParam[urlParam.length - 1];
  					}
  					videoURL = dojo.appConfigData.VimeoVideoUrl + urlParam;
  					embed += "<iframe width=" + "90%" + " height=" + pageContentModule.height + "px src='" + videoURL + "' frameborder=0 webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>";
  					break;
  				case "youtube":
  					if (videoURL) {
  						urlParam = videoURL.query['v'];
  					}
  					videoURL = dojo.appConfigData.YouTubeVideoUrl + urlParam;

  					embed += "<iframe width=" + "90%" + " height=" + pageContentModule.height + "px src='" + videoURL + "' frameborder='0' allowfullscreen></iframe>";
  					break;
  				case "esri":
  					if (videoURL) {
  						videoURL = pageContentModule.URL.replace("watch", "iframe");
  					} else {
  						videoURL = dojo.appConfigData.EsriVideoUrl + urlParam;
  					}
  					embed += "<iframe width=" + "90%" + " height=" + pageContentModule.height + "px src='" + videoURL + "' frameborder=0 webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>";
  					break;
  			}
  			if (pageContentModule.caption) {
  				embed += '<div class="esriModuleCaption">' + pageContentModule.caption + '</div>';
  			}
  			pageModule.innerHTML = embed;
  			this._createEditMenu(pageModule.parentElement, pageContentModule.uid);
  		},

  		_renderTOCContent: function (parentNode, moduleData) {
  			var _self = this, tocContent, anchorTag, divPageNo, divPageTitle, title;
  			tocContent = query('.esriTOCcontainer', parentNode)[0];
  			this._destroyExistingNode(tocContent, false);
  			tocContent = domConstruct.create("div", { "class": "esriTOCcontainer" }, null);
  			for (var pageIndex = 0; pageIndex < _self.mapBookDetails[_self.currentBookIndex].length; pageIndex++) {
  				anchorTag = domConstruct.create("div", { "value": pageIndex, "class": "esriContentListDiv" }, null);
  				divPageTitle = domConstruct.create("div", { "value": pageIndex, "class": "esriTitleListDiv" }, anchorTag);
  				divPageNo = domConstruct.create("div", { "value": pageIndex, "class": "esriTitleIndexDiv" }, anchorTag);
  				if (_self.mapBookDetails[_self.currentBookIndex][pageIndex] == "EmptyContent") {
  					title = nls.contentsPageTitle;
  					domStyle.set(anchorTag, "cursor", "default");
  				} else {
  					title = _self.mapBookDetails[_self.currentBookIndex][pageIndex].title;
  				}
  				domAttr.set(divPageTitle, "innerHTML", title);
  				if (pageIndex > 1) {
  					domAttr.set(divPageNo, "innerHTML", (pageIndex - 1));
  				}
  				tocContent.appendChild(anchorTag);
  				on(anchorTag, "click", function (evt) {
  					if (!domClass.contains(this.parentElement.parentElement.parentElement, "esriEditableModeContent")) {
  						if (_self.mapBookDetails[_self.currentBookIndex][this.value] !== "EmptyContent") {
  							_self._gotoPage(this.value);
  							evt.cancelBubble = true;
  							evt.cancelable = true;
  						}
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
  			var photsetContent, moduleId;
  			moduleId = "flickr" + domAttr.get(pageModule, "moduleIndex");

  			if (dijit.byId(moduleId)) {
  				dijit.byId(moduleId).destroy();
  			}
  			photsetContent = new FlickrBadge({
  				"apikey": "4e02b880dc9fc2825fdfdc2972e6843c",
  				"setid": moduleData.URL,
  				"username": "dylans",
  				"cols": moduleData.columns,
  				"rows": moduleData.rows,
  				"target": "_blank",
  				"id": moduleId
  			});
  			domClass.add(pageModule, "esriflickrContainer");
  			photsetContent.startup();
  			this._createModuleHeaderTitle(pageModule, moduleData);
  			pageModule.appendChild(photsetContent.domNode);
  			this._createModuleCaption(pageModule, moduleData);
  			this._createEditMenu(pageModule.parentElement, moduleData.uid);
  		},

  		_createEditMenu: function (pageContentHolder, moduleId) {
  			var _self = this, moduleType, divEditIcon, columnIndex, deleteModuleFlag, editModuleIcon, divEditOption, divDeleteIcon, moduleContainer;
  			moduleType = domAttr.get(pageContentHolder, "type");
  			domAttr.set(pageContentHolder, "key", moduleId);
  			divEditOption = domConstruct.create("div", { "class": "esriEditContentOption" }, null);
  			pageContentHolder.appendChild(divEditOption);
  			columnIndex = domAttr.get(pageContentHolder, "columnIndex");
  			if (!(this.currentIndex == 0 && columnIndex === "0" || moduleId === "title")) {
  				divDeleteIcon = domConstruct.create("div", { "key": moduleId, "class": "esriDeletetModuleIcon", "title": nls.editMentDeleteTitle }, divEditOption);
  				domAttr.set(divDeleteIcon, "type", moduleType);
  				on(divDeleteIcon, "click", function () {
  					deleteModuleFlag = confirm(nls.confirmModuleDeleting);
  					if (deleteModuleFlag) {
  						moduleContainer = this.parentElement.parentElement;
  						_self._deleteModule(domAttr.get(this, "type"), false, moduleContainer, domAttr.get(this, "key"));
  					}
  				});
  			}
  			divEditIcon = domConstruct.create("div", { "key": moduleId, "class": "esriEditModuleIcon", "title": nls.editMentEditTitle }, divEditOption);
  			domAttr.set(divEditIcon, "type", moduleType);

  			on(divEditIcon, "click", function (evt) {
  				moduleContainer = this.parentElement.parentElement;
  				_self._showModuleSettingDialog(domAttr.get(this, "type"), false, moduleContainer, domAttr.get(this, "key"));
  			});

  			this.own(on(pageContentHolder, "dblclick", function (evt) {
  				if (_self.isEditModeEnable) {
  					_self._showModuleSettingDialog(domAttr.get(this, "type"), false, this, domAttr.get(this, "key"));
  				}
  			}));
  		}
  	});
  });