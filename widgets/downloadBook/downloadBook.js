define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/dom-attr",
    "dojo/dom-style",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/on",
    "dojo/query",
    "dojo/topic",
	"esri/tasks/Geoprocessor",
    "dojo/i18n!nls/localizedStrings"
	],
    function (declare, domConstruct, lang, array, domAttr, domStyle, dom, domClass, on, query, topic, Geoprocessor, nls) {
    	return declare([], {
    		_createConfigFiles: function () {
    			var bookList, moduleData, preText, postText, gpService, inputParams;
    			preText = "define([],\n function () {\n\treturn Books:[";
    			postText = ";\n]});";
    			bookList = preText + JSON.stringify(dojo.bookListData.Books, null, "\t") + postText;
    			moduleData = preText + JSON.stringify(dojo.moduleData, null, "\t") + postText;
    			inputParams = [{ name: 'moduleData.js', content: moduleData },
					            { name: 'bookList.js', content: bookList }
					];
    			this._download_zip(inputParams);

    		},

    		_download_zip: function (files, content) {
    			files = (content && dojo.isString(files) && [{ name: files, content: content}]) || dojo.isObject(files) && files || dojo.isArray(files) && files;
    			var zip = new JSZip();
    			for (var i = 0, len = files.length; i < len; i++) {
    				var file = files[i];
    				var content = file.content;
    				if (dojo.isObject(content)) {
    					file.content = JSON.stringify(content, null, "\t");
    				}
    				zip.add(file.name, file.content);
    			}
    			content = zip.generate();
    			location.href = "data:application/zip;base64," + content
    		}
    	});
    });