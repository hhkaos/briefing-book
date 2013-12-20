define([],function () {
		return {
				Books: [{
         		title: "Esri Briefing Book",
         		authorName: "Kevin Peterson",
         		CoverPage: {
         				layout: "coverPageLayout1",
         				columns: 2,
         				content: [
                  [
                     "title",         					// Book title
                     "subtitle",      					// Book subtitle
                     "author",        					// Author
                     "date",        						// Last updated date
                     "logo",        						// First Logo
                  ],
                  [
                     "bm-map1345762252"         // for map
                  ]
               ]
         		},
         		ContentPage: {
         				title: "Contents",
         				layout: "contentsWithMap", 		// based on selected layout
         				columns: 2,
         				content: [
                  [
                      "bm-mapcontent1345762252", //webmap
                      "bm-mapdesc123456789"
                  ],
                  [
                     "tc-345762236"              // the TOC will be auto generated
                  ]
               ]
         		},
         		BookPages: [
               {
               		layout: "mostlyText",
               		title: "Mostly Text Layout",
               		columns: 2,
               		content: [
                     [
                        "bm-1345762252",
                        "bm-1345762236"
                     ],
                     [
                        "bm-1345762237"
                     ]
                  ]
               },
               {
               		layout: "mostlyVisual",
               		title: "Mostly Visual Layout 1",
               		columns: 1,
               		content: [
                     [
                        "bm-1345762253",
                        "bm-1345762295",
									   ]
                  ]
               },
               {
               		layout: "mostlyVisual",
               		title: "Mostly Visual Layout 2",
               		columns: 2,
               		content: [
                     [
                        "bm-mapcontent1345762253",
                     ],
                     [
                        "bm-1345762589"
                     ]
                  ]
               },
               {
               		layout: "mostlyVisual",
               		title: "Mostly Visual Layout 3",
               		columns: 2,
               		content: [
                     [
                        "bm-1345762241",
                        "bm-1345762290"
                     ],
                     [
                        "bm-1345762251", //flicker

                     ]
                  ]
               }
            ]
         },
         {
         		title: "Book 1",
         		authorName: "Kevin Peterson"
         },
         {
         		title: "Book 2",
         		authorName: "Kevin Peterson"
         },
         {
         		title: "Book 3",
         		authorName: "Kevin Peterson"
         },
         {
         		title: "Book 4",
         		authorName: "Kevin Peterson"
         },
         {
         		title: "Book 5",
         		authorName: "Kevin Peterson"
         },
         {
         		title: "Book 6",
         		authorName: "Kevin Peterson"
         },
         {
         		title: "Book 7",
         		authorName: "Kevin Peterson"
         },
         {
         		title: "Book 8",
         		authorName: "Kevin Peterson"
         },
         {
         		title: "Book 9",
         		authorName: "Kevin Peterson"
         }
      ]
		}
});