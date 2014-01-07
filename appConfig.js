define([

],
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
				CoverPageLayouts: [
         {
         		Name: "coverPageLayout1",
         		NumberofColumns: 2,
         		columnWidth: [
               50,
               50
            ],
         		// in percentage
         		content: [
               {
               		modules: [
                     "html",
                     "text",
                     "text",
                     "text",
                     "image",
                     "image",
                     "image"
                  ],
               		height: [
                     20,
                     30,
                     10,
                     10,
                     20,
                     20,
                     20
                  ]                  // in pixel
               },
               {
               		modules: [
                     "webmap"
                  ],
               		height: [
                     50
                  ]                  // in pixel
               }
            ]
         }
      ],
				/* content page layout contains layout for content page*/
				ContentPageLayouts: [
         {
         		Name: "contentsWithMap",
         		//contentsWithMAp
         		NumberofColumns: 2,
         		columnWidth: [
               35,
               65
            ],
         		// in pixel
         		content: [
               {
               		modules: [
                     "text",
                     "text"
                  ],
               		height: [
                     10,
                     40
                  ]                  // in pixel
               },
               {
               		modules: [
                     "TOC"
                  ],
               		height: [
                     70
                  ]                  // in pixel
               }
            ]
         },
         {
         		Name: "contentsWithIntro",
         		//contentsWithIntro
         		NumberofColumns: 2,
         		columnWidth: [
               40,
               60
            ], 					         	// in pixel
         		content: [
               {
               		modules: [
                     "text",
                     "TOC"
                  ],
               		height: [
                     20,
                     60
                  ]                  // in pixel
               },
               {
               		modules: [
                     "text",
                     "text"
                  ],
               		height: [
                     20,
                     60
                  ]                  // in pixel
               }
            ]
         },
         {
         		Name: "contentsWithIntroAndMap",
         		//contentsWithIntroAndMap
         		NumberofColumns: 2,
         		columnWidth: [
               40,
               60
            ], 					         		// in pixel
         		content: [
               {
               		modules: [
                     "text",
                     "webmap",
                     "text"
                  ],
               		height: [
                     10,
                     30,
                     40
                  ]                  // in pixel
               },
               {
               		modules: [
                     "TOC"
                  ],
               		height: [
                     50
                  ]                  // in pixel
               }
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
         },
         {
         		Name: "mostlyText",
         		columns: 2,
         		columnWidth: [50, 50],
         		templateIcon: "themes/images/temp2.png",
         		selectedTemplateIcon: "themes/images/temp2-select.png",
         		content: [
               ["webmap", "text"],
               ["text"]
            ]
         },
         {
         		Name: "twoColumnText",
         		columns: 1,
         		columnWidth: [100],
         		templateIcon: "themes/images/temp3.png",
         		selectedTemplateIcon: "themes/images/temp3-select.png",
         		content: [
               ["text", "text"]
            ]
         },
         {
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
								webmap_id: "8a567ebac15748d39a747649a2e86cf4",
								height: 230								// in pixel
						},
						"text": {
								type: "text",
								text: "Untitled",
								height: 20								// in pixel
						},
						"html": {
								type: "html",
								html: "",
								height: ''								// in pixel
						},
						"image": {
								type: "image",
								path: "",
								height: '',
								width:'',								// in pixel
						},
						"video": {
								type: "video",
								title: "video title",
								caption: "The video caption",
								provider: "youtube",
								uid: "Xujhimh5eWs",
								height: 250							// in pixel
						},
						"flickr": {
								type: "flickr",
								title: "photoset title",
								caption: "The photoset caption",
								photoset_id: "72157627065236829",
								rows:5,
								columns:5,
								height: 250
						},
						"page": {
								title: "Untitled Page",
								shortTitle: "Untitled",
								cols: 2,
								height: ''            // in pixel
						},
						"logo": {
								type: "logo",
								path: '',
								height: ''            // in pixel
						},
						"TOC": {
								height: ''            // in pixel
						}
				},
				AppHeaderWidgets: [

      ]
		}
});