define([

],
function () {
	return {
		Books: [
         {
         	title: "Esri Briefing Book",
         	author: "Kevin Peterson",
         	CoverPage: {
         		layout: "coverPageLayout",
         		columns: 2,
         		columnWidth: [60, 40],
         		content: [
								[
										"title",         										// Book title
										"cv-345762237",      						// Book subtitle
										"author",        									// Author
										"date",        										// Last updated date
										"cv-345762240"       						// First Logo
								],
								[
										"bm-map1345762252"
								]
         				]
         	},
         	ContentPage: {
         		title: "Contents",
         		layout: "contentsWithMap",
         		columns: 2,
         		columnWidth: [60, 40],
         		content: [
						  ["bm-mapcontent1345762252", "bm-mapdesc123456789"],
						  ["tc-345762236"]
         				]
         	},
         	BookPages: [
               {
               	layout: "mostlyText",
               	title: "Mostly Text Layout",
               	columns: 2,
               	columnWidth: [30, 70],
               	content: [
						  ["bm-1345762252", "bm-1345762236"],
						  ["bm-1345762237"]
               		]
               },
               {
               	layout: "mostlyVisual",
               	title: "Mostly Visual Layout 1",
               	columns: 1,
               	columnWidth: [100],
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
               	columnWidth: [40, 60],
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
               	columnWidth: [60, 40],
               	content: [
                     [
                        "bm-1345762241",
                        "bm-1345762290"
                     ],
                     [
                        "bm-1345762251",
                        "imageLastPage",
                        "imageLastPage1"

                     ]
               		]
               }
         		]
         }]
	};
});