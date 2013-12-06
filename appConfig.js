define([], function () {
    return {

        /*  appSetting contains application configuration */

        // Set application title
        ApplicationName: "Map Book Gallery",

        // Set application icon path
        ApplicationIcon: "",

        // Set application Favicon path
        ApplicationFavicon: "images/favicon.ico",

        // Set application mode. Set to false for Public interface. Set to true for Admin interface
        AuthoringMode: "false",  //false : Public mode and true : Editable mode

        /* module Defaults contains default settings for each and every module */

        /* cover page layout contains layout for index page*/
        CoverPageLayouts: [
{
    Name: "coverPageLayout1",
    NumberofColumns: 2,
    ColumnWidths: [50, 50], // in percetage
    content: [
				{
				    modules: ["html", "text", "text", "text", "image", "image", "image"],
				    height: [20, 30, 10, 10, 20, 20, 20] // in pixel
				},
				{
				    modules: ["webmap"],
				    height: [50] // in pixel
				}
			]
}
],
        /* content page layout contains layout for content page*/
        ContentPageLayouts: [
{
    Name: "contentsWithMap", //contentsWithMAp
    NumberofColumns: 2,
    ColumnWidths: [35, 65], // in pixel
    content: [
				{
				    modules: ["text", "webmap"],
				    height: [10, 40] // in pixel
				},
				{
				    modules: ["TOC"],
				    height: [70] // in pixel
				}
			]
},
{
    Name: "contentsWithIntro", //contentsWithIntro
    NumberofColumns: 2,
    ColumnWidths: [40, 60], // in pixel
    content: [
				{
				    modules: ["text", "TOC"],
				    height: [20, 60] // in pixel
				},
				{
				    modules: ["text", "text"],
				    height: [20, 60] // in pixel
				}
			]
},
{
    Name: "contentsWithIntroAndMap", //contentsWithIntroAndMap
    NumberofColumns: 2,
    ColumnWidths: [40, 60], // in pixel
    content: [
				{
				    modules: ["text", "webmap", "text"],
				    height: [10, 30, 40] // in pixel
				},
				{
				    modules: ["TOC"],
				    height: [50] // in pixel
				}
			]
}
],

        /* book page layout contains layout for diffrent pages of books */
        BookPageLayouts: [
	{
	    Name: "mostlyVisual", //"MostlyVisual"
	    NumberofColumns: 2,
	    ColumnWidths: [40, 60], // in pixel
	    content: [
				{
				    modules: ["text"],
				    height: [60] // in pixel
				},
				{
				    modules: ["webmap"],
				    height: [60] // in pixel
				}
			]
	},
{
    Name: "mostlyText",
    NumberofColumns: 2,
    ColumnWidths: [40, 60], // in pixel
    content: [
				{
				    modules: ["webmap"],
				    height: [40] // in pixel
				},
				{
				    modules: ["text"],
				    height: [80] // in pixel
				}
			]
},
{
    Name: "twoColumnText",
    NumberofColumns: 1,
    ColumnWidths: [100], // in percentage
    content: [
				{
				    modules: ["webmap", "text"],
				    height: [60, 20] // in pixel
				}
			]
},
{
    Name: "dominantVisual",
    NumberofColumns: 1,
    ColumnWidths: [100], // in pixel
    content: [
				{
				    modules: ["webmap", "text"],
				    height: [60, 20] // in pixel
				}
			]
}
],


        ModuleDefaultsConfig: {
            "webmap": {
                type: "webmap",
                title: "webmap title",
                caption: "The webmap caption",
                webmap_id: "8a567ebac15748d39a747649a2e86cf4",
                height: 75 // in pixel
            },
            "text": {
                type: "text",
                text: "",
                height: 20 // in pixel
            },
            "html": {
                type: "html",
                html: "",
                height: ''// in pixel
            },
            "image": {
                type: "image",
                title: "image title",
                caption: "The image caption",
                src: "http://",
                height: ''// in pixel
            },
            "video": {
                type: "video",
                title: "video title",
                caption: "The video caption",
                provider: "youtube",
                id: "Xujhimh5eWs",
                height: 250 // in pixel
            },
            "flickr": {
                type: "flickr",
                title: "photoset title",
                caption: "The photoset caption",
                photoset_id: "72157627065236829",
                height: 250
            },
            "page": {
                title: "Untitled Page",
                shortTitle: "Untitled",
                cols: 2,
                height: '' // in pixel

            },
            "TOC": {
                height: '' // in pixel
            }
        },

        AppHeaderWidgets: [
    ]
    }
});
