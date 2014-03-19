define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/dom-construct",
	"dojo/dom-attr",
	"dojo/dom-style",
	"dojo/dom-class",
	"dojo/dom",
	"dojo/on",
	"dojo/query",
	"dojo/parser"
], function (declare, array, domConstruct, domAttr, domStyle, domClass, dom, on, query) {
	return declare([], {

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

		_removeClass: function (node, className) {
			if (domClass.contains(node, className)) {
				domClass.remove(node, className);
			}
		},

		_destroyExistingNode: function (dijitNode, isDijitNode) {
			if (dijitNode) {
				if (isDijitNode) {
					dijitNode.destroy();
				} else {
					domConstruct.destroy(dijitNode);
				}
			}
		},

		_destroyMap: function (mapId) {
			var mapIndex, isMapExist = false, _self = this;
			array.forEach(this.webmapArray, function (currentMap, index) {
				if (mapId == currentMap.id) {
					mapIndex = index;
					isMapExist = true;
					_self._destroyExistingNode(dijit.registry.byId("legendContent" + currentMap.id), true);
					currentMap.destroy();
				}
			});
			if (isMapExist) {
				this.webmapArray.splice(mapIndex, 1);
			}
		},

		_setColumnClass: function (pageColumns, columnIndex) {
			var pageLayoutClass = '';
			if (pageColumns === 1) {
				pageLayoutClass = "esriLayoutDiv";
			} else {
				pageLayoutClass = "esriLayoutDiv" + columnIndex;
			}
			pageLayoutClass += ' esriMapBookColContent dojoDndItem';

			return pageLayoutClass;
		},

		_setModuleIndex: function (node, moduleIndex, columnIndex, contentIndex) {
			if (node) {
				domAttr.set(node, "moduleIndex", moduleIndex);
				domAttr.set(node, "columnIndex", columnIndex);
				domAttr.set(node, "contentIndex", contentIndex);
			}
		},

		_enableDnd: function (dndNode) {
			dndNode.delay = 0;
			dndNode.checkAcceptance = function (source, nodes) {
				return true;
			};
		},
		_disableDnd: function (dndNode) {
			dndNode.delay = 1000;
			dndNode.checkAcceptance = function (source, nodes) {
				return false;
			};
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

		_toggleEditPageVisibility: function (isContentPage) {
			if (domStyle.get(query('.esriEditPageBody')[0], "display") == "none") {
				domStyle.set(query('.esriEditPageBody')[0], "display", "block");
				domStyle.set(query('.esriMapBookEditPage')[0], "height", "100%");
				if (isContentPage) {
					domStyle.set(query('.contentLayoutOption')[0], "display", "block");
					domStyle.set(query('.pageLayoutOption')[0], "display", "none");
				} else {
					domStyle.set(query('.contentLayoutOption')[0], "display", "none");
					domStyle.set(query('.pageLayoutOption')[0], "display", "block");
				}
				this._togglePageNavigation(false);
			}
		},

		_toggleLegendContainer: function (btnNode) {
			var containerId = "legendContentmap" + domAttr.get(btnNode, "index");
			if (domClass.contains(dom.byId(containerId), "esriLegendContainerOpen")) {
				domClass.remove(dom.byId(containerId), "esriLegendContainerOpen");
			} else {
				domClass.add(dom.byId(containerId), "esriLegendContainerOpen");
			}
		},

		_toggleInfoWindowVisibility: function (divFullMap, mapId, isInfoWindowEnable) {
			array.some(this.webmapArray, function (currentMap) {
				if (mapId == currentMap.id) {
					currentMap.infoWindow.popupWindow = isInfoWindowEnable;
					currentMap.infoWindow.set("highlight", false);
					currentMap.resize();
				}
				if (isInfoWindowEnable) {
					on(currentMap, "click", function () {
						if (!currentMap.infoWindow.highlight && domStyle.get(divFullMap, "display") == "block") {
							currentMap.infoWindow.set("highlight", isInfoWindowEnable);
						}
					});
				} else {
					currentMap.infoWindow.hide();
				}
			});
		},

		_toggleFullMapView: function (btnNode) {
			var containerId, divFullMap, zoomSlider, divCustomMap, timeSlider, mapContainer, esriLogo;
			containerId = domAttr.get(btnNode, "index");
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
				this._toggleInfoWindowVisibility(divFullMap, mapContainer.id, true);
			} else {
				domStyle.set(divFullMap, "display", "none");
				divCustomMap.appendChild(mapContainer);
				if (zoomSlider) {
					domStyle.set(zoomSlider, "display", "none");
				}
				if (esriLogo) {
					domStyle.set(esriLogo, "bottom", "5px");
				}
				this._toggleInfoWindowVisibility(divFullMap, mapContainer.id, false);
			}
		},
		_toggleDnd: function (isEditModeEnable) {
			array.forEach(this.DNDArray, function (dndCont) {
				if (isEditModeEnable) {
						dndCont.delay = 0;
						dndCont.checkAcceptance = function (source, nodes) {
							if (nodes[0].dndType !== "carousalPage") {
								return true;
							}
						};
				} else {
					dndCont.delay = 1000;
					dndCont.checkAcceptance = function (source, nodes) {
						return false;
					};
				}
			});
		},

		_toggleDeleteBookOption: function (isEnable) {
			var selectedBookIndex, closeBtns, bookTitle;
			bookTitle = query('.esriBookTitlediv');
			closeBtns = query('.esriBookclose');
			array.forEach(closeBtns, function (deleteBtn, index) {
				selectedBookIndex = domAttr.get(deleteBtn.parentElement, "index");
				if (isEnable && dojo.bookInfo[selectedBookIndex].BookConfigData.owner == dojo.currentUser) {
					domClass.add(bookTitle[index], "esriBookTitledivchange");
					domStyle.set(deleteBtn, "display", "block");
				} else {
					domClass.remove(bookTitle[index], "esriBookTitledivchange");
					domStyle.set(deleteBtn, "display", "none");
				}
			});
			if (isEnable) {
				domClass.add(query('.esriDeleteBookIcon')[0], "esriHeaderIconSelected");
			} else {
				domClass.remove(query('.esriDeleteBookIcon')[0], "esriHeaderIconSelected");
			}
		},

		_clearTemplateSelection: function (isBookPageLayout) {
			var configLayout, selectedTemp, _self = this;

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

		_updateTOC: function () {
			var oldTOC;
			oldTOC = query('.esriMapBookColContent .esriTOCcontainer')[0];
			if (oldTOC) {
				this._renderTOCContent(oldTOC.parentElement);
			}
			this._renderTOCContent(dom.byId("divContentList"));
		},

		_setBookPageIndex: function (bookListdata, bookPagesLength) {
			for (var i = 0; i < bookPagesLength; i++) {
				bookListdata[i].index = i + 2;
			}
		},

		_setNewHeight: function (resizerObj) {
			var moduleKey, newHeight, configData;
			moduleKey = domAttr.get(resizerObj.domNode, "key");
			newHeight = domStyle.get(resizerObj.targetDomNode, "height");
			configData = this._getConfigData(dojo.bookInfo[dojo.currentBookIndex].ModuleConfigData);
			configData[moduleKey].height = Math.floor(newHeight);
		}
	});
});