define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dijit/_WidgetBase",
	"dijit/Dialog",
	"dijit/form/ComboBox",
	"dijit/form/TextBox",
	"dojo/dom-construct",
	"dojo/dom-attr",
	"dojo/dom-style",
	"dojo/dom-class",
	"dojo/dom",
	"dojo/on",
	"dojo/query",
	"dojo/store/Memory",
	"dojo/topic",
	"dojo/i18n!nls/localizedStrings",
	"esri/arcgis/Portal",
	"esri/request",
	"dojo/parser"
], function (declare, array, lang, _WidgetBase, Dialog, ComboBox, TextBox, domConstruct, domAttr, domStyle, domClass, dom, on, query, Memory, topic, nls, Portal, esriRequest) {
    return declare([_WidgetBase], {
        _portal: null,
        _selectedWebmap: null,
        postCreate: function () {
            var _self = this;
            topic.subscribe("_getPortal", function (portal) {
                _self._portal = portal;
            });

            this._createSelectWebmapDialog();
            topic.subscribe("_queryForWebmapsHandler", function () {
                _self._setDefaultSearchOption();
            });
        },

        _createSelectWebmapDialog: function () {
            var _self = this, divSelectWebMapContainer, selectWebmapDialog, btnContainer, btnOK, divSearchOption, mapname, inputKey,
             moduleInputs, inputFields, inputIndex;
            if (dijit.byId("SelectWebmapDialog")) {
                dijit.byId("SelectWebmapDialog").destroy();
            }
            selectWebmapDialog = new Dialog({
                id: "SelectWebmapDialog",
                "class": "esriSelectWebmapDialog",
                draggable: false
            });
            selectWebmapDialog.startup();
            selectWebmapDialog.closeButtonNode.title = nls.closeButtonTitle;
            selectWebmapDialog.titleNode.innerHTML = '<img class="esriSettingModuleIcon" src=' + dojo.appConfigData.DefaultModuleIcons.webmap.URL + '>' + nls.selectWebmapDialogTitle;
            divSelectWebMapContainer = domConstruct.create("div", { "class": "esriSelectWebmapContainer" }, null);
            divSearchOption = domConstruct.create("div", { "class": "esriSearchWebmapOptions" }, divSelectWebMapContainer);

            this._createtWebmapSearchDropdown(divSearchOption);
            this._createWebmapSearchBox(divSearchOption);
            domConstruct.create("div", { "id": "divWebmapContent", "class": "esriWebmapContent" }, divSelectWebMapContainer);
            this._createPaginationFooter(divSelectWebMapContainer);
            btnContainer = domConstruct.create("div", { "class": "esriButtonContainer" }, divSelectWebMapContainer);
            btnOK = domConstruct.create("div", { "class": "esriSelectWebmapBtn", "innerHTML": nls.okButtonText }, btnContainer);

            on(btnOK, "click", function () {
                dijit.byId("SelectWebmapDialog").hide();
                if (_self._selectedWebmap) {
                    moduleInputs = [];
                    inputFields = query('.esriSettingInput');
                    for (inputIndex = 0; inputIndex < inputFields.length; inputIndex++) {
                        moduleInputs[inputIndex] = {};
                        inputKey = domAttr.get(inputFields[inputIndex], "inputKey");
                        if (_self._selectedWebmap[inputKey]) {
                            moduleInputs[inputIndex].value = _self._selectedWebmap[inputKey];
                            query('.dijitInputInner', inputFields[inputIndex])[0].value = _self._selectedWebmap[inputKey];
                        }
                    }

                    mapname = dojo.string.substitute(nls.selectedWebmapText, { "webmapName": _self._selectedWebmap.title });
                    domAttr.set(query('.esriMapInfoLabel')[0], "innerHTML", mapname);
                    dijit.byId("settingDialog").show();
                    dijit.byId("settingDialog").resize();
                }
            });

            selectWebmapDialog.setContent(divSelectWebMapContainer);

        },

        _setDefaultSearchOption: function () {
            dijit.byId("searchWebmapComboBox").set("item", dijit.byId("searchWebmapComboBox").store.data[0]);
            dijit.byId("searchTagTextBox").reset();
            this._queryPortalForWebmaps(false);
        },

        _createPaginationFooter: function (divSelectWebMapContainer) {
            var divPaginationFooter, divInnerPaginationFooter, divWebmapCount, divPrev, divPageStatus, divNext, _self = this;
            divPaginationFooter = domConstruct.create("div", { "class": "esriWebmapPagination" }, divSelectWebMapContainer);
            divInnerPaginationFooter = domConstruct.create("div", { "class": "esriPaginationInnerDiv" }, divPaginationFooter);
            divWebmapCount = domConstruct.create("div", { "class": "esriWebmapCountDiv" }, divInnerPaginationFooter);
            divPrev = domConstruct.create("div", { "class": "esriPaginationPrevious", "innerHTML": "<span class='esriPaginationText'>Previous<span>" }, divInnerPaginationFooter);
            divPageStatus = domConstruct.create("div", { "class": "esriCurrentPageStatus" }, divInnerPaginationFooter);
            divNext = domConstruct.create("div", { "class": "esriPaginationNext", "innerHTML": "<span class='esriPaginationText'>Next</span>" }, divInnerPaginationFooter);
            divPageStatus.innerHTML = '<div class="esriCurrentPageIndex"></div>' + ' / <div class="esriTotalPageCount"> </div>';

            on(divPrev, "click", function () {
                _self._displaySelecteddPage(this, false);
            });
            on(divNext, "click", function () {
                _self._displaySelecteddPage(this, true);
            });

        },

        _displaySelecteddPage: function (btnNode, isNext) {
            var currentPageIndex, webmapPageList;
            if (!domClass.contains(btnNode, "disableNavigation")) {
                webmapPageList = query('.esriWebmaplistPage');
                currentPageIndex = parseInt(domAttr.get(query('.esriCurrentPageIndex')[0], "currentPage"));
                domClass.add(webmapPageList[currentPageIndex], "displayNone");

                isNext ? currentPageIndex++ : currentPageIndex--;
                domClass.remove(webmapPageList[currentPageIndex], "displayNone");
                domClass.remove(query('.esriPaginationNext')[0], "disableNavigation");
                domClass.remove(query('.esriPaginationPrevious')[0], "disableNavigation");

                if (currentPageIndex === webmapPageList.length - 1) {
                    domClass.add(btnNode, "disableNavigation");
                }
                if (currentPageIndex === 0) {
                    domClass.add(btnNode, "disableNavigation");
                }
                this._setPaginationDetails(currentPageIndex);
            }
        },

        _queryPortalForWebmaps: function (param) {
            var _self = this, queryParams, queryString;
            queryString = 'type:"Web Map" -type:"Web Mapping Application"';
            if (param && param !== '') {
                queryString = param + ' AND ' + queryString;
            }
            queryParams = {
                q: queryString,
                sortField: "title",
                sortOrder: "asc",
                start: 1,
                num: dojo.appConfigData.MaxWebMapCount
            };

            this._portal.queryItems(queryParams).then(function (response) {
                _self._createWebMapDialogContent(response);
            }, function (error) {
                domStyle.set(dom.byId("outerLoadingIndcator"), "display", "none");
                console.log(error);
            });
        },

        _createWebMapDialogContent: function (response) {
            var pageIndex, _self = this, webmapIndex, divWebmapPage, divWebmapThumbnail, imgWebmapThumbnail, pageWidth,
            paginationFooter, noOfpages, pageContentIndex;
            this._selectedWebmap = null;
            domConstruct.empty(dom.byId("divWebmapContent"));
            noOfpages = Math.ceil(response.results.length / dojo.appConfigData.webmapPerPage);
            webmapIndex = 0;
            if (response.results.length > 0) {
                for (pageIndex = 0; pageIndex < noOfpages; pageIndex++) {
                    divWebmapPage = domConstruct.create("div", { "pageIndex": pageIndex, "class": "esriWebmaplistPage" }, dom.byId("divWebmapContent"));
                    if (pageIndex !== 0) {
                        domClass.add(divWebmapPage, "displayNone");
                    }

                    for (pageContentIndex = 0; pageContentIndex < dojo.appConfigData.webmapPerPage; pageContentIndex++) {
                        if (response.results[webmapIndex]) {
                            divWebmapThumbnail = domConstruct.create("div", { "class": "esriWebmapThumbnailDiv" }, divWebmapPage);
                            imgWebmapThumbnail = domConstruct.create("img", { "src": response.results[webmapIndex].thumbnailUrl, "class": "esriWebmapThumbnail" }, divWebmapThumbnail);
                            domAttr.set(imgWebmapThumbnail, "webmapID", response.results[webmapIndex].id);
                            domAttr.set(imgWebmapThumbnail, "webmapTitle", response.results[webmapIndex].title);
                            domAttr.set(imgWebmapThumbnail, "webmapCaption", response.results[webmapIndex].snippet);
                            domConstruct.create("div", { "class": "esriWebmapTitle", "innerHTML": response.results[webmapIndex].title }, divWebmapThumbnail);
                            _self.own(on(imgWebmapThumbnail, "click", function () {
                                if (query('.esriSelectedWebmap')[0]) {
                                    domClass.remove(query('.esriSelectedWebmap')[0].parentElement, "esriSelectedWebmapDiv");
                                    domClass.remove(query('.esriSelectedWebmap')[0], "esriSelectedWebmap");
                                }
                                domClass.add(this, "esriSelectedWebmap");
                                domClass.add(this.parentElement, "esriSelectedWebmapDiv");
                                _self._selectedWebmap = {};
                                _self._selectedWebmap.URL = domAttr.get(this, "webmapID");
                                _self._selectedWebmap.title = domAttr.get(this, "webmapTitle");
                                _self._selectedWebmap.caption = domAttr.get(this, "webmapCaption");
                            }));
                            webmapIndex++;
                        }
                        if (webmapIndex > response.results.length) {
                            break;
                        }
                    }
                }

                pageWidth = domStyle.get(divWebmapPage, "width");
                domStyle.set(dom.byId("divWebmapContent"), "width", pageWidth * noOfpages + 'px');

            }
            paginationFooter = query('.esriWebmapPagination')[0];
            if (paginationFooter) {
                if (response.results.length === 0) {
                    domStyle.set(query('.esriPaginationInnerDiv')[0], "display", "none");
                    dom.byId("divWebmapContent").innerHTML = "No webmap found";
                } else {
                    domStyle.set(query('.esriPaginationInnerDiv')[0], "display", "block");
                }
                query('.esriTotalPageCount')[0].innerHTML = noOfpages;
                domAttr.set(query('.esriTotalPageCount')[0], "totalWebmap", response.results.length);
                domAttr.set(query('.esriTotalPageCount')[0], "webmapPerPage", dojo.appConfigData.webmapPerPage);
                if (noOfpages === 1) {
                    domClass.add(query('.esriPaginationNext')[0], "disableNavigation");
                } else {
                    domClass.remove(query('.esriPaginationNext')[0], "disableNavigation");
                }
                domClass.add(query('.esriPaginationPrevious')[0], "disableNavigation");
                _self._setPaginationDetails(0);
            }
            domStyle.set(dom.byId("outerLoadingIndcator"), "display", "none");
            dijit.byId("SelectWebmapDialog").show();
            dijit.byId("SelectWebmapDialog").resize();
        },

        _setPaginationDetails: function (pageIndex) {
            var startIndex, webmapCount, webmapPerPage, totalWebmap, webmapCountDetails;

            totalWebmap = domAttr.get(query('.esriTotalPageCount')[0], "totalWebmap");
            webmapPerPage = domAttr.get(query('.esriTotalPageCount')[0], "webmapPerPage");
            webmapCount = query('.esriWebmaplistPage')[pageIndex].children.length;

            startIndex = pageIndex * webmapPerPage + 1;
            webmapCount = webmapCount + startIndex - 1;
            if (webmapCount) {
                webmapCountDetails = dojo.string.substitute(nls.webmapCountStatus, { "start": startIndex, "end": webmapCount, "total": totalWebmap });
                query('.esriWebmapCountDiv')[0].innerHTML = webmapCountDetails;
                domAttr.set(query('.esriCurrentPageIndex')[0], "currentPage", pageIndex);
                query('.esriCurrentPageIndex')[0].innerHTML = pageIndex + 1;
            }
        },

        _createtWebmapSearchDropdown: function (divSearchOption) {

            var divInputContainer, stateStore, dijitInputContainer, _self = this, queryParam;
            divInputContainer = domConstruct.create("div", {}, divSearchOption);

            if (dijit.byId("searchWebmapComboBox")) {
                dijit.byId("searchWebmapComboBox").destroy();
            }
            stateStore = new Memory({
                data: [{ name: "ArcGIS Online", value: "arcgis" },
                       { name: "My Content", value: "mycontent" },
                       { name: "My Organization", value: "org"}]
            });

            dijitInputContainer = new ComboBox({
                store: stateStore,
                value: stateStore.data[0].name,
                searchAttr: "name",
                "id": "searchWebmapComboBox"
            }, divInputContainer);
            dijitInputContainer.startup();
            dijitInputContainer.textbox.readOnly = true;
            dijit.byId("searchWebmapComboBox").item = stateStore.data[0];
            dijitInputContainer.onChange = function (selectedText) {
                queryParam = _self._getSelectedSearchOption();
                _self._queryPortalForWebmaps(queryParam);
            };

        },

        _getSelectedSearchOption: function () {
            var searchParam, queryParam = '';
            searchParam = dijit.byId("searchWebmapComboBox").item.value;

            switch (searchParam) {
                case "arcgis":
                    break;
                case "org":
                    queryParam = "orgid:" + this._portal.id;
                    break;
                case "mycontent":
                    queryParam = "owner: " + dojo.currentUser;
                    break;
            }
            if (dijit.byId("searchTagTextBox").get("value").trim() !== "") {
                if (queryParam !== '') {
                    queryParam += ' AND ';
                }
                queryParam += 'title:' + dijit.byId("searchTagTextBox").get("value");
            }
            return queryParam;
        },

        _createWebmapSearchBox: function (divSearchOption) {
            var divInputContainer, searchTag, dijitInputContainer, queryParam, btnSearch, _self = this;
            divInputContainer = domConstruct.create("div", {}, divSearchOption);
            if (dijit.byId("searchTagTextBox")) {
                dijit.byId("searchTagTextBox").destroy();
            }

            dijitInputContainer = new TextBox({ "id": "searchTagTextBox", "class": "esriSearchWebmapTextBox" }, divInputContainer);
            dijitInputContainer.textbox.placeholder = nls.searchWebmapPlaceHolder;
            dijitInputContainer.startup();
            btnSearch = domConstruct.create("div", { "class": "esriSearchWebmapBtn", "innerHTML": "Go" }, null);

            dijitInputContainer.domNode.appendChild(btnSearch);
            this.own(on(btnSearch, "click", function () {
                queryParam = _self._getSelectedSearchOption();
                if (dijit.byId("searchTagTextBox").get("value").trim() !== "") {
                    searchTag = 'title:' + dijit.byId("searchTagTextBox").get("value");
                    if (queryParam !== "") {
                        queryParam += ' AND ';
                    }
                    queryParam += searchTag;
                }
                _self._queryPortalForWebmaps(queryParam);
            }));
        }

    });
});

