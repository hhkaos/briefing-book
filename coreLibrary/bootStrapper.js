/*global require, document */
/*jslint sloppy:true */
/** @license
| Version 10.2
| Copyright 2013 Esri
|
| Licensed under the Apache License, Version 2.0 (the "License");
| you may not use this file except in compliance with the License.
| You may obtain a copy of the License at
|
|    http://www.apache.org/licenses/LICENSE-2.0
|
| Unless required by applicable law or agreed to in writing, software
| distributed under the License is distributed on an "AS IS" BASIS,
| WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
| See the License for the specific language governing permissions and
| limitations under the License.
*/
//============================================================================================================================//

require([
	"coreLibrary/widgetLoader",
	"application/config",
	"widgets/alertDialog/alertDialog",
	"esri/config",
	"esri/arcgis/utils",
	"dojo/domReady!"
], function (widgetLoader, config, alertBox, esriConfig, arcgisUtils, domReady) {

	//========================================================================================================================//

	try {

		/**
		* load application configuration settings from configuration file
		* create an object of widget loader class
		*/
		dojo.appConfigData = config;
		dojo.bookInfo = [];
		esriConfig.defaults.io.proxyUrl = dojoConfig.baseURL + dojo.appConfigData.ProxyURL;
		esriConfig.defaults.io.alwaysUseProxy = false;
		esriConfig.defaults.io.corsDetection = true;
		esriConfig.defaults.io.corsEnabledServers.push(dojo.appConfigData.PortalURL);
		esriConfig.defaults.io.timeout = 600000;
		arcgisUtils.arcgisUrl = dojo.appConfigData.PortalURL + '/sharing/content/items';
		var applicationWidgetLoader = new widgetLoader();
		applicationWidgetLoader.startup();
	} catch (ex) {
		this.alertDialog = new alertBox();
		this.alertDialog._setContent(ex.message, 0);
	}
});