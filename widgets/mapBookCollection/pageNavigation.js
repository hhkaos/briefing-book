define([
    "dojo/_base/declare",
	"dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/dom-style",
    "dojo/dom-class",
    "dojo/dom",
	"dojo/dnd/Source",
    "dojo/on",
	"dojo/query",
	"dojo/i18n!nls/localizedStrings",
	"dojo/parser"
],
  function (declare, domConstruct, domAttr, domStyle, domClass, dom, dndSource, on, query, nls) {
  	return declare([], {

  		_createPageSlider: function () {
  			var divPageSlider, dndPageList = [], divPageSliderLeft, divPageSliderContent, divPageSliderRight, listItem, divPage, ulist, bookPagesLength, _self = this;
  			divPageSlider = query('.esriPageSliderContainer')[0];
  			if (divPageSlider) {
  				domConstruct.empty(divPageSlider);
  			}
  			bookPagesLength = dojo.bookListData.Books[this.currentBookIndex].BookPages.length;
  			if (bookPagesLength > 0) {
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
  				ulist = domConstruct.create("ul", { "dndContType": "pageCarousal", "class": "esriPageSliderUlist" }, divPageSliderContent);
  				var uListDndCont = new dndSource(ulist, { accept: ["carousalPage"] });
  				for (var i = 0; i < bookPagesLength; i++) {
  					listItem = domConstruct.create("li", { "class": "esriPageSliderListItem" }, null);
  					domAttr.set(listItem, "index", i + 2);
  					divPage = domConstruct.create("div", { "class": "esriPageSliderDiv esriBookPage", "index": i + 2, "innerHTML": "Page " + (i + 1) }, listItem);
  					on(listItem, "click", function (evt) {
  						_self._gotoPage(parseInt(domAttr.get(this, "index")));
  					});
  					listItem.dndType = "carousalPage";
  					dndPageList.push(listItem);
  				}
  				uListDndCont.insertNodes(false, dndPageList);
  				uListDndCont.forInItems(function (item, id, map) {
  					domClass.add(id, "carousalPage");
  				});
  				uListDndCont.sync();
  				if (bookPagesLength == 0) {
  					domStyle.set(divPageSlider, "display", "none");
  				} else {
  					domStyle.set(divPageSlider, "display", "inline-block");
  				}
  			}
  		},


  		_handlePageNavigation: function (currentObj, isSlideLeft) {
  			if (this.isNavigationEnabled) {
  				currentClass = isSlideLeft ? "esriPrevDisabled" : "esriNextDisabled";
  				if (!domClass.contains(currentObj, currentClass)) {
  					isSlideLeft ? this.currentIndex-- : this.currentIndex++;
  					if (this.mapBookDetails[this.selectedMapBook][this.currentIndex] == "EmptyContent") {
  						isSlideLeft ? this.currentIndex = 0 : this.currentIndex++;
  					}
  					this._slideBookPage();
  				}
  			}
  		},

  		_setArrowVisibility: function () {
  			var selectedPageIndex = this.currentIndex;
  			var totalPageLength = this.mapBookDetails[this.selectedMapBook].length;
  			if (this.mapBookDetails[this.selectedMapBook][1] == "EmptyContent") {
  				totalPageLength--;
  				selectedPageIndex--;
  			}
  			if (this.currentIndex == 0) {
  				if (totalPageLength > 1) {
  					this._removeClass(this.mapBookNextPage, "esriNextDisabled");
  				} else {
  					domClass.add(this.mapBookNextPage, "esriNextDisabled");
  				}
  				domClass.add(this.mapBookPreviousPage, "esriPrevDisabled");
  			}
  			else if (selectedPageIndex === totalPageLength - 1) {
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
  			if (this.mapBookDetails[this.selectedMapBook][1] == "EmptyContent" && this.currentIndex !== 0) {
  				left = (this.currentIndex - 1) * Math.ceil(pageWidth);
  			} else {
  				left = (this.currentIndex) * Math.ceil(pageWidth);
  			}
  			dom.byId("mapBookPagesUList").style.marginLeft = -left + 'px';
  			if (domClass.contains(dom.byId("divContentListPanel"), "esriContentPanelOpened")) {
  				domClass.remove(dom.byId("divContentListPanel"), "esriContentPanelOpened");
  				domClass.remove(query('.esriTocIcon')[0], "esriHeaderIconSelected");
  			}
  			this._highlightSelectedPage();
  			this._setArrowVisibility();
  			this._setPageNavigation();
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

  		_highlightSelectedPage: function () {
  			var preSelectedPage, bookPageList, sliderContentWidth, totalUlistWidth;
  			if (this.mapBookDetails[this.selectedMapBook][this.currentIndex] == "EmptyContent") {
  				this.currentIndex++;
  			}
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

  		_setSliderWidth: function () {
  			var SliderContainer, sliderContainerWidth;
  			SliderContainer = query('.esriPageSliderContainer')[0];
  			sliderContainerWidth = domStyle.get(query('.esriEditPageHeader')[0], "width") - domStyle.get(query('.esriEditPageOptionList')[0], "width") - domStyle.get(query('.esriAddNewPageDiv')[0], "width");
  			if (SliderContainer) {
  				if (sliderContainerWidth > 0) {
  					domStyle.set(SliderContainer, "width", sliderContainerWidth - 20 + 'px');
  				}
  				sliderContainerWidth = domStyle.get(SliderContainer, "width");
  				if (query('.esriPageSliderContent')[0]) {
  					if (sliderContainerWidth > 0) {
  						domStyle.set(query('.esriPageSliderContent')[0], "width", sliderContainerWidth - 80 + 'px');
  					}
  				}
  			}
  		},

  		_gotoPage: function (pageIndex) {
  			if (this.isNavigationEnabled) {
  				this.currentIndex = pageIndex;
  				this._slideBookPage();
  			}
  		}
  	});
  });