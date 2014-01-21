define([],
function () {
	return {
		/*  appSetting contains application configuration */

		// Set application title
		ApplicationName: "Briefing Book Gallery",

		// Set application icon path
		ApplicationIcon: "",

		// Set application Favicon path
		ApplicationFavicon: "images/favicon.ico",

		// Set application mode. Set to false for Public interface. Set to true for Admin interface
		AuthoringMode: true,
		//false:      Public mode and true:      Editable mode

		/* module Defaults contains default settings for each and every module */

		/* cover page layout contains layout for index page*/
		CoverPageLayout: {
			title: "Briefing Book Title",
			Name: "coverPageLayout1",
			columns: 2,
			columnWidth: [50, 50],
			content: [
								 ["title", "text", "author", "logo"], []
						],
			type: "CoverPage"

		},
		/* content page layout contains layout for content page*/
		ContentPageLayouts: [
						 {
						 	Name: "contentsWithMap",
						 	columnWidth: [50, 50],
						 	columns: 2,
						 	templateIcon: "themes/images/contentLayout1.png",
						 	selectedTemplateIcon: "themes/images/contentLayout1-select.png",
						 	content: [
										["text", "TOC"], ["webmap"]
						 		],
						 	type: "ContentPage"
						 }, {
						 	Name: "contentsWithIntro",
						 	columns: 2,
						 	columnWidth: [50, 50],
						 	templateIcon: "themes/images/contentLayout2.png",
						 	selectedTemplateIcon: "themes/images/contentLayout2-select.png",
						 	content: [
										 ["webmap", "text"], ["TOC"]
						 		]
						 }, {
						 	Name: "contentsWithIntroAndMap",
						 	columns: 2,
						 	columnWidth: [50, 50],
						 	templateIcon: "themes/images/contentLayout3.png",
						 	selectedTemplateIcon: "themes/images/contentLayout3-select.png",
						 	content: [
										 ["TOC"],
										 ["text", "webmap"]
						 		]
						 }
				],
		/* book page layout contains layout for different pages of books */
		BookPageLayouts: [
							{
								Name: "mostlyVisual",
								columnWidth: [40, 60],
								columns: 2,
								templateIcon: "themes/images/temp1.png",
								selectedTemplateIcon: "themes/images/temp1-select.png",
								content: [
										["text"],
										["text"]
									]
							}, {
								Name: "mostlyText",
								columns: 2,
								columnWidth: [50, 50],
								templateIcon: "themes/images/temp2.png",
								selectedTemplateIcon: "themes/images/temp2-select.png",
								content: [
										 ["webmap", "text"],
										 ["text"]
									]
							}, {
								Name: "twoColumnText",
								columns: 1,
								columnWidth: [100],
								templateIcon: "themes/images/temp3.png",
								selectedTemplateIcon: "themes/images/temp3-select.png",
								content: [
										 ["text", "text"]
									]
							}, {
								Name: "dominantVisual",
								columns: 2,
								columnWidth: [30, 70],
								templateIcon: "themes/images/temp4.png",
								selectedTemplateIcon: "themes/images/temp4-select.png",
								content: [
										 ["text", "text"],
										 ["text"]
									]
							}
				],
		ModuleDefaultsConfig: {
			"webmap": {
				type: "webmap",
				title: "webmap title",
				caption: "The webmap caption",
				webmap: '',
				height: 230								// in pixel
			},
			"title": {
				type: "text",
				text: "Untitled",
				height: 30,
				uid: "title"								// in pixel
			},
			"text": {
				type: "text",
				text: "Summary",
				height: 40								// in pixel
			},
			"HTML": {
				type: "HTML",
				HTML: "<p>Add HTML text</p>",
				height: 100								// in pixel
			},
			"image": {
				type: "image",
				path: "",
				height: '',
				width: ''								// in pixel
			},
			"video": {
				type: "video",
				title: "video title",
				caption: "The video caption",
				provider: '',
				uid: '',
				height: 250							// in pixel
			},
			"flickr": {
				type: "flickr",
				title: '',
				caption: '',
				photoset_id: '',
				rows: 5,
				columns: 5,
				height: 250							// in pixel
			},
			"page": {
				title: "Untitled Page",
				shortTitle: "Untitled",
				cols: 2,
				height: ''							// in pixel
			},
			"logo": {
				type: "logo",
				path: "",
				height: 50							// in pixel
			},
			"TOC": {
				type: "TOC",
				height: 200							 // in pixel
			},
			"author": {
				text: "Author",
				type: "text",
				uid: "Author",
				height: 50
			}
		},
		DefaultModuleIcons: {
			"webmap": {
				type: "webmap",
				path: "themes/images/mapIcon.png"
			},
			"image": {
				type: "image",
				path: "themes/images/imageIcon.png"
			},
			"logo": {
				type: "logo",
				path: "themes/images/imageIcon.png"
			},
			"text": {
				type: "text",
				path: "themes/images/textIcon.png"
			},
			"HTML": {
				type: "HTML",
				path: "themes/images/htmlIcon.png"
			},
			"video": {
				type: "video",
				path: "themes/images/videoIcon.png"
			},
			"flickr": {
				type: "flickr",
				path: "themes/images/flickrIcon.png"
			}
		}
	};

});