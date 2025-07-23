const fs = require("fs");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  VerticalAlign,
  WidthType,
  ExternalHyperlink,
  InternalHyperlink,
  BorderStyle,
  AlignmentType,
  ShadingType,
  TableLayoutType,
} = require("docx");

const docxFileName = "example.docx";

async function makeDoc(filePath) {
  let children = [];

  try {
    // Check if file exists
    await fs.promises.access(filePath);
    // console.log("File exists, but docx library creates new docs only");
  } catch (error) {
    if (error.code === "ENOENT") {
      // console.log("Created new document.");
    } else {
      throw new Error(`Error checking file: ${error.message}`);
    }
  }

  // Return object with children array that we'll build up
  return {
    children: children,
    _createDocument: function () {
      return new Document({
        sections: [
          {
            properties: {},
            children: this.children,
          },
        ],
      });
    },
  };
}

// Add text paragraph to document
function writeText(doc, text) {
  const paragraph = new Paragraph({
    children: [
      new TextRun({
        text: text,
      }),
    ],
  });

  // Add to children array
  doc.children.push(paragraph);
  return doc;
}

// Add heading to document
function writeHeading(
  doc,
  options = {},
  extras = {},
  indent = {},
  bullet = {},
  bookmark = null,
  alignment = AlignmentType.LEFT
) {
  let paragraphConf = {
    children: [new TextRun(options)],
    spacing: extras,
    indent: indent,
    alignment:alignment
    
  };
  if (Object.keys(bookmark).length > 0) {
    paragraphConf.bookmark = bookmark;
    paragraphConf.heading = HeadingLevel.HEADING_1;
  }
  if (Object.keys(bullet).length > 0) {
    paragraphConf.bullet = bullet;
  }
  const heading = new Paragraph(paragraphConf);

  // console.log("Adding heading to children array");
  doc.children.push(heading);
  return doc;
}

// Add image to document
async function addImage(doc, filePath, transformation = {}) {

  const{
    width= 600, // 6 inches * 72 DPI = 432 pixels
    height= 400, // 4 inches * 72 DPI = 288 pixels
  }=transformation
  try {
    // Read image file
    const imageBuffer = await fs.promises.readFile(filePath);

    // Create image run
    const imageRun = new ImageRun({
      data: imageBuffer,
      transformation:{height,width},
    });

    // Create paragraph with image
    const imageParagraph = new Paragraph({
      children: [imageRun],
    });

    doc.children.push(imageParagraph);
    // console.log("Image added successfully with size set");

    return doc;
  } catch (error) {
    throw new Error(`Failed to add image: ${error.message}`);
  }
}



function writeHeadingWithLinks(doc, heading, links = [], options = {}) {
  const { size = 24, indent = 50, headingSpace = 10 } = options;

  // Create children array starting with the heading
  const children = [
    new TextRun({
      text: heading,
      size,
      font: "Dm Sans",
      bold: true,
    }),

    new TextRun({
      text: " ", // Additional space
      size: headingSpace, // Use headingSpace option to control space width
    })
  ];

  // Add each link as a hyperlink
  links.forEach((item, index) => {
    children.push(
      new ExternalHyperlink({
        link: item.url,
        children: [
          new TextRun({
            text: item.title,
            style: "Hyperlink",
            size,
            font: "Dm Sans",
            bold: false,
          }),
        ],
      })
    );

    // Add separator between links (except after last one)
    if (index < links.length - 1) {
      children.push(
        new TextRun({
          text: ", ", // Comma with space separator
          size,
          font: "Dm Sans",
        })
      );
    }
  });

  const paragraph = new Paragraph({
    indent: { left: indent },
    children: children,
  });

  doc.children.push(paragraph);
}

function writeHyperlink(doc, displayText, url, options = {}) {
  const { size = 16, extras = "" } = options;

  const hyperlink = new ExternalHyperlink({
    link: url,
    children: [
      new TextRun({
        text: displayText,
        style: "Hyperlink",
        size,
        font: "Arial",
        bold: true,
      }),
    ],
  });

  const paragraph = new Paragraph({
    children: [
      hyperlink,
      new TextRun({
        text: extras,
        size: 22,
        font: "Arial",
        bold: false,
      }),
    ],
  });

  doc.children.push(paragraph);
}

function addTableInDoc(doc, headers, data, styleOptions = {}) {
  const {
    headerBgColor = "4472C4", // Default blue
    headerTextColor = "FFFFFF", // Default white
    dataTextColor = "000000", // Default black
  } = styleOptions;


  console.log("their coming")
  console.log(headers)
  console.log(data)
  // Define column widths in percentage (will be converted to TWIPs)
  const columnWidths = styleOptions.columnWidths || {
    Keyword: 25, // 25%
    Volume: 15, // 15%
    "Current position": 15, // 15%
    "Difficulty (0-100)": 15, // 15%
    "Ranking Page": 30, // 30%
  };

  // Standard page width is about 12240 TWIPs (8.5 inches)
  // Using 10000 TWIPs (~6.94 inches) to account for margins
  const totalWidth = 9000;
  const tableRows = [];

  // Create header row
  const headerRow = new TableRow({
    children: headers.map((header) => {
      const widthPercentage = columnWidths[header] || 20; // Default to 20% if not specified
      const widthInTwips = Math.round(totalWidth * (widthPercentage / 100));

      return new TableCell({
        width: {
          size: widthInTwips,
          type: WidthType.DXA, // Use DXA (twips) for compatibility
        },
        verticalAlign: VerticalAlign.CENTER,
        shading: {
          type: ShadingType.CLEAR,
          color: "auto",
          fill: headerBgColor,
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: header,
                bold: true,
                color: headerTextColor,
                font:  "Arial",
                size :  20
                
              }),
            ],
          }),
        ],
      });
    }),
  });

  tableRows.push(headerRow);

  // Create data rows
  for (const row of data) {

    const tableRow = new TableRow({
      children: headers.map((key) => {
        const value = row[key] ?? "";
        const widthPercentage = columnWidths[key] || 20;
        const widthInTwips = Math.round(totalWidth * (widthPercentage / 100));

        let paragraph;

        if (
          typeof value === "string" &&
          value.startsWith("http")
        ) {
          paragraph = new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new ExternalHyperlink({
                link: value,
                children: [
                  new TextRun({
                    text:
                      value.length > 50
                        ? value.substring(0, 47) + "..."
                        : value,
                    style: "Hyperlink",
                    font:  "Arial",
                    size :  22 
                  }),
                ],
              }),
            ],
          });
        } else {
          paragraph = new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: String(value),
                color: dataTextColor,
                font:  "Arial",
                size :  22
              }),
            ],
          });
        }

        return new TableCell({
          width: {
            size: widthInTwips,
            type: WidthType.DXA,
          },

          verticalAlign: VerticalAlign.CENTER,
          children: [paragraph],
        });
      }),
    });

    tableRows.push(tableRow);
  }


  const table = new Table({
    width: {
      size: totalWidth,
      type: WidthType.DXA, // Use absolute width in TWIPS
    },
    columnWidths: headers.map((header) => {
      const widthPercentage = columnWidths[header] || 20;
      return Math.round(totalWidth * (widthPercentage / 100));
    }),
    rows: tableRows,
  });

  doc.children.push(table);
  return doc;
}


async function addPriority(doc, status = "", title = "") {
  const bgColor = "E8F3FF";

  const allStatusLabels = [
    { text: "▲High Priority", key: "high", bg: "FFCFC9", color: "B10202" },
    { text: "►Medium Priority", key: "medium", bg: "FFE5A0", color: "473821" },
    { text: "▼Low Priority", key: "low", bg: "BFE1F6", color: "0A53A8" },
  ];

  // Determine which statuses to show
  let selectedStatuses;
  
  if (status && status.trim()) {
    const statusKey = status.trim().toLowerCase();
    const matchingStatus = allStatusLabels.find(s => s.key === statusKey);
    if (matchingStatus) {
      selectedStatuses = [matchingStatus]; // Show only matching status
    } else {
      selectedStatuses = allStatusLabels; // Show all if no match
    }
  } else {
    selectedStatuses = allStatusLabels; // Show all if status is empty
  }

  const totalStatusCount = selectedStatuses.length;

  // Always keep main column widths consistent - title takes more space, status area on right
  const mainColumWidth = [6000, 3000];

  // Generate status cells
  const statusCells = selectedStatuses.map((s) => {
    return new TableCell({
      shading: {
        type: ShadingType.CLEAR,
        color: "auto",
        fill: s.bg,
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: s.bg },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: s.bg },
        left: { style: BorderStyle.SINGLE, size: 1, color: s.bg },
        right: { style: BorderStyle.SINGLE, size: 1, color: s.bg },
      },
      margins: {
        top: 100,
        bottom: 100,
        left: 150,
        right: 150,
      },
      verticalAlign: VerticalAlign.CENTER,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: s.text,
              bold: true,
              size: 18,
              color: s.color,
              font: "DM Sans",
            }),
          ],
        }),
      ],
    });
  });

  // Create status table based on count
  let statusTable;
  
  if (totalStatusCount === 1) {
    // Single status - horizontal layout
    statusTable = new Table({
      width: { size: 2800, type: WidthType.DXA },
      columnWidths: [2800],
      rows: [new TableRow({ children: statusCells })],
      layout: TableLayoutType.FIXED,
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      },
    });
  } else {
    // Multiple statuses - vertical layout (column format)
    const statusRows = selectedStatuses.map((s) => {
      return new TableRow({
        children: [
          new TableCell({
            shading: {
              type: ShadingType.CLEAR,
              color: "auto",
              fill: s.bg,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: s.bg },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: s.bg },
              left: { style: BorderStyle.SINGLE, size: 1, color: s.bg },
              right: { style: BorderStyle.SINGLE, size: 1, color: s.bg },
            },
            margins: {
              top: 100,
              bottom: 100,
              left: 150,
              right: 150,
            },
            width: { size: 2800, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: s.text,
                    bold: true,
                    size: 18,
                    color: s.color,
                    font: "DM Sans",
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    });

    statusTable = new Table({
      width: { size: 2800, type: WidthType.DXA },
      columnWidths: [2800],
      rows: statusRows,
      layout: TableLayoutType.FIXED,
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      },
    });
  }

  // Main table with title + status
  const mainTable = new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: mainColumWidth,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: {
              type: ShadingType.CLEAR,
              color: "auto",
              fill: bgColor,
            },
            width: { size: 6000, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: bgColor },
              bottom: { style: BorderStyle.NONE, size: 0, color: bgColor },
              left: { style: BorderStyle.NONE, size: 0, color: bgColor },
              right: { style: BorderStyle.NONE, size: 0, color: bgColor },
            },
            margins: {
              top: 200,
              bottom: 200,
              left: 200,
              right: 200,
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    color: "2C91E6",
                    size: 22,
                    font: "DM Sans",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            shading: {
              type: ShadingType.CLEAR,
              color: "auto",
              fill: bgColor,
            },
            width: { size: 3000, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: bgColor },
              bottom: { style: BorderStyle.NONE, size: 0, color: bgColor },
              left: { style: BorderStyle.NONE, size: 0, color: bgColor },
              right: { style: BorderStyle.NONE, size: 0, color: bgColor },
            },
            margins: {
              top: 200,
              bottom: 200,
              left: 100,
              right: 100,
            },
            children: [statusTable],
          }),
        ],
      }),
    ],
  });

  doc.children.push(mainTable);
  return doc;
}



// async function createDashboardTable(doc, optimizationScore = 46.7, currentWordCount = 1482, targetWordCount = 1683, pageSections = 19) {
//   // Calculate progress percentage for word count
//   const wordCountProgress = Math.min((currentWordCount / targetWordCount) * 100, 100);
  
//   // Define colors
//   const cardBgColor = "FFFFFF";
//   const primaryColor = "3B82F6";
//   const redColor = "EF4444";
//   const greenColor = "10B981";
//   const grayColor = "6B7280";
//   const lightGray = "F8FAFC";
//   const tableBgColor = "F3F3F3";

//   // Create individual dashboard cards as separate table cells
//   const dashboardCards = [
//     // Content Brief Optimization Score Card
//     new TableCell({
//       width: { size: 2500, type: WidthType.DXA },
//       margins: { top: 200, bottom: 200, left: 200, right: 200 },
//       shading: {
//         type: ShadingType.CLEAR,
//         color: "auto",
//         fill: cardBgColor,
//       },
//       borders: {
//         top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
//         bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
//         left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
//         right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
//       },
//       children: [
//         new Paragraph({
//           alignment: AlignmentType.LEFT,
//           children: [
//             new TextRun({
//               text: "Content Brief",
//               bold: true,
//               size: 18,
//               color: "334155",
//               font: "DM Sans",
//             }),
//           ],
//         }),
//         new Paragraph({
//           alignment: AlignmentType.LEFT,
//           children: [
//             new TextRun({
//               text: "Optimization Score ⓘ",
//               bold: true,
//               size: 18,
//               color: "334155",
//               font: "DM Sans",
//             }),
//           ],
//         }),
//         new Paragraph({
//           alignment: AlignmentType.CENTER,
//           spacing: { before: 400, after: 200 },
//           children: [
//             new TextRun({
//               text: optimizationScore.toString(),
//               bold: true,
//               size: 60,
//               color: redColor,
//               font: "DM Sans",
//             }),
//           ],
//         }),
//         new Paragraph({
//           alignment: AlignmentType.LEFT,
//           spacing: { before: 200 },
//           children: [
//             new TextRun({
//               text: "Consider over-optimization ⚠️",
//               size: 16,
//               color: "F59E0B",
//               font: "DM Sans",
//             }),
//           ],
//         }),
//         new Paragraph({
//           alignment: AlignmentType.LEFT,
//           children: [
//             new TextRun({
//               text: "🔘 Off",
//               size: 16,
//               color: grayColor,
//               font: "DM Sans",
//             }),
//           ],
//         }),
//       ],
//     }),
//     // Current Word Count Card
//     new TableCell({
//       width: { size: 2500, type: WidthType.DXA },
//       margins: { top: 200, bottom: 200, left: 200, right: 200 },
//       shading: {
//         type: ShadingType.CLEAR,
//         color: "auto",
//         fill: cardBgColor,
//       },
//       borders: {
//         top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
//         bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
//         left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
//         right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
//       },
//       children: [
//         new Paragraph({
//           alignment: AlignmentType.LEFT,
//           children: [
//             new TextRun({
//               text: "Current Word",
//               bold: true,
//               size: 18,
//               color: "334155",
//               font: "DM Sans",
//             }),
//           ],
//         }),
//         new Paragraph({
//           alignment: AlignmentType.LEFT,
//           children: [
//             new TextRun({
//               text: "Count",
//               bold: true,
//               size: 18,
//               color: "334155",
//               font: "DM Sans",
//             }),
//           ],
//         }),
//         new Paragraph({
//           alignment: AlignmentType.CENTER,
//           spacing: { before: 400, after: 200 },
//           children: [
//             new TextRun({
//               text: currentWordCount.toString(),
//               bold: true,
//               size: 60,
//               color: primaryColor,
//               font: "DM Sans",
//             }),
//           ],
//         }),
//         new Paragraph({
//           alignment: AlignmentType.CENTER,
//           children: [
//             new TextRun({
//               text: `Target: ${targetWordCount}`,
//               size: 16,
//               color: grayColor,
//               font: "DM Sans",
//             }),
//           ],
//         }),
//         new Paragraph({
//           alignment: AlignmentType.CENTER,
//           spacing: { before: 200 },
//           children: [
//             new TextRun({
//               text: "━━━━━━━━━━━━━━━━",
//               size: 16,
//               color: greenColor,
//               font: "DM Sans",
//             }),
//           ],
//         }),
//         new Paragraph({
//           alignment: AlignmentType.LEFT,
//           spacing: { before: 200 },
//           children: [
//             new TextRun({
//               text: "Custom word count 🔘",
//               size: 16,
//               color: grayColor,
//               font: "DM Sans",
//             }),
//           ],
//         }),
//       ],
//     }),
//     // Page Sections Card
//     new TableCell({
//       width: { size: 2500, type: WidthType.DXA },
//       margins: { top: 200, bottom: 200, left: 200, right: 200 },
//       shading: {
//         type: ShadingType.CLEAR,
//         color: "auto",
//         fill: cardBgColor,
//       },
//       borders: {
//         top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
//         bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
//         left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
//         right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
//       },
//       children: [
//         new Paragraph({
//           alignment: AlignmentType.LEFT,
//           children: [
//             new TextRun({
//               text: "Page",
//               bold: true,
//               size: 18,
//               color: "334155",
//               font: "DM Sans",
//             }),
//           ],
//         }),
//         new Paragraph({
//           alignment: AlignmentType.LEFT,
//           children: [
//             new TextRun({
//               text: "Sections ⓘ",
//               bold: true,
//               size: 18,
//               color: "334155",
//               font: "DM Sans",
//             }),
//           ],
//         }),
//         new Paragraph({
//           alignment: AlignmentType.CENTER,
//           spacing: { before: 400, after: 200 },
//           children: [
//             new TextRun({
//               text: pageSections.toString(),
//               bold: true,
//               size: 60,
//               color: primaryColor,
//               font: "DM Sans",
//             }),
//           ],
//         }),
//         new Paragraph({
//           alignment: AlignmentType.CENTER,
//           children: [
//             new TextRun({
//               text: "sections recommended",
//               size: 16,
//               color: primaryColor,
//               font: "DM Sans",
//             }),
//           ],
//         }),
//         new Paragraph({
//           alignment: AlignmentType.LEFT,
//           spacing: { before: 200 },
//           children: [
//             new TextRun({
//               text: `On this page: use around ${pageSections}`,
//               size: 16,
//               color: grayColor,
//               font: "DM Sans",
//             }),
//           ],
//         }),
//         new Paragraph({
//           alignment: AlignmentType.LEFT,
//           children: [
//             new TextRun({
//               text: "page sections.",
//               size: 16,
//               color: grayColor,
//               font: "DM Sans",
//             }),
//           ],
//         }),
//       ],
//     }),
//   ];

//   // Create inner table row with dashboard cards
//   const innerDashboardRow = new TableRow({
//     children: dashboardCards,
//   });

//   // Create nested table for dashboard cards
//   const nestedDashboardTable = new Table({
//     width: { size: 7500, type: WidthType.DXA }, // 3 cells × 2500 = 7500
//     columnWidths: [2500, 2500, 2500],
//     rows: [innerDashboardRow],
//     layout: TableLayoutType.FIXED,
//     borders: {
//       top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
//       bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
//       left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
//       right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
//       insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
//       insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
//     },
//   });

//   // Create outer table row containing the nested table
//   const dashboardRow = new TableRow({
//     children: [
//       new TableCell({
//         width: { size: 9000, type: WidthType.DXA },
//         margins: { top: 200, bottom: 200, left: 200, right: 200 },
//         shading: {
//           type: ShadingType.CLEAR,
//           color: "auto",
//           fill: tableBgColor,
//         },
//         children: [nestedDashboardTable],
//       }),
//     ],
//   });

//   // Main outer table
//   const table = new Table({
//     width: { size: 9000, type: WidthType.DXA },
//     columnWidths: [9000],
//     rows: [dashboardRow],
//     layout: TableLayoutType.FIXED,
//     borders: {
//       top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
//       bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
//       left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
//       right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
//       insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
//       insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
//     },
//   });

//   // Add title paragraph and table to document
//   doc.children.push(
//     new Paragraph({
//       alignment: AlignmentType.CENTER,
//       spacing: { after: 400 },
//       children: [
//         new TextRun({
//           text: "Content Optimization Dashboard",
//           bold: true,
//           size: 32,
//           color: "1F2937",
//           font: "DM Sans",
//         }),
//       ],
//     })
//   );

//   doc.children.push(table);
//   return doc;
// }

async function createDashboardTable(doc, optimizationScore = 46.7, currentWordCount = 1482, targetWordCount = 1683, pageSections = 19) {
  // Calculate progress percentage for word count
  const wordCountProgress = Math.min((currentWordCount / targetWordCount) * 100, 100);
  
  // Define colors
  const cardBgColor = "FFFFFF";
  const primaryColor = "3B82F6";
  const redColor = "EF4444";
  const greenColor = "10B981";
  const grayColor = "6B7280";
  const lightGray = "F8FAFC";

  // Create individual dashboard cards as table cells
  const dashboardCards = [
    // Content Brief Optimization Score Card
    new TableCell({
      width: { size: 4500, type: WidthType.DXA },
      margins: { top: 200, bottom: 200, left: 200, right: 200 },
      shading: {
        type: ShadingType.CLEAR,
        color: "auto",
        fill: cardBgColor,
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: "Content Brief",
              bold: true,
              size: 18,
              color: "334155",
              font: "DM Sans",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: "Optimization Score ",
              bold: true,
              size: 18,
              color: "334155",
              font: "DM Sans",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
          children: [
            new TextRun({
              text: optimizationScore.toString(),
              bold: true,
              size: 60,
              color: redColor,
              font: "DM Sans",
            }),
          ],
        }),

      ],
    }),
    // Current Word Count Card
    new TableCell({
      width: { size: 4500, type: WidthType.DXA },
      margins: { top: 200, bottom: 200, left: 200, right: 200 },
      shading: {
        type: ShadingType.CLEAR,
        color: "auto",
        fill: cardBgColor,
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: "Current Word",
              bold: true,
              size: 18,
              color: "334155",
              font: "DM Sans",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: "Count",
              bold: true,
              size: 18,
              color: "334155",
              font: "DM Sans",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
          children: [
            new TextRun({
              text: currentWordCount.toString(),
              bold: true,
              size: 60,
              color: primaryColor,
              font: "DM Sans",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `Target: ${targetWordCount}`,
              size: 16,
              color: grayColor,
              font: "DM Sans",
            }),
          ],
        }),

      ],
    }),
    // Page Sections Card
    // new TableCell({
    //   width: { size: 3000, type: WidthType.DXA },
    //   margins: { top: 200, bottom: 200, left: 200, right: 200 },
    //   shading: {
    //     type: ShadingType.CLEAR,
    //     color: "auto",
    //     fill: cardBgColor,
    //   },
    //   borders: {
    //     top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
    //     bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
    //     left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
    //     right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
    //   },
    //   children: [
    //     new Paragraph({
    //       alignment: AlignmentType.LEFT,
    //       children: [
    //         new TextRun({
    //           text: "Page",
    //           bold: true,
    //           size: 18,
    //           color: "334155",
    //           font: "DM Sans",
    //         }),
    //       ],
    //     }),
    //     new Paragraph({
    //       alignment: AlignmentType.LEFT,
    //       children: [
    //         new TextRun({
    //           text: "Sections ",
    //           bold: true,
    //           size: 18,
    //           color: "334155",
    //           font: "DM Sans",
    //         }),
    //       ],
    //     }),
    //     new Paragraph({
    //       alignment: AlignmentType.CENTER,
    //       spacing: { before: 400, after: 200 },
    //       children: [
    //         new TextRun({
    //           text: pageSections.toString(),
    //           bold: true,
    //           size: 60,
    //           color: primaryColor,
    //           font: "DM Sans",
    //         }),
    //       ],
    //     }),
    //     new Paragraph({
    //       alignment: AlignmentType.CENTER,
    //       children: [
    //         new TextRun({
    //           text: "sections recommended",
    //           size: 16,
    //           color: primaryColor,
    //           font: "DM Sans",
    //         }),
    //       ],
    //     }),
     
    //   ],
    // }),
  ];

  // Create table row with dashboard cards
  const dashboardRow = new TableRow({
    children: dashboardCards,
  });

  // Create main table without nested structure
  const table = new Table({
    width: { size: 9000, type: WidthType.DXA }, // Total width 9000
    columnWidths: [4500, 4500], // Each column gets equal width (9000/3 = 3000)
    rows: [dashboardRow],
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
  });



  doc.children.push(table);
  return doc;
}
async function addDiagnose(doc, status = "need to work", bullet = []) {
  const allStatuses = [
    { text: "Need to work",key:'Need to work', color: "FF0000", fill: "FCE4E4" },
    { text: "Good", key:"Good", color: "00AA00", fill: "E3FCE4" },
    { text: "Opportunity", key:"Opportunity", color: "FFAB3B", fill: "FFF3E0" },
  ];

  // console.log(status)
  const selectedStatuses =
  ["Need to work", "Good", "Opportunity"].includes(status.trim())
    ? allStatuses.filter(s => s.key === status.trim())
    : allStatuses;


  const tableBgColor = "F3F3F3";

  // Create inner table cells for status (each taking 2500 width)
  const innerStatusCells = selectedStatuses.map((s) =>
    new TableCell({
      width: { size: 2500, type: WidthType.DXA },
      margins: { top: 100, bottom:100, left: 100, right: 100 },
      shading: {
        type: ShadingType.CLEAR,
        color: "auto",
        fill: s.fill, // Use individual status fill color
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: s.text,
              bold: true,
              color: s.color,
              font: "DM Sans",
              size: 20,
            }),
          ],
        }),
      ],
    })
  );

  // Create inner table row with status cells
  const innerStatusRow = new TableRow({
    children: innerStatusCells,
  });

  // Create nested table for statuses
  const nestedStatusTable = new Table({
    width: { size: 7500, type: WidthType.DXA }, // 3 cells × 2500 = 7500
    columnWidths: [2500, 2500, 2500],
    rows: [innerStatusRow],
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
  });

  // Create outer table row containing the nested table
  const statusRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 9000, type: WidthType.DXA },
        margins: { top: 200, bottom: 0, left: 200, right: 200 },
        shading: {
          type: ShadingType.CLEAR,
          color: "auto",
          fill: tableBgColor,
        },
        children: [nestedStatusTable],
      }),
    ],
  });

  // Bullet points row
  const bulletParagraphs = bullet.map((item) =>
    new Paragraph({
      bullet: { level: 0 },
      children: [
        new TextRun({
          text: item,
          font: "DM Sans",
          size: 20,
        }),
      ],
    })
  );

  const bulletRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 9000, type: WidthType.DXA },
        margins: { top: 0, bottom: 200, left: 200, right: 200 },
        shading: {
          type: ShadingType.CLEAR,
          color: "auto",
          fill: tableBgColor,
        },
        children: bulletParagraphs,
      }),
    ],
  });

  // Main outer table
  const table = new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [9000],
    rows: [statusRow, bulletRow],
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
  });

  doc.children.push(table);
  return doc;
}
async function saveDoc(doc, filePath) {
  try {
    // Create the actual Document from our children array
    const document = doc._createDocument();

    // Generate document buffer
    const buffer = await Packer.toBuffer(document);

    // Write to file
    await fs.promises.writeFile(filePath, buffer);
    console.log(`Document saved to ${filePath}`);
  } catch (error) {
    throw new Error(`Error saving document: ${error.message}`);
  }
}

async function writeInDocx(
  doc,
  type = "text",
  options = {},
  extras = {},
  indent = {},
  bullet = {},
  bookmark = {},
  alignment = AlignmentType.LEFT
) {
  try {
    switch (type) {
      case "heading":
      case "text":
        writeHeading(doc, options, extras, indent, bullet, bookmark,alignment);
        break;
      case "table":
        console.log("come ehre")
        console.log(options.headers)
        addTableInDoc(
          doc,
          options.headers,
          options.rowsData,
          options.styleOptions
        );
        break;
      case "diagnose":
        addDiagnose(doc, options.status, options.bullets);
        break;

      case "priority":
        addPriority(doc, options.status, options.title,extras);
        break;
      case "image":
        await addImage(doc, options.filePath,options.transformation);
        break;
      case "hyperlink":
        writeHyperlink(doc, options.title,options.url,options.style);
        break;
      case "headingWithLinks":
        writeHeadingWithLinks(doc, options.heading, options.links,options.style);
        break;
      case "addContent":
       
        createDashboardTable(doc, options.optimizationScore , options.currentWordCount , options.targetWordCount ,  options.pageSections);

      default:
        writeText(doc, options);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

/*____________________________________Test Code _________________________________________*/
async function test() {
  doc = await makeDoc(docxFileName);

  await writeInDocx(
    "heading",
    {
      text: "INTRO",
      font: "Arial",
      size: 20,
      color: "000000",
    },
    {
      after: 300, // spacing after heading in twips (20 = 1 pt)
    },
    {},
    {},
    {
      id: "section1",
      name: "section1",
    }
  );
  await writeInDocx("heading", {
    text: "Audit Introduction",
    font: "DM Sans",
    size: 40,
    color: "2C91E6",
    bold: true,
  });
  await writeInDocx("heading", {
    text: "Audit Intro – Magnolia Medspa And Wellness",
    font: "Arial",
    size: 24,
    bold: true,
  });
  await writeInDocx(
    "heading",
    {
      text: "https://magnoliamedspatx.com/",
      font: "Arial",
      size: 24,
      bold: true,
    },
    {
      after: 500, // spacing after heading in twips (20 = 1 pt)
    }
  );

  await writeInDocx("text", {
    text: "This audit was created to find opportunities for improvement to help you grow your business. ",
    font: "Arial",
    size: 22,
    bold: false,
  });
  await writeInDocx(
    "text",
    {
      text: "There are usually two reasons why you’d be looking at this Audit: ",
      font: "Arial",
      size: 22,
      bold: false,
    },
    {
      after: 200, // spacing after heading in twips (20 = 1 pt)
    }
  );

  await writeInDocx(
    "text",
    {
      text: "1)  Your current Local Ranking improvements are not as “impressive” as we’d like to see. ",
      font: "Arial",
      size: 20,
      bold: false,
    },
    {
      after: 200,
    },
    {
      left: 200,
    }
  );
  await writeInDocx(
    "text",
    {
      text: "2)  Your current Local Ranking improvements are impressive, but you want to explore other avenues to grow even more. ",
      font: "Arial",
      size: 22,
      bold: false,
    },
    {},
    {
      left: 200,
    }
  );

  await writeInDocx(
    "text",
    {
      text: "We are seeing improvements in some of your keywords but not on all of them. ",
      font: "Arial",
      size: 22,
      bold: false,
    },
    {
      before: 400,
      after: 800,
    },
    {},
    {
      level: 0,
    }
  );

  await addImage(doc, "sample.png");

  await writeInDocx(
    "text",
    {
      text: "_________________________________________________________________________",
      font: "Arial",
      size: 22,
      bold: false,
    },
    {
      before: 400,
      after: 200,
    }
  );

  await writeInDocx(
    "heading",
    {
      text: "KW RESEARCH",
      font: "Arial",
      size: 20,
      color: "000000",
    },
    {
      after: 300, // spacing after heading in twips (20 = 1 pt)
    },
    {},
    {},
    {
      id: "section2",
      name: "section2",
    }
  );
  await writeInDocx("heading", {
    text: "SEO Audit and Recommendation",
    font: "DM Sans",
    size: 40,
    color: "2C91E6",
    bold: true,
  });

  await writeInDocx("heading", {
    text: "Audit Intro – Magnolia Medspa And Wellness",
    font: "Arial",
    size: 24,
    bold: true,
  });
  await writeInDocx(
    "text",
    {
      text: "Here are some of the important keywords we have analyzed with their rankings. Organic Rankings (no GBP) can often be a signal of lack of website optimization or backlinks issues. ",
      font: "Arial",
      size: 20,
      bold: false,
    },
    {
      before: 400,
      after: 400,
    }
  );
  const headers = [
    "Keyword",
    "Volume",
    "Current position",
    "Difficulty (0-100)",
    "Ranking Page",
  ];

  const data = [
    {
      Keyword: "botox southlake",
      Volume: 150,
      "Current position": 41,
      "Difficulty (0-100)": 0,
      "Ranking Page": "https://magnoliamedspatx.com/injectables/botox/",
    },
    {
      Keyword: "southlake massage",
      Volume: 100,
      "Current position": "-",
      "Difficulty (0-100)": 10,
      "Ranking Page": "",
    },
    {
      Keyword: "botox southlake",
      Volume: 150,
      "Current position": 41,
      "Difficulty (0-100)": 0,
      "Ranking Page": "https://magnoliamedspatx.com/injectables/botox/",
    },

    {
      Keyword: "botox southlake",
      Volume: 150,
      "Current position": 41,
      "Difficulty (0-100)": 0,
      "Ranking Page": "https://magnoliamedspatx.com/injectables/botox/",
    },

    {
      Keyword: "botox southlake",
      Volume: 150,
      "Current position": 41,
      "Difficulty (0-100)": 0,
      "Ranking Page": "https://magnoliamedspatx.com/injectables/botox/",
    },

    {
      Keyword: "botox southlake",
      Volume: 150,
      "Current position": 41,
      "Difficulty (0-100)": 0,
      "Ranking Page": "https://magnoliamedspatx.com/injectables/botox/",
    },

    {
      Keyword: "botox southlake",
      Volume: 150,
      "Current position": 41,
      "Difficulty (0-100)": 0,
      "Ranking Page": "https://magnoliamedspatx.com/injectables/botox/",
    },
  ];

  // Optional style configuration
  const styleOptions = {
    headerBgColor: "1E90FF", // DodgerBlue
    headerTextColor: "FFFFFF", // White
    dataTextColor: "000000", // Black
  };

  await writeInDocx("table", {
    headers: headers,
    rowsData: data,
    styleOptions: styleOptions,
  });

  await writeInDocx(
    "text",
    {
      text: "As we can see there are multiple keywords that are not ranking organically in the top 100 and that means we either don’t have a page for these keywords, we’re very under-optimized or the website is too new and rankings have not kicked in.",
      font: "Arial",
      size: 20,
      bold: false,
    },
    {
      before: 200,
      after: 400,
    }
  );
  await writeInDocx(
    "text",
    {
      text: "In addition we don’t see any rankings in the top 10.",
      font: "Arial",
      size: 20,
      bold: false,
    },
    {
      before: 200,
      after: 400,
    }
  );
  await writeInDocx(
    "heading",
    {
      text: "Diagnosis Results",
      font: "DM Sans",
      size: 24,
      bold: true,
    },
    {
      before: 200,
      after:200
    }
  );

  await writeInDocx("diagnose", {
    status: "need to work",
    bullets: ["one", "two", "three"],
  });


  await writeInDocx(
    "heading", {
      text: "TECHNICAL SEO AUDIT",
      font: "Arial",
      size: 20,
      color: "000000"
    }, {
      before:500,
      after: 100, // spacing after heading in twips (20 = 1 pt)
    }, {}, {}, {
      id: "section3",
      name: "section3"
    }
  );


  await writeInDocx("heading", {
    text: "SEO Audit and Recommendations",
    font: "DM Sans",
    size: 40,
    color: "2C91E6",
    bold: true,
  });

  await writeInDocx("heading", {
    text: "Technical SEO Audit – Magnolia Medspa And Wellness",
    font: "Arial",
    size: 24,
    bold: true,
  },{after:200});

  await writeInDocx('priority', {
    status: "High Priority ▼",
    title: "Page Speed and Core Web Vitals",
});

await writeInDocx(
  "text",
  {
    text: "Over the years, Google has put a lot of emphasis on website speed, and having a fast website is a must.",
    font: "Arial",
    size: 20,
    bold: false,
  },{before:200,})

  await writeInDocx(
    "text",
    {
      text: "== MOBILE ==",
      font: "Arial",
      size: 20,
      bold: false,
    },{before:400},{},{},{},AlignmentType.CENTER)

    await addImage(doc, "page_mobile_stats.png");

    await writeInDocx(
      "text",
      {
        text: "== Desktop ==",
        font: "Arial",
        size: 20,
        bold: false,
      },{before:400},{},{},{},AlignmentType.CENTER)
  
      await addImage(doc, "page_desktop_stats.png");

      await writeInDocx(
        "heading",
        {
          text: "Diagnosis Results",
          font: "DM Sans",
          size: 24,
          bold: true,
        },
        {
          before: 400,
          after:200
        }
      );

      await writeInDocx("diagnose", {
        status: "need to work",
        bullets: ["Your website needs performance improvement both on mobile and desktop. Performance is important for user experience and better rankings.",],
      });

      await writeInDocx(
        "text",
        {
          text: "You can refer to the image below for the recommended issues to fix.",
          font: "Arial",
          size: 20,
          bold: false,
        },{before:200,after:200})

        await writeInDocx(
          "text",
          {
            text: "== MOBILE ==",
            font: "Arial",
            size: 20,
            bold: false,
          },{before:400},{},{},{},AlignmentType.CENTER)
      
          await addImage(doc, "page_mobile_stats.png");

          await writeInDocx(
            "text",
            {
              text: "== Desktop ==",
              font: "Arial",
              size: 20,
              bold: false,
            },{before:400},{},{},{},AlignmentType.CENTER)
        
            await addImage(doc, "page_desktop_stats.png");

  await saveDoc(doc, docxFileName);
}



// test();

module.exports={saveDoc,makeDoc,writeInDocx,addImage}

