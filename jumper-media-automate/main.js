require("dotenv").config();

const { runScreamingFrog } = require("./screaming_frog");

const { cleanup } = require("./cleanup");
const { broken_links } = require("./broken_link");
const {
  canniblization,
  canniblizationDiagnoseResult,
} = require("./cannibalization");
const { redirect_links } = require("./redirect_links");
const { saveDoc, makeDoc, writeInDocx } = require("./docx");
const {
  InitializePagespeedAutomation,
} = require("./pagespeed_automation/main_script/pagespeed_automation");
const { InitializeRichResultsScript } = require("./rich-script");

const {
  createGoogleSheetFile,
  storeCSVInGoogleSheet,
  createGoogleDriveFolder,
  uploadDocxToGoogleDrive,
} = require("./google_sheet");
const { cannibalizationSnapshot } = require("./cannibalization_snapshot");

const {
  InitializeGoogleMapsDirectionsScreenshot,
} = require("./screenshot_services/gbp_location_screenshot");

const {
  InitializeGBPBrowserSearchScreenshot,
} = require("./screenshot_services/gbp_browser_search_screenshot");
const { csvToJsonWithHeaders } = require("./csvToJsonWithHeaders");

const { InitializeEnhancedGBPScraper } = require("./scraper/scraper");

const {
  InitializeGBPIframeProcessor,
} = require("./screenshot_services/gbp_embed_screenshot");

const { removingFiles, checkFileExistence } = require("./remove-file");

const {
  createPOPTask,
  getPOPTask,
  generatePOPReport,
} = require("./page_optimizer");

const { getCSVLength, checkCSVForKeyValue } = require("./CSVparse");

const {
  createProject,
  getKeywordStatistics,
  AddSearchEngineData,
  addKeywordsToSERanking,
  getSearchEngine,
} = require("./se_ranking");
const { CSVtoSE_RANKING } = require("./SE_rankingCSV");

const {
  extractHighestSearchVolumeKeyword,
  getHigestPerformingCompetitors,
  getCompetitorKeywords,
  getLocationCode
} = require("./dataforseo");

const {
  createJsonLogFile,
  appendToLogReport,
} = require("./processing_report/process_report");

const fs = require('fs').promises;
var rich_url;
var sheetId = null;
var redirections = null;
var broken_link_url = null;
var cleanup_data = null;
var cannibalization = null;
var cleanup_url = null;
var totalCount = 0;
var screamingFrogLength = 0;
var keyword;
var competitorKeywords;
var competitor;
var folder;
function extractTextFromDocChildren(doc) {
  return doc.children
    .map((child) => {
      if (child.text) return child.text;
      if (child.children && Array.isArray(child.children)) {
        return child.children.map((c) => c.text || "").join(" ");
      }
      return "";
    })
    .filter((text) => text.trim().length > 0) // Remove empty parts
    .join("\n\n")
    .trim(); // Final cleanup
}

async function main(
  auditBusinessName = "mauibraces",
  auditBusinessUrl = "https://www.mauibraces.com"
) {
  // https://squeegeedetail.com/
  const businessName = auditBusinessName;
  const businessUrl = auditBusinessUrl;
  let docxFileName = `${businessName}.docx`;
  const doc = await makeDoc(docxFileName);
  const process_report = createJsonLogFile(businessName);
  try {

    folder = await createGoogleDriveFolder(businessName);

    // console.log("_______________________rich_script______________________\n");
    // rich_url = await InitializeRichResultsScript(businessUrl);

    // console.log("_______________________Internal_all.csv_____________________________\n")

    // removingFiles(process.env.SCREAM_FROG_CSV_FILE);
    // await runScreamingFrog(businessUrl,'./jumper-media-automate');


    // console.log("\n_______________________Response Codes:Internal & External:Client Error (4xx) Inlinks_____________________________\n")
    // removingFiles("./jumper-media-automate/client_error_(4xx)_inlinks.csv");
    // await runScreamingFrog(
    //   businessUrl,
    //   './jumper-media-automate',
    //   "Response Codes:Internal & External:Client Error (4xx) Inlinks",
    //   "bulk-export"
    // );
    // console.log("\n_______________________Response Codes:Redirection (3xx)_____________________________\n")
    // removingFiles("./jumper-media-automate/response_codes_redirection_(3xx).csv");
    // await runScreamingFrog(businessUrl,
    //   './jumper-media-automate' ,
    //   "Response Codes:Redirection (3xx)");

    if (checkFileExistence(process.env.SCREAM_FROG_CSV_FILE)) {
      sheetId = await createGoogleSheetFile(
        businessUrl,
        process.env.SCREAM_FROG_CSV_FILE,
        folder?.id
      );
    }


    // // dataforseo section for Competitor_Comparison and Keyword Research Tables
    // await ensureDirectoryExists('./jumper-media-automate/data_for_seo_reports')
    // const locationCode = await getLocationCode("https://squeegeedetail.com")
    // const highestRankingKeyword = await extractHighestSearchVolumeKeyword(
    //   auditBusinessUrl
    // );

    // if (highestRankingKeyword) {
    //   console.log("Returned highest ranking keyword:::", highestRankingKeyword);
    //   competitor = await getHigestPerformingCompetitors(highestRankingKeyword,auditBusinessUrl);
    // }
    // console.log("Returned Competitor:::", competitor);
    // if (competitor) {
    //   competitorKeywords = await getCompetitorKeywords(competitor);
    //   console.log("Returned competitor keywords:::", competitorKeywords);
    // }

    // // storing competitor_comparison table
    // if (sheetId) {
    //   await storeCSVInGoogleSheet(
    //     sheetId,
    //     "./jumper-media-automate/data_for_seo/Competitor_Comparison.csv",
    //     "Competitor_Comparison.csv"
    //   );
      // const returnedURL = await storeCSVInGoogleSheet(
      //   sheetId,
      //   "./jumper-media-automate/data_for_seo/Keyword_Research.csv",
      //   "Keyword_Research.csv"
      // );
    //   console.log("Returned Competitor Comparison sheet URL:::", returnedURL);
    // }


    console.log("______________________________cleanup______________\n");

    if (sheetId && checkFileExistence(process.env.SCREAM_FROG_CSV_FILE)) {
      cleanup_data = await cleanup(
        sheetId,
        process.env.SCREAM_FROG_CSV_FILE,
        "URL-Title-H1-Desc.csv"
      );

      cleanup_url = cleanup_data.cleanup_url;
      totalCount = cleanup_data.totalCount;

      return 
      broken_link_url = await broken_links(
        sheetId,
        "./jumper-media-automate/client_error_(4xx)_inlinks.csv",
        "./jumper-media-automate/broken_links.csv"
      );
      console.log(
        "_____________________________BrokenLink end__________________\n"
      );


      console.log(
        "_____________________________Redirections start___________________\n"
      );
      redirections = await redirect_links(
        sheetId,
        "./jumper-media-automate/response_codes_redirection_(3xx).csv",
        "./jumper-media-automate/redirections.csv"
      );
      console.log(
        "_____________________________Redirections end___________________\n"
      );

      console.log(
        "_____________________________Cannibalization start___________________\n"
      );
      cannibalization = await canniblization(
        sheetId,
        "URL,Title,H1,Desc.csv",
        "./jumper-media-automate/cannibalization.csv"
      );
      console.log(
        "_____________________________Cannibalization end___________________\n"
      );
    }
    //this is very useful because it generate gbp_output_data/gbp_enchanced.csv
        console.log("_____________________________Scraping start___________________\n")
    await InitializeEnhancedGBPScraper()
        console.log("_____________________________Scraping end___________________\n")

    await auditIntroductionDocx(doc, businessName, businessUrl); //todo need to automate

    await auditKWResearchDocx(doc, businessName, businessUrl); //todo need to automate

    await auditTechnicalSEODocx(doc, businessName, businessUrl); //todo need to automate

    await auditOnPageSEODocx(doc, businessName, businessUrl); //todo need to automate

    await auditOffPageSEODocx(doc, businessName, businessUrl); //todo need to automate

    await auditGBPDocx(doc, businessName, businessUrl); //todo need to automate
  } catch (error) {
    // Handles any error that occurred in the try block
    console.error("An error occurred:", error.message);
  } finally {
    // await auditDYIDocx(doc, businessName, businessUrl);
    // await saveDoc(doc, docxFileName);

    // uploadDocxToGoogleDrive(`${businessName}.docx`, businessName, folder?.id);
    // console.log(folder);
    // if (sheetId && competitorKeywords) {
    //   await SERanking(businessUrl, businessName, competitorKeywords, sheetId);
    // }
    // console.log("Final Main Response:::",folder)
    // return {googleDriveLink:folder.url,processReport:process_report};
  }
}

if(require.main == module) {
  main()
}


async function ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`📂 Created directory: ${dirPath}`);
    }
  }





//todo might be add some more params
async function auditIntroductionDocx(doc, businessName, businessUrl) {
  await writeInDocx(
    doc,
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
  await writeInDocx(doc, "heading", {
    text: "Audit Introduction",
    font: "DM Sans",
    size: 40,
    color: "2C91E6",
    bold: true,
  });
  await writeInDocx(doc, "heading", {
    text: `Audit Intro – ${businessName}`,
    font: "Arial",
    size: 24,
    bold: true,
  });
  await writeInDocx(
    doc,
    "heading",
    {
      text: businessUrl,
      font: "Arial",
      size: 24,
      bold: true,
    },
    {
      after: 500, // spacing after heading in twips (20 = 1 pt)
    }
  );

  await writeInDocx(doc, "text", {
    text: "This audit was created to find opportunities for improvement to help you grow your business. ",
    font: "Arial",
    size: 22,
    bold: false,
  });
  await writeInDocx(
    doc,
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
    doc,
    "text",
    {
      text: "1)  Your current Local Ranking improvements are not as “impressive” as we’d like to see. ",
      font: "Arial",
      size: 22,
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
    doc,
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

  //todo put some comment based on results might be  they will more then put in array and loop
  await writeInDocx(
    doc,
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

  //todo  do something to get result in png form

  await addPlaceHolderImage(doc);

  await addLine(doc);
}

async function auditKWResearchDocx(doc, businessName, businessUrl) {
  await writeInDocx(
    doc,
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
  await writeInDocx(doc, "heading", {
    text: "SEO Audit and Recommendation",
    font: "DM Sans",
    size: 40,
    color: "2C91E6",
    bold: true,
  });

  await writeInDocx(doc, "heading", {
    text: `Audit Intro – ${businessName}`,
    font: "Arial",
    size: 24,
    bold: true,
  });
  await writeInDocx(
    doc,
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

  // //todo might be possible we need to add CSV parse script here to convert CSV file into JSON obect
  // const headers = [
  //   "Keyword",
  //   "Volume",
  //   "Current position",
  //   "Difficulty (0-100)",
  //   "Ranking Page",
  // ];

  // const data = [
  //   {
  //     Keyword: "botox southlake",
  //     Volume: 150,
  //     "Current position": 41,
  //     "Difficulty (0-100)": 0,
  //     "Ranking Page": "https://magnoliamedspatx.com/injectables/botox/",
  //   },
  //   {
  //     Keyword: "southlake massage",
  //     Volume: 100,
  //     "Current position": "-",
  //     "Difficulty (0-100)": 10,
  //     "Ranking Page": "",
  //   },
  //   {
  //     Keyword: "botox southlake",
  //     Volume: 150,
  //     "Current position": 41,
  //     "Difficulty (0-100)": 0,
  //     "Ranking Page": "https://magnoliamedspatx.com/injectables/botox/",
  //   },

  //   {
  //     Keyword: "botox southlake",
  //     Volume: 150,
  //     "Current position": 41,
  //     "Difficulty (0-100)": 0,
  //     "Ranking Page": "https://magnoliamedspatx.com/injectables/botox/",
  //   },

  //   {
  //     Keyword: "botox southlake",
  //     Volume: 150,
  //     "Current position": 41,
  //     "Difficulty (0-100)": 0,
  //     "Ranking Page": "https://magnoliamedspatx.com/injectables/botox/",
  //   },

  //   {
  //     Keyword: "botox southlake",
  //     Volume: 150,
  //     "Current position": 41,
  //     "Difficulty (0-100)": 0,
  //     "Ranking Page": "https://magnoliamedspatx.com/injectables/botox/",
  //   },

  //   {
  //     Keyword: "botox southlake",
  //     Volume: 150,
  //     "Current position": 41,
  //     "Difficulty (0-100)": 0,
  //     "Ranking Page": "https://magnoliamedspatx.com/injectables/botox/",
  //   },
  // ];

  let objectcomparison = await csvToJsonWithHeaders("Keyword_Research.csv", []);

  objectcomparison.jsonArray = objectcomparison.jsonArray.slice(0, 15);

  // Optional style configuration
  const styleOptionsRedirections = {
    headerBgColor: "1E90FF", // DodgerBlue
    headerTextColor: "FFFFFF", // White
    dataTextColor: "000000",
    columnWidths: {
      Keyword: 30,
      Volume: 10,
      Current_Position: 20,
      Keyword_Difficulty: 15,
      "Ranking Page": 25,
    }, // Black
  };

  const comparisonDocs = await writeInDocx(doc, "table", {
    headers: objectcomparison.headers,
    rowsData: objectcomparison.jsonArray,
    styleOptions: styleOptionsRedirections,
  });

  //todo add results based on performance
  await writeInDocx(
    doc,
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
    doc,
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
    doc,
    "heading",
    {
      text: "Diagnosis Results",
      font: "DM Sans",
      size: 24,
      bold: true,
    },
    {
      before: 200,
      after: 200,
    }
  );

  await writeInDocx(doc, "diagnose", {
    status: "Need to work",
    bullets: [
      "Any ranking keyword that is not in the top 3 needs optimization or the creation of a new page.",
    ],
  });
}

async function auditTechnicalSEODocx(doc, businessName, businessUrl) {
  await writeInDocx(
    doc,
    "heading",
    {
      text: "TECHNICAL SEO AUDIT",
      font: "Arial",
      size: 20,
      color: "000000",
    },
    {
      before: 500,
      after: 100, // spacing after heading in twips (20 = 1 pt)
    },
    {},
    {},
    {
      id: "section3",
      name: "section3",
    }
  );

  await writeInDocx(doc, "heading", {
    text: "SEO Audit and Recommendations",
    font: "DM Sans",
    size: 40,
    color: "2C91E6",
    bold: true,
  });

  await writeInDocx(
    doc,
    "heading",
    {
      text: `Technical SEO Audit – ${businessName}`,
      font: "Arial",
      size: 24,
      bold: true,
    },
    { after: 200 }
  );

  //todo how i can estimate the priority
  await writeInDocx(doc, "priority", {
    status: "high",
    title: "Page Speed and Core Web Vitals",
  });

  await writeInDocx(
    doc,
    "text",
    {
      text: "Over the years, Google has put a lot of emphasis on website speed, and having a fast website is a must.",
      font: "Arial",
      size: 20,
      bold: false,
    },
    { before: 200 }
  );

  let pageSpeedJson = await InitializePagespeedAutomation(businessUrl);

  console.log(pageSpeedJson);

  await writeInDocx(
    doc,
    "text",
    {
      text: "== MOBILE ==",
      font: "Arial",
      size: 20,
      bold: false,
    },
    { before: 400 },
    {},
    {},
    {},
    "center"
  );

  console.log("This is error>>>>>>>>>>>>>>...\n");
  //todo run the page_speed_optimzation_function get result for mobile,desktop performance
  const mobileStats = pageSpeedJson?.screenshots?.find(
    (screenshot) =>
      screenshot?.type === "vitals" && screenshot?.platform === "mobile"
  );

  if (mobileStats && Object.keys(mobileStats).length > 0) {
    await writeInDocx(doc, "image", { filePath: mobileStats?.path });
  }

  await writeInDocx(
    doc,
    "text",
    {
      text: "== Desktop ==",
      font: "Arial",
      size: 20,
      bold: false,
    },
    { before: 400 },
    {},
    {},
    {},
    "center"
  );

  console.log("This is google>>>>>>>>>>>>>>...\n");
  const desktopStats = pageSpeedJson?.screenshots?.find(
    (screenshot) =>
      screenshot?.type === "vitals" && screenshot?.platform === "desktop"
  );

  if (desktopStats && Object.keys(desktopStats).length > 0) {
    await writeInDocx(doc, "image", { filePath: desktopStats?.path });
  }
  await writeInDocx(
    doc,
    "heading",
    {
      text: "Diagnosis Results",
      font: "DM Sans",
      size: 24,
      bold: true,
    },
    {
      before: 400,
      after: 200,
    }
  );

  let status = "Opportunity";
  let message = [
    "Even though your Core Web Vitals assessment passed on both mobile and desktop, there's room for improvement in performance and accessibility.",
    "Enhancing performance can improve load times, which positively affects user experience and SEO.",
  ];

  // Extract performance scores
  const mobileScore = pageSpeedJson?.extractedScores?.mobile?.Performance ?? 0;
  const desktopScore =
    pageSpeedJson?.extractedScores?.desktop?.Performance ?? 0;

  // Define status and messages based on score ranges
  if (mobileScore <= 49 && desktopScore <= 49) {
    status = "Need to work";
    message = [
      "Your website needs significant performance improvements on both mobile and desktop.",
      "Poor performance can negatively impact user experience, bounce rates, and search engine rankings.",
    ];
  } else if (mobileScore >= 90 && desktopScore >= 90) {
    status = "Good";
    message = [
      "Great job! Your website performs well on both mobile and desktop.",
      "High performance ensures faster load times and a better user experience, which can support stronger SEO outcomes.",
    ];
  } else {
    status = "Opportunity";
    message = [
      "Your website shows decent performance but there's room for optimization on either mobile or desktop.",
      "Improving site speed will enhance usability and help achieve better search visibility over time.",
    ];
  }
  await writeInDocx(doc, "diagnose", {
    status: status,
    bullets: message,
  });

  await writeInDocx(
    doc,
    "text",
    {
      text: "You can refer to the image below for the recommended issues to fix.",
      font: "Arial",
      size: 20,
      bold: false,
    },
    { before: 200, after: 200 }
  );

  await writeInDocx(
    doc,
    "text",
    {
      text: "== MOBILE ==",
      font: "Arial",
      size: 20,
      bold: false,
    },
    { before: 400 },
    {},
    {},
    {},
    "center"
  );

  const mobileDiagnose = pageSpeedJson?.screenshots?.find(
    (screenshot) =>
      screenshot?.type === "diagnostics" && screenshot?.platform === "mobile"
  );

  if (mobileDiagnose && Object.keys(mobileDiagnose).length > 0) {
    await writeInDocx(doc, "image", { filePath: mobileDiagnose?.path });
  }

  await writeInDocx(
    doc,
    "text",
    {
      text: "== Desktop ==",
      font: "Arial",
      size: 20,
      bold: false,
    },
    { before: 400 },
    {},
    {},
    {},
    "center"
  );

  const desktopDiagnose = pageSpeedJson?.screenshots?.find(
    (screenshot) =>
      screenshot?.type === "diagnostics" && screenshot?.platform === "desktop"
  );

  if (desktopDiagnose && Object.keys(desktopDiagnose).length > 0) {
    await writeInDocx(doc, "image", { filePath: desktopDiagnose?.path });
  }

  await addSpace(doc, { before: 200 });

  await writeInDocx(doc, "priority", {
    status: "high",
    title: "Broken Links",
  });

  await writeInDocx(
    doc,
    "text",
    {
      text: "A website has broken links when links anywhere on your website lead to pages that don’t exist (internally or when they link to an external source). That creates a “dead end” when Google crawls the website or when a visitor clicks on those elements.",
      font: "Arial",
      size: 20,
      bold: false,
    },
    { before: 200, after: 200 }
  );

  console.log(
    "____________________Response Codes:Client Error (4xx)_______________\n"
  );
  removingFiles("response_codes_client_error_(4xx).csv");
  await runScreamingFrog(businessUrl,'./jumper-media-automate', "Response Codes:Client Error (4xx)");

  let object = await csvToJsonWithHeaders(
    "response_codes_client_error_(4xx).csv",
    [
      "Indexability",
      "Indexability Status",
      "Response Time",
      "Redirect URL",
      "Redirect Type",
    ]
  );

  // Optional style configuration
  const styleOptions = {
    headerBgColor: "1E90FF", // DodgerBlue
    headerTextColor: "FFFFFF", // White
    dataTextColor: "000000",
    columnWidths: {
      Address: 40,
      "Content Type": 20,
      "Status Code": 10,
      Status: 20,
      Inlinks: 10,
    }, // Black
  };

  await writeInDocx(doc, "table", {
    headers: object?.headers,
    rowsData: object?.jsonArray,
    styleOptions: styleOptions,
  });

  //  await addPlaceHolderImage(doc)

  await addSpace(doc, { before: 200, before: 200 });

  await writeInDocx(doc, "hyperlink", {
    title: "find them here",
    url: broken_link_url,
  });

  await writeInDocx(
    doc,
    "heading",
    {
      text: "Diagnosis Results",
      font: "DM Sans",
      size: 24,
      bold: true,
    },
    {
      before: 400,
      after: 200,
    }
  );

  //todo priority based on result
  //Needs work if there’s a lot of INTERNAL issues.
  // Opportunity if there are less than 2% of internal errors (and more than 0.51%)
  // Good if there are less than 0.5%

  let percentageBrokenLinks =
    (object.jsonArray.length / screamingFrogLength) * 100;
  let brokenLinkStatus = "Need to work";
  let brokenLinkComment = [
    `Fix ${object.jsonArray.length} Broken Internal & External Links to avoid dead ends when Google crawls the website and when visitors click on those elements.`,
  ];

  if (percentageBrokenLinks >= 0.51 && percentageBrokenLinks <= 2) {
    brokenLinkStatus = "Opportunity";
    brokenLinkComment = [
      "Some links on the website are leading to pages that no longer exist or are inaccessible.",
      "These broken links create minor dead ends that can disrupt user experience and SEO signals.",
      "Fixing them now will help preserve site credibility and ensure better crawlability.",
    ];
  } else if (percentageBrokenLinks < 0.51) {
    brokenLinkStatus = "Good";
    brokenLinkComment = [
      "Our technical SEO tool didn’t detect any broken links internal or external.",
    ];
  }

  await writeInDocx(doc, "diagnose", {
    status: brokenLinkStatus,
    bullets: brokenLinkComment,
  });

  await addSpace(doc, { before: 200 });

  await writeInDocx(doc, "priority", {
    status: "medium",
    title: "Structured Data / Schema Markup",
  });

  await writeInDocx(
    doc,
    "text",
    {
      text: "Structured data, Schema Markup, and microdata are similar terms used to describe specific code added to the website to give Google more “structured” information about the business. The most critical structured data we want to see is any of the following:",
      font: "Arial",
      size: 20,
      bold: false,
    },
    { before: 200, after: 200 }
  );

  const items = [
    "Local Business",
    "Organization",
    "Specific business type",
    "Menu for restaurant",
    "Etc",
  ];

  for (const item of items) {
    // Write the current item from the array
    await writeInDocx(
      doc,
      "text",
      {
        text: item, // This will be each array item in the loop
        font: "Arial",
        size: 20,
        bold: false,
      },
      {}, // Empty options object for before/after spacing
      {}, // Additional empty options object
      {
        level: 0,
      }
    );
  }

  addSpace(doc);

  await writeInDocx(
    doc,
    "text",
    {
      text: "Example of the minimum for a proper setup:",
      font: "Arial",
      size: 20,
      bold: true,
    },
    {
      before: 200,
      after: 200,
    }
  );

  await addPlaceHolderImage(doc, "jumper-media-automate/crawl-example.png");

  await writeInDocx(
    doc,
    "text",
    {
      text: "Your structured data results:",
      font: "Arial",
      size: 20,
      bold: true,
    },
    {
      before: 200,
      after: 200,
    }
  );

  await writeInDocx(doc, "image", { filePath: rich_url });

  await writeInDocx(
    doc,
    "heading",
    {
      text: "Diagnosis Results",
      font: "DM Sans",
      size: 24,
      bold: true,
    },
    {
      before: 200,
      after: 200,
    }
  );

  await writeInDocx(doc, "diagnose", {
    status: "Need to work",
    bullets: [
      "The website lacks the most essential schema markup and structured data elements. (Organization and LocalBusiness).",
    ],
  });

  addSpace(doc);

  await writeInDocx(doc, "priority", {
    status: "medium",
    title: "Redirections",
  });

  await writeInDocx(
    doc,
    "text",
    {
      text: "A redirection happens when a page URL is changed, and the old one redirects to a new one. Redirections are not an issue by themselves. However, the website still has links in the content, menu, and other places that link to the old page, and it creates a redirect chain:",
      font: "Arial",
      size: 20,
      bold: false,
    },
    {
      before: 200,
      after: 200,
    }
  );

  await writeInDocx(
    doc,
    "text",
    {
      text: "Link on website > Old Page Redirecting to new page > New Page",
      font: "Arial",
      size: 20,
      bold: false,
    },
    {
      before: 0,
      after: 200,
    }
  );

  //#redirect

  let objectRedirections = await csvToJsonWithHeaders(
    "response_codes_redirection_(3xx).csv",
    [
      ,
      "Indexability",
      "Indexability Status",
      "Response Time",
      "Redirect URL",
      "Redirect Type",
    ]
  );

  // Optional style configuration
  const styleOptionsRedirections = {
    headerBgColor: "1E90FF", // DodgerBlue
    headerTextColor: "FFFFFF", // White
    dataTextColor: "000000",
    columnWidths: {
      Address: 40,
      "Content Type": 20,
      "Status Code": 10,
      Status: 20,
      Inlinks: 10,
    }, // Black
  };

  await writeInDocx(doc, "table", {
    headers: objectRedirections.headers,
    rowsData: objectRedirections.jsonArray,
    styleOptions: styleOptionsRedirections,
  });

  // await addPlaceHolderImage(doc)

  addSpace(doc, { before: 200 });

  await writeInDocx(doc, "hyperlink", {
    title: "find them here",
    url: redirections,
  });

  addSpace(doc, { before: 200 });
  let percentageRedirection =
    (objectRedirections.jsonArray.length / screamingFrogLength) * 100;
  let redirectionStatus = "Need to work";
  let redirectionComments = [
    "The most critical redirections to fix are the internal redirections.",
    "Ideally, fixing all redirections would be the best option to try and tidy up the website as much as possible.",
    "There’s only one redirection from category pages to an author page then redirects to the home page. We’d recommend fixing it but it’s not a high impact issue.",
  ];

  if (percentageRedirection >= 0.51 && percentageRedirection <= 2) {
    redirectionStatus = "Opportunity";
    redirectionComments = [
      "There are a small number of internal redirections that could be cleaned up.",
      "Fixing these could improve crawl efficiency and marginally boost SEO performance.",
    ];
  } else if (percentageRedirection < 0.51) {
    redirectionStatus = "Good";
    redirectionComments = [
      "Our technical SEO tool didn’t detect any broken links internal or external.",
    ];
  }

  await writeInDocx(doc, "diagnose", {
    status: redirectionStatus,
    bullets: redirectionComments,
  });

  await addLine(doc);
}

async function auditOnPageSEODocx(doc, businessName, businessUrl) {
  await writeInDocx(
    doc,
    "heading",
    {
      text: "ON-PAGE SEO AUDIT",
      font: "Arial",
      size: 20,
      color: "000000",
    },
    {
      before: 500,
      after: 100, // spacing after heading in twips (20 = 1 pt)
    },
    {},
    {},
    {
      id: "section3",
      name: "section3",
    }
  );

  await writeInDocx(doc, "heading", {
    text: "SEO Audit and Recommendation",
    font: "DM Sans",
    size: 40,
    color: "2C91E6",
    bold: true,
  });

  await writeInDocx(doc, "heading", {
    text: `On-Page SEO Audit – ${businessName}`,
    font: "Arial",
    size: 24,
    bold: true,
  });

  await writeInDocx(
    doc,
    "heading",
    {
      text: `Pages with index status: ${totalCount}`,
      font: "Arial",
      size: 24,
      bold: true,
    },
    { after: 200 }
  );

  await writeInDocx(doc, "priority", {
    status: "high",
    title: "Titles, URLs, Headings tags, Onsite Optimization",
  });

  await writeInDocx(
    doc,
    "text",
    {
      text: "Titles, URLs, and H1 tags are the strongest signals for Onsite SEO. Therefore it’s very important to have these optimized. This is what we consider to be Onsite SEO 101 (the basics).",
      font: "Arial",
      size: 22,
      bold: false,
    },
    {
      before: 200,
      after: 200,
    }
  );

  await writeInDocx(
    doc,
    "text",
    {
      text: "Here’s a breakdown of Titles, URLs and H1 tag (Page heading tag) from your most important pages:",
      font: "Arial",
      size: 22,
      bold: false,
    },
    {
      after: 200,
    }
  );

  await writeInDocx(doc, "hyperlink", {
    title: "click here",
    url: cleanup_url,
    style: { size: 21, extras: " for full list." },
  });

  await writeInDocx(
    doc,
    "text",
    {
      text: "Snapshot:",
      font: "Arial",
      size: 20,
      bold: true,
    },
    {
      before: 200,
      after: 200,
    }
  );

  let cannibalization_ss_url = await cannibalizationSnapshot(cleanup_url);
  //#work here

  await writeInDocx(doc, "image", { filePath: cannibalization_ss_url });
  // await addPlaceHolderImage(doc)

  await writeInDocx(
    doc,
    "text",
    {
      text: "These are the things we take into account",
      font: "Arial",
      size: 22,
      bold: false,
    },
    {
      before: 200,
      after: 200,
    }
  );

  const items = [
    "URLs optimized: Do they have the service + city for the right URLs.",
    "URL cannibalization: Do we have URLs that are too similar.",
    "Title Consistency: Do they have the same format and (Brand name like the GBP at the end).",
    "Title cannibalization: Do we have duplicate titles or titles that are too close to each other.",
    "Titles optimized: Keyword and city in the right ones.",
    "Descriptions with call to action and optimized.",
  ];

  for (const item of items) {
    // Write the current item from the array
    await writeInDocx(
      doc,
      "text",
      {
        text: item, // This will be each array item in the loop
        font: "Arial",
        size: 20,
        bold: false,
      },
      {}, // Empty options object for before/after spacing
      {}, // Additional empty options object
      {
        level: 0,
      }
    );
  }

  addSpace(doc);

  let cannibalizationDiagnoseResult = await canniblizationDiagnoseResult(
    "URL,Title,H1,Desc.csv"
  );

  await writeInDocx(doc, "diagnose", {
    status: cannibalizationDiagnoseResult.status ?? "Opporunity",
    bullets: cannibalizationDiagnoseResult.comments ?? [],
  });

  addSpace(doc);

  await writeInDocx(doc, "priority", {
    status: "high",
    title: "Content Optimization",
  });

  await writeInDocx(
    doc,
    "text",
    {
      text: "After URLs, Titles and Heading, content is the second most powerful Onsite SEO strategy. Having optimized content is key to rank higher on Google and get more visibility for your business.",
      font: "Arial",
      size: 20,
      bold: false,
    },
    {
      before: 200,
      after: 200,
    }
  );

  await writeInDocx(
    doc,
    "text",
    {
      text: "We did an analysis of your top keyword to see how you stack against your top 4 competitors. This analysis takes into account things like title optimization, H tags optimization, content optimization, content length and more. Here are your results.",
      font: "Arial",
      size: 20,
      bold: false,
    },
    {
      before: 200,
      after: 200,
    }
  );

  const highestRankingKeyword = await extractHighestSearchVolumeKeyword(
    businessUrl
  );

  const responseContent = await generateContentOptimizationReport(
    highestRankingKeyword,
    businessUrl
  );
  console.log(responseContent);
  const optimizationScore =
    responseContent?.response?.report?.cleanedContentBrief?.pageScore
      ?.pageScore ?? 0;
  const currentWordCount =
    responseContent?.response?.report?.wordCount?.current ?? 0;
  const targetWordCount =
    responseContent?.response?.report?.wordCount?.target ?? 0;

  await writeInDocx(
    doc,
    "heading",
    {
      text: `Keyword: ${keyword}`,
      font: "Arial",
      size: 22,
      bold: true,
    },
    { after: 200 }
  );

  await writeInDocx(
    doc,
    "heading",
    {
      text: `ReportId: ${responseContent?.reportId}`,
      font: "Arial",
      size: 22,
      bold: true,
    },
    { after: 200 }
  );

  await writeInDocx(
    doc,
    "heading",
    {
      text: `Time: ${responseContent?.date_done}`,
      font: "Arial",
      size: 22,
      bold: true,
    },
    { after: 200 }
  );

  writeInDocx(doc, "addContent", {
    optimizationScore,
    currentWordCount,
    targetWordCount,
  });

  addSpace(doc);
  let contentOptizationStatus = "Opportunity";
  let contentOptimizationComment = [];

  // Handle Optimization Score
  if (optimizationScore < 60) {
    contentOptizationStatus = "Need to work";
    contentOptimizationComment.push(
      "The overall optimization score is low. Important elements like headings, content structure, or keyword usage likely need improvement."
    );
  } else if (optimizationScore >= 81) {
    contentOptizationStatus = "Good";
    contentOptimizationComment.push(
      "Great job! The content is well-optimized according to the tool. Just ensure content is kept up-to-date."
    );
  } else {
    contentOptizationStatus = "Opportunity";
    contentOptimizationComment.push(
      "Your page has decent optimization, but improvements in headings, content structure, or keyword usage can help push it further."
    );
  }

  // Handle Word Count Comparison
  if (currentWordCount < targetWordCount * 0.6) {
    contentOptimizationComment.push(
      `The current word count is significantly low (${currentWordCount} words vs. ${targetWordCount} target). Add more relevant content to compete.`
    );
  } else if (currentWordCount >= targetWordCount * 0.9) {
    contentOptimizationComment.push(
      `Your content length is close to the target (${currentWordCount} / ${targetWordCount}). No major changes needed.`
    );
  } else {
    contentOptimizationComment.push(
      `The word count is slightly below the target (${currentWordCount} / ${targetWordCount}). Consider expanding content for better competitiveness.`
    );
  }

  // Write to DOCX
  await writeInDocx(doc, "diagnose", {
    status: contentOptizationStatus,
    bullets: contentOptimizationComment,
  });

  addSpace(doc);

  await writeInDocx(doc, "priority", {
    status: "high",
    title: "Google Business Profile (GMB) Embeds",
  });

  await writeInDocx(
    doc,
    "text",
    {
      text: "In order to send the right geo location signals to Google your Google Business Profile has to be embedded in the location pages where your GBP is located. If you have multiple GBPs, then they should be located in the proper “city” pages only.",
      font: "Arial",
      size: 20,
      bold: false,
    },
    {
      before: 200,
      after: 200,
    }
  );

  const data = await InitializeGBPIframeProcessor(
    "jumper-media-automate/gbp_output_data/gbp_enhanced_records.csv"
  );

  // Loop through each result
  for (const [index, result] of data.entries()) {
    await writeInDocx(doc, "heading", {
      text: `${result.city}`,
      font: "Arial",
      size: 24,
      bold: true,
    });

    console.log(`Screenshot Path: ${result.screenshotPath}`);
    await writeInDocx(doc, "image", { filePath: result.screenshotPath });
  }

  const diagnoseGBProfileResult = await checkCSVForKeyValue(businessUrl);

  let diagnoseGBProfileResultStatus = "Need to work";
  let diagnoseGBProfileResultComment = [
    "Your Google Business Profile should be embedded on the homepage, not just the contact page, to enhance local SEO visibility and improve trust signals for users and search engines.",
  ];

  if (diagnoseGBProfileResult.homePageMap && diagnoseGBProfileResult.nap) {
    diagnoseGBProfileResultStatus = "Good";
    diagnoseGBProfileResultComment = [
      "Your homepage successfully includes the Google Business Profile, which helps improve local SEO, builds credibility, and enhances user trust.",
    ];
  } else if (
    diagnoseGBProfileResult.homePageMap ||
    diagnoseGBProfileResult.nap
  ) {
    diagnoseGBProfileResultStatus = "Opportunity";
    diagnoseGBProfileResultComment = [
      "Your website shows partial implementation. Consider embedding the Google Business Profile on the homepage and ensure NAP (Name, Address, Phone number) is included in structured markup to improve local SEO.",
    ];
  }
  addSpace(doc);
  await writeInDocx(doc, "diagnose", {
    status: diagnoseGBProfileResultStatus,
    bullets: diagnoseGBProfileResultComment,
  });

  addLine(doc);
}

async function auditOffPageSEODocx(doc, businessName, businessUrl) {
  console.log("thier");
  await writeInDocx(
    doc,
    "heading",
    {
      text: "OFF-PAGE SEO AUDIT",
      font: "Arial",
      size: 20,
      color: "000000",
    },
    {
      before: 500,
      after: 100, // spacing after heading in twips (20 = 1 pt)
    },
    {},
    {},
    {
      id: "section4",
      name: "section4",
    }
  );
  await writeInDocx(doc, "heading", {
    text: "SEO Audit and Recommendation",
    font: "DM Sans",
    size: 40,
    color: "2C91E6",
    bold: true,
  });
  await writeInDocx(doc, "heading", {
    text: `Off-Page SEO Audit – ${businessName}`,
    font: "Arial",
    size: 24,
    bold: true,
  });

  addSpace(doc);

  await writeInDocx(doc, "priority", {
    status: "high",
    title: "Backlinks, Domain Rating, Referring Domains",
  });
  await writeInDocx(
    doc,
    "text",
    {
      text: "In order to understand your off-page optimization in comparison with the top competitors in your area, we did the following analysis.",
      font: "Arial",
      size: 20,
      bold: false,
    },
    {
      before: 200,
      after: 200,
    }
  );

  let objectcomparison = await csvToJsonWithHeaders(
    "Competitor_Comparison.csv",
    []
  );

  // console.log(objectcomparison)
  // console.log(objectcomparison.headers)

  objectcomparison.jsonArray = objectcomparison.jsonArray.slice(0, 15);

  // Optional style configuration
  const styleOptionsRedirections = {
    headerBgColor: "1E90FF", // DodgerBlue
    headerTextColor: "FFFFFF", // White
    dataTextColor: "000000",
    columnWidths: {
      Type: 15,
      Keyword: 15,
      Url: 15,
      Backlinks: 15,
      "Referring Domain": 15,
      "Domain Rating": 15,
    }, // Black
  };

  const comparisonDocs = await writeInDocx(doc, "table", {
    headers: objectcomparison?.headers,
    rowsData: objectcomparison?.jsonArray,
    styleOptions: styleOptionsRedirections,
  });

  await writeInDocx(
    doc,
    "text",
    {
      text: "To make sense of this, we focus on:",
      font: "Arial",
      size: 20,
      bold: false,
    },
    {
      before: 200,
      after: 200,
    }
  );

  const items = [
    "Do we have better metrics and worst rankings? Probability: Bad onsite, bad links or lack of supportive content).",
    "Do we have worst metrics but decent rankings? What to do:  improve links and on-site",
  ];

  for (const item of items) {
    // Write the current item from the array
    await writeInDocx(
      doc,
      "text",
      {
        text: item, // This will be each array item in the loop
        font: "Arial",
        size: 20,
        bold: false,
      },
      {}, // Empty options object for before/after spacing
      {}, // Additional empty options object
      {
        level: 0,
      }
    );
  }

  await writeInDocx(doc, "heading", {
    text: `Summary:`,
    font: "Arial",
    size: 20,
    bold: true,
  });

  const summary = [
    "Some competitors rank better than us but they have the keywords in the URL which works against it.",
    "Some other competitors (name) have less domains, more backlinks and slightly higher DR, but rank in the top 5.",
    "Most competitors have better metrics than us and that means better strategies and number of links which helps them rank better.",
  ];

  for (const item of summary) {
    // Write the current item from the array
    await writeInDocx(
      doc,
      "text",
      {
        text: item, // This will be each array item in the loop
        font: "Arial",
        size: 20,
        bold: false,
      },
      {}, // Empty options object for before/after spacing
      {}, // Additional empty options object
      {
        level: 0,
      }
    );
  }

  await writeInDocx(
    doc,
    "heading",
    {
      text: "Diagnosis Results",
      font: "DM Sans",
      size: 24,
      bold: true,
    },
    {
      before: 200,
      after: 200,
    }
  );

  await writeInDocx(doc, "diagnose", {
    status: "Need to work",
    bullets: [
      "Low rankings with decent metrics can be a signal of bad on-site optimization.",
      "We suggest investing in better link building, including but not limited to doing an anchor text analysis, and competitor full link analysis have more effective link building strategies.",
    ],
  });

  addLine(doc);
}

async function auditGBPDocx(doc, businessName, business) {
  let gbp_images = await InitializeGBPBrowserSearchScreenshot();
  let result = await InitializeGoogleMapsDirectionsScreenshot(
    "jumper-media-automate/gbp_output_data/gbp_enhanced_records.csv",
    {
      showBoundingBox: true,
      headless: false,
    }
  );

  console.log("result");
  console.log(result);
  console.log("gbp_image");
  console.log(gbp_images);

  // return

  let city = null;
  let filteredImages = null;
  let filteredReview = null;
  let filterLink = null;
  let filterFrequency = null;
  let filterProduct = null;

  let cities = [];
  for (const [index, item] of result.entries()) {
    city = item.city;

    if (!cities.includes(city)) {
      console.log(
        `________________________city:${city}______________________________\n`
      );

      await writeInDocx(
        doc,
        "heading",
        {
          text: `GBP AUDIT ${city}`,
          font: "Arial",
          size: 20,
          color: "000000",
        },
        {
          before: 500,
          after: 100, // spacing after heading in twips (20 = 1 pt)
        },
        {},
        {},
        {
          id: `section${Math.random()}`,
          name: `section${Math.random()}`,
        }
      );
      await writeInDocx(doc, "heading", {
        text: "SEO Audit and Recommendation",
        font: "DM Sans",
        size: 40,
        color: "2C91E6",
        bold: true,
      });
      await writeInDocx(doc, "heading", {
        text: `Off-Page SEO Audit – ${businessName}`,
        font: "Arial",
        size: 24,
        bold: true,
      });

      await writeInDocx(
        doc,
        "text",
        {
          text: "The GMBs are in good standing in general, so we’ll only point out items that can be improved from what we can see without having access to the GMB.",
          font: "Arial",
          size: 20,
          bold: false,
        },
        {
          before: 200,
          after: 200,
        }
      );

      addSpace(doc);

      await writeInDocx(doc, "priority", {
        status: "high",
        title: "GBP Location",
      });

      await writeInDocx(
        doc,
        "text",
        {
          text: "The location of your Google Business Profile is a ranking factor. You want to be, at most 5 miles away from the desired targeted areas.",
          font: "Arial",
          size: 20,
          bold: false,
        },
        {
          before: 200,
          after: 200,
        }
      );
      await writeInDocx(
        doc,
        "text",
        {
          text: "That means if you want to have visibility downtown but your GBP is 10 miles away from that area, it’ll be very difficult to have visibility downtown.",
          font: "Arial",
          size: 20,
          bold: false,
        },
        {
          before: 200,
          after: 200,
        }
      );

      console.log(
        `________________________Location______________________________\n`
      );
      console.log(`items location >>>>>>>>>>>>>>>>`, item);
      await writeInDocx(doc, "image", {
        filePath: item?.screenshot_path,
        transformation: { height: 600 },
      });

      await writeInDocx(
        doc,
        "heading",
        {
          text: "Diagnosis Results",
          font: "DM Sans",
          size: 24,
          bold: true,
        },
        {
          before: 200,
          after: 200,
        }
      );

      await writeInDocx(doc, "diagnose", {
        status: "Need to work",
        bullets: [
          "The business is within 5 miles from the target downtown area which is great.",
          "The business is more than 5 miles but less than 7-8 miles  from the target downtown area which is not great but it’s still within limits. This may or may not be an issue depending on the area the business is located in.",
          "The business is more than 7 miles from the target downtown area which may or may not be an issue depending on the area the business is located in.",
          "The business is more than 10 miles from the target downtown area which makes it difficult to rank downtown. This may or may not be an issue depending on the people you’re trying to reach.",
        ],
      });

      addSpace(doc);

      await writeInDocx(doc, "priority", {
        status: "high",
        title: "GBP Categories",
      });

      await writeInDocx(
        doc,
        "text",
        {
          text: "Categories are one of the foundations for Google to understand what your business does. The ideal scenario is that our categories align with the top 3 results as this is a ranking factor.",
          font: "Arial",
          size: 20,
          bold: false,
        },
        {
          before: 200,
          after: 200,
        }
      );

      await writeInDocx(
        doc,
        "text",
        {
          text: "Top competitor categories",
          font: "Arial",
          size: 20,
          bold: false,
        },
        {
          before: 200,
          after: 200,
        }
      );

      await addPlaceHolderImage(doc);

      await writeInDocx(
        doc,
        "text",
        {
          text: "Your categories:",
          font: "Arial",
          size: 20,
          bold: false,
        },
        {
          before: 200,
          after: 200,
        }
      );

      await addPlaceHolderImage(doc);

      await writeInDocx(
        doc,
        "heading",
        {
          text: "Diagnosis Results",
          font: "DM Sans",
          size: 24,
          bold: true,
        },
        {
          before: 200,
          after: 200,
        }
      );

      await writeInDocx(doc, "diagnose", {
        status: "Need to work",
        bullets: [
          "Your categories are aligned with the top 3-5 GBP competitor rankings.",
        ],
      });

      addSpace(doc);

      await writeInDocx(doc, "priority", {
        status: "high",
        title: "GBP Images",
      });

      await writeInDocx(
        doc,
        "text",
        {
          text: "Images can play a crucial part of rankings and optimizations, as each image can provide context to google about what your business does. In addition there are advanced strategies we use adding text layers and QR codes to enhance visibility and online connectivity (QR codes point to other online business properties - like social media profiles - to let Google understand these all belong to the same business.",
          font: "Arial",
          size: 20,
          bold: false,
        },
        {
          before: 200,
          after: 200,
        }
      );

      if (gbp_images) {
        filteredImages = gbp_images?.["gbp-images"]?.find(
          (item) => item?.city === city
        );

        console.log(
          `________________________GBP Image______________________________\n`
        );
        console.log(
          `filtered Image >>>>>>>>>>>>>>>>`,
          filteredImages?.screenshots
        );

        if (filteredImages && filteredImages?.success) {
          // const fullPath = path.join(__dirname, item);
          await writeInDocx(doc, "image", {
            filePath: filteredImages?.filepath,
            transformation: { height: 600 },
          });
        }
      }
      await writeInDocx(
        doc,
        "heading",
        {
          text: "Diagnosis Results",
          font: "DM Sans",
          size: 24,
          bold: true,
        },
        {
          before: 200,
          after: 200,
        }
      );

      await writeInDocx(doc, "diagnose", {
        status: "Need to work",
        bullets: [
          "In general there’s a good amount of pictures. We would like to suggest thinking about your keywords and add relevant images that represent them. For example for the keyword Med Spa Southlake, we’d suggest adding images of Before and After. Optimizing the image names and adding text to them with keywords and variations.",
          "Adding Images that are branded and with QR codes and a text layer will also help with optimization",
        ],
      });

      addSpace(doc);

      await writeInDocx(doc, "priority", {
        status: "high",
        title: "GBP website & Booking Link",
      });

      await writeInDocx(
        doc,
        "text",
        {
          text: "This is to make sure the website link is pointing to the right page as well as the booking link. In addition we want to see an URL parameter tracking to know more about the interactions in your profile.",
          font: "Arial",
          size: 20,
          bold: false,
        },
        {
          before: 200,
          after: 200,
        }
      );

      await writeInDocx(
        doc,
        "text",
        {
          text: "You also want to have utm parameters in your link to track them ",
          font: "Arial",
          size: 20,
          bold: false,
        },
        {
          before: 200,
          after: 0,
        }
      );
      await writeInDocx(doc, "text", {
        text: "Example for main URL: ?utm_source=GMBmain&utm_medium=organic",
        font: "Arial",
        size: 20,
        bold: false,
      });
      await writeInDocx(
        doc,
        "text",
        {
          text: "Example for Booking URL: ?utm_source=GMBbooking&utm_medium=organic",
          font: "Arial",
          size: 20,
          bold: false,
        },
        {
          before: 200,
          after: 200,
        }
      );

      await writeInDocx(
        doc,
        "heading",
        {
          text: "Diagnosis Results",
          font: "DM Sans",
          size: 24,
          bold: true,
        },
        {
          before: 200,
          after: 200,
        }
      );

      await writeInDocx(doc, "diagnose", {
        status: "Need to work",
        bullets: [
          "Both website link and menu link go to different parts of your website.",
          "Adding Images that are branded and with QR codes and a text layer will also help with optimization",
          "Your GBP main website link is pointing to the wrong page.",
          "Your booking link links to a URL outside of your website. We recommend pointing it to a booking page on your website.",
          "Both your links are good!",
          "Your GBP main website link needs UTM parameters added for better tracking.",
          "Your GBP main website link has UTM parameters which is great for tracking.",
        ],
      });

      addSpace(doc);

      await writeInDocx(doc, "priority", {
        status: "high",
        title: "GBP Reviews",
      });

      await writeInDocx(
        doc,
        "text",
        {
          text: "While reviews are not a ranking factor, they are essential to show potential clients they can trust us. These are your reviews.",
          font: "Arial",
          size: 20,
          bold: false,
        },
        {
          before: 200,
          after: 200,
        }
      );
      //#this way

      if (gbp_images) {
        filteredReview = gbp_images?.["gbp-reviews"]?.find(
          (item) => item?.city === city
        );

        console.log(
          `________________________Reiview______________________________\n`
        );
        console.log(`filteredReview >>>>>>>>>>>>>>>>`, filteredReview);
        if (filteredReview && filteredReview?.success) {
          await writeInDocx(doc, "image", {
            filePath: filteredReview?.filepath,
            transformation: { height: 600 },
          });
        }
      }

      // await addPlaceHolderImage(doc)

      await writeInDocx(
        doc,
        "text",
        {
          text: "Here are some competitor reviews:",
          font: "Arial",
          size: 20,
          bold: false,
        },
        {
          before: 200,
          after: 200,
        }
      );

      console.log(
        `________________________Competitor______________________________\n`
      );
      console.log(`competitor >>>>>>>>>>>>>>>>`, item);
      await writeInDocx(doc, "image", {
        filePath: item?.search_screenshot_path,
        transformation: { height: 800 },
      });

      await writeInDocx(
        doc,
        "heading",
        {
          text: "Diagnosis Results",
          font: "DM Sans",
          size: 24,
          bold: true,
        },
        {
          before: 200,
          after: 200,
        }
      );

      await writeInDocx(doc, "diagnose", {
        status: "Need to work",
        bullets: [
          "You have less reviews but better ratings, great, keep focusing on getting great reviews we need to get to the number of competitor reviews.",
        ],
      });

      addSpace(doc);

      await writeInDocx(doc, "priority", {
        status: "high",
        title: "GBP Q&As",
      });

      await writeInDocx(
        doc,
        "text",
        {
          text: "Questions and Answers in your Google Business Profile are a ranking factor. We want to see questions related to your services and related topics with short but optimized answers to those questions.",
          font: "Arial",
          size: 20,
          bold: false,
        },
        {
          after: 200,
        }
      );

      await writeInDocx(
        doc,
        "text",
        {
          text: "You can find this by typing the name of the company on google and scrolling on your Google Business Profile.",
          font: "Arial",
          size: 20,
          bold: false,
        },
        {
          before: 200,
          after: 200,
        }
      );

      console.log(
        `________________________Question______________________________\n`
      );
      console.log(
        `Question >>>>>>>>>>>>>>>>`,
        item?.questions_screenshot_status
      );
      if (item?.questions_screenshot_status) {
        await writeInDocx(doc, "image", {
          filePath: item?.questions_screenshot_path,
          transformation: { height: 900 },
        });
      }

      addSpace(doc);

      await writeInDocx(
        doc,
        "heading",
        {
          text: "Diagnosis Results",
          font: "DM Sans",
          size: 24,
          bold: true,
        },
        {
          before: 200,
          after: 200,
        }
      );

      await writeInDocx(doc, "diagnose", {
        status: "Need to work",
        bullets: ["You don’t have any Q&As, this needs work."],
      });

      addSpace(doc);
      await writeInDocx(doc, "priority", {
        status: "high",
        title: "GBP Products",
      });

      await writeInDocx(
        doc,
        "text",
        {
          text: "Improving your products section is important to give your profile more visibility and attention. Products doesn’t mean “an item you sell” but can be considered a secondary section where you add some services, with descriptions and optimized images.",
          font: "Arial",
          size: 20,
          bold: false,
        },
        {
          after: 200,
        }
      );

      if (gbp_images) {
        filterProduct = gbp_images?.["gbp-profile-modal"]?.find(
          (item) => item?.city === city
        );

        console.log(
          `________________________Products______________________________\n`
        );
        console.log(`filterProduct >>>>>>>>>>>>>>>>`, filterProduct);

        if (filterProduct && filterProduct?.success) {
          await writeInDocx(doc, "image", {
            filePath: filterProduct?.["screenshots"]?.[0]?.filepath,
            transformation: { height: 450 },
          });
        }
      }

      addSpace(doc);

      await writeInDocx(
        doc,
        "heading",
        {
          text: "Diagnosis Results",
          font: "DM Sans",
          size: 24,
          bold: true,
        },
        {
          before: 200,
          after: 200,
        }
      );

      await writeInDocx(doc, "diagnose", {
        status: "Need to work",
        bullets: [
          "You have a good amount of products, we recommend to duplicate your services as products with keyword optimized products",
        ],
      });

      addSpace(doc);
      await writeInDocx(doc, "priority", {
        status: "high",
        title: "GBP Post Frequency",
      });

      await writeInDocx(
        doc,
        "text",
        {
          text: "Frequent posts and updates can help your GBP to reach more customers and increase visibility.",
          font: "Arial",
          size: 20,
          bold: false,
        },
        {
          after: 200,
        }
      );

      if (gbp_images) {
        filterFrequency = gbp_images?.["gbp-posts-frequency"]?.find(
          (item) => item?.city === city
        );
        console.log(
          `________________________Frequency______________________________\n`
        );
        console.log(
          `filterFrequency >>>>>>>>>>>>>>>>`,
          filterFrequency?.screenshots
        );
        if (filterFrequency && filterFrequency?.success) {
          // Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work

          await writeInDocx(doc, "image", {
            filePath: filterFrequency?.["screenshots"]?.[0]?.filepath,
            transformation: { height: 450 },
          });
        }
      }
      addSpace(doc);

      await writeInDocx(
        doc,
        "heading",
        {
          text: "Diagnosis Results",
          font: "DM Sans",
          size: 24,
          bold: true,
        },
        {
          before: 200,
          after: 200,
        }
      );

      await writeInDocx(doc, "diagnose", {
        status: "Need to work",
        bullets: [
          "You’re not posting frequently (at least 1 per week) which doesn’t take advantage of GBP engagement metrics.",
        ],
      });

      addSpace(doc);

      await writeInDocx(doc, "priority", {
        status: "medium",
        title: "GMB Links",
      });

      await writeInDocx(
        doc,
        "text",
        {
          // Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic // Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to work// Define logic with three states: Good, Opportunity, Need to workwith three states: Good, Opportunity, Need to work
          text: "We recommend maximizing this space and add as many social links as possible:",
          font: "Arial",
          size: 20,
          bold: false,
        },
        {
          after: 200,
        }
      );

      const items = [
        "Linkedin",
        "Facebook",
        "Instagram",
        "Youtube",
        "X/Twitter",
        "X/Twitter",
        "TikTok",
      ];

      for (const item of items) {
        // Write the current item from the array
        await writeInDocx(
          doc,
          "text",
          {
            text: item, // This will be each array item in the loop
            font: "Arial",
            size: 20,
            bold: false,
          },
          {}, // Empty options object for before/after spacing
          {}, // Additional empty options object
          {
            level: 0,
          }
        );
      }

      addSpace(doc);

      //#thier
      if (gbp_images) {
        filterLink = gbp_images?.["gbp-social-links"]?.find(
          (item) => item?.city === city
        );
        console.log(
          `________________________Links______________________________\n`
        );
        console.log(`filterLink >>>>>>>>>>>>>>>>`, filterLink?.screenshots);
        if (filterLink && filterLink?.success) {
          await writeInDocx(doc, "image", {
            filePath: filterLink?.["screenshots"]?.[0]?.filepath,
            transformation: { height: 200 },
          });
        }
      }
      await writeInDocx(
        doc,
        "heading",
        {
          text: "Diagnosis Results",
          font: "DM Sans",
          size: 24,
          bold: true,
        },
        {
          before: 200,
          after: 200,
        }
      );

      await writeInDocx(doc, "diagnose", {
        status: "Need to work",
        bullets: [
          "We need to add more social links like Youtube and Tik Tok to your GBP to help Google link all these together and have a better and more cohesive Digital connection among your company’s online assets.",
        ],
      });

      addSpace(doc);

      await writeInDocx(doc, "priority", {
        status: "medium",
        title: "GBP Name",
      });

      await writeInDocx(
        doc,
        "text",
        {
          text: "OPTIONAL: The name of your Google Business Profile can be a powerful tool to increase rankings and be more visible in your local area. There are some opportunities available to change the name of your GMB and receive the benefits although there are some potential drawbacks.",
          font: "Arial",
          size: 20,
          bold: false,
        },
        {
          after: 200,
        }
      );

      await writeInDocx(
        doc,
        "text",
        {
          text: "Example: If you have a Dental practice and the name of your practice doesn’t include the word Dentist in it or Dental",
          font: "Arial",
          size: 20,
          bold: false,
        },
        {
          after: 200,
        }
      );

      addSpace(doc);

      // await addPlaceHolderImage(doc)

      await writeInDocx(
        doc,
        "heading",
        {
          text: "Diagnosis Results",
          font: "DM Sans",
          size: 24,
          bold: true,
        },
        {
          before: 200,
          after: 200,
        }
      );

      await writeInDocx(doc, "diagnose", {
        status: "Need to work",
        bullets: [
          "Google Business Name includes the keyword 'Medspa' That’s a strong local SEO signal because your business name matching relevant search queries without keyword stuffing can help with visibility in the local pack.",
        ],
      });

      addLine(doc);

      cities.push(city);
    }
  }
  //#end
}

async function auditDYIDocx(doc, businessName, businessUrl) {
  await writeInDocx(
    doc,
    "heading",
    {
      text: "DIY",
      font: "Arial",
      size: 20,
      color: "000000",
    },
    {
      before: 500,
      after: 100, // spacing after heading in twips (20 = 1 pt)
    },
    {},
    {},
    {
      id: "section6",
      name: "section6",
    }
  );
  await writeInDocx(doc, "heading", {
    text: "SEO Audit and Recommendation",
    font: "DM Sans",
    size: 40,
    color: "2C91E6",
    bold: true,
  });

  await writeInDocx(
    doc,
    "heading",
    {
      text: `How to fix it yourself`,
      font: "Arial",
      size: 24,
      bold: true,
    },
    {
      after: 400,
    }
  );

  await writeInDocx(doc, "headingWithLinks", {
    heading: "Page speed core vitals:",
    links: [
      {
        title: "here",
        url: "https://www.youtube.com/watch?v=PU10N-uTFmg&ab_channel=MeteoricMoneyLabsbyTroyCherasaro",
      },
    ],
  });
  await writeInDocx(doc, "headingWithLinks", {
    heading: "Broken links:",
    links: [
      {
        title: "here",
        url: "https://www.youtube.com/watch?v=BuVSiQYVHsE&ab_channel=Edge45%C2%AESEOAgency",
      },
    ],
  });
  await writeInDocx(doc, "headingWithLinks", {
    heading: "Structured data and Schema markup: ",
    links: [
      {
        title: "here",
        url: "https://www.youtube.com/watch?v=6zFqDgtOw80&ab_channel=AteKeurentjes",
      },
    ],
  });
  await writeInDocx(doc, "headingWithLinks", {
    heading: "Redirections: ",
    links: [
      {
        title: "here",
        url: "https://www.youtube.com/watch?v=RxhpC0ryeP4&ab_channel=ScreamingFrog",
      },
      {
        title: "change links",
        url: "https://www.youtube.com/watch?v=xplxXerazIg&ab_channel=OsborneDigitalMarketing",
      },
    ],
  });
  await writeInDocx(doc, "headingWithLinks", {
    heading: "Titles: ",
    links: [
      {
        title: "here",
        url: "https://www.youtube.com/watch?v=x448sbr-6cI&ab_channel=WPBakery",
      },
    ],
  });
  await writeInDocx(doc, "headingWithLinks", {
    heading: "Content and embeds: ",
    links: [
      {
        title: "embed",
        url: "https://www.youtube.com/watch?v=plBGC0IPz3U&ab_channel=AlexCooper-WPEagle",
      },
      {
        title: "add sections",
        url: "https://www.youtube.com/watch?v=TE5rPGDJgQk&ab_channel=ProfileTree",
      },
    ],
  });
  await writeInDocx(doc, "headingWithLinks", {
    heading: "Image alt tags: ",
    links: [
      {
        title: "here",
        url: "https://www.youtube.com/watch?v=Ijz0Kq53_64&ab_channel=BryceMatheson",
      },
    ],
  });
  await writeInDocx(doc, "headingWithLinks", {
    heading: "Pages creation and content optimization:",
    links: [
      {
        title: "here",
        url: "https://www.youtube.com/watch?v=JxZmI3VxduM&ab_channel=RankMathSEO",
      },
    ],
  });

  addLine(doc);
}

async function addSpace(doc, options = {}) {
  const { before = 0, after = 0 } = options;
  await writeInDocx(
    doc,
    "text",
    {
      text: "",
    },
    { before, after }
  );
}

async function addLine(doc, options = {}) {
  const { before = 400, after = 200 } = options;
  await writeInDocx(
    doc,
    "text",
    {
      text: "_________________________________________________________________________",
      font: "Arial",
      size: 22,
      bold: false,
    },
    { before, after }
  );
}

async function addPlaceHolderImage(doc, filePath = "jumper-media-automate/image-placeholder.jpg") {
  await writeInDocx(doc, "image", { filePath });
}
async function waitForTaskCompettion(taskId) {
  return new Promise((resolve, reject) => {
    let counter = -1;
    console.log(
      `________________________waitForTaskCompletion____________________\n`
    );
    const interval = setInterval(async () => {
      counter++;
      try {
        let { data } = await getPOPTask(taskId);
        response = data;

        console.log(`_______________counter:${counter}__________________\n`);
        console.log(response);

        if (response?.date_done) {
          clearInterval(interval);
          appendToLogReport({
            source: "Page Optimizer",
            purpose: "Getting Report from Page Optimizer",
            success: true,
            error: "",
          });
          resolve(response);
        }

        if (counter > 2) {
          clearInterval(interval);
          console.log("_______________POP ISSUE_____________\n");
          console.log("___________________Max retries reached____________\n");
          appendToLogReport({
            source: "Page Optimizer",
            purpose: "Getting Report from Page Optimizer",
            success: false,
            error: "Max retries reached",
          });
          resolve({ status: "fail", message: "Max retries reached" });
        }
      } catch (err) {
        clearInterval(interval);
        appendToLogReport({
          source: "Page Optimizer",
          purpose: "Getting Report from Page Optimizer",
          success: false,
          error: err.message,
        });
        console.log("_______________POP ISSUE_____________\n");
        console.log(`___________________${err.message}___________\n`);
        resolve(err);
      }
    }, 1000 * 1); // check every 2 minutes
  });
}

async function generateContentOptimizationReport(keyword, businessUrl) {
  console.log(
    `-------------------------Callig creating Task createPOPTask-----------------------\n`
  );
  let { data } = await createPOPTask(keyword, businessUrl);

  let response;
  console.log(`-------------------------Waiting-----------------------\n`);
  let { lsaPhrases, prepareId, variations } = await waitForTaskCompettion(
    data.taskId
  );

  console.log(
    `-------------------------Generting Report generatePOPReport-----------------------\n`
  );
  let make = await generatePOPReport(lsaPhrases, prepareId, variations);
  console.log(`-------------------------Waiting-----------------------\n`);
  response = await waitForTaskCompettion(make.data.taskId);

  return { reportId: make?.data?.reportId, response };
}

// main();

async function test() {
  const businessName = "mobigleam";
  // const businessUrl = 'https://squeegeedeta
  const businessUrl = "https://mobigleam.com";

  // const highestRankingKeyword = await extractHighestSearchVolumeKeyword(
  //   businessUrl
  //     );
  //     console.log("Returned highest ranking keyword:::", highestRankingKeyword);
  //     const competitor = await getHigestPerformingCompetitors(
  //       highestRankingKeyword
  //     );
  //     console.log("Returned Competitor:::", competitor);
  //     const competitorKeywords = await getCompetitorKeywords(competitor)
  //     console.log("Returned competitor keywords:::",competitorKeywords)

  let competitorKeywords = [
    "car detailing Dubai",
    "mobile car detailing Dubai",
    "car polishing Dubai",
    "ceramic coating Dubai",
    "interior car cleaning Dubai",
    "exterior car wash Dubai",
    "car steam cleaning Dubai",
    "engine cleaning Dubai",
    "headlight restoration Dubai",
    "paint protection Dubai",
    "nano ceramic coating Dubai",
    "car scratch removal Dubai",
    "car seat shampooing Dubai",
    "mobile car wash Dubai",
    "car detailing service Dubai",
    "premium car wash Dubai",
    "auto detailing Dubai",
    "on-demand car detailing Dubai",
    "car wash at home Dubai",
    "car disinfection service Dubai",
  ];

  // await SERanking(businessUrl,businessName,competitorKeywords)
  //  await extractHighestSearchVolumeKeyword("https://calderonstires.com/");
  // await fetchSearchEngineData('10113578', '200');

  // return

  // cleanup_data = await cleanup('asdsd', process.env.SCREAM_FROG_CSV_FILE, "URL,Title,H1,Desc.csv")

  const keyword = "Tire shop";

  // let {data}=await createProject(businessUrl,keyword);
  // console.log(data);
  // return

  let finish = await getHigestPerformingCompetitors("car detailing portland");
  console.log(finish);
  //
  // return

  //

  // console.log(response)

  // const data = require('./page_optimizer.json');
  // console.log(data.report);

  // return

  //  await runScreamingFrog(businessUrl,"Links:All");

  // await runScreamingFrog(businessUrl);

  // const csvFiles = [
  //   { path: 'internal_all.csv', sheetName: 'Raw' },  // this will create the file
  //   { path: 'URL,Title,H1,Desc.csv', sheetName: 'URL, Title, H1 etc.' },
  //   { path: 'redirections.csv', sheetName: 'Cannibalization' },
  //   { path: 'broken_links.csv', sheetName: 'Keyword Research' },
  // ];

  // uploadMultipleCSVs( businessUrl,csvFiles).then(console.log);

  let docxFileName = `${businessName}.docx`;
  const doc = await makeDoc(docxFileName);

  //     sheetId=await createGoogleSheetFile(businessUrl,process.env.SCREAM_FROG_CSV_FILE);
  //     cleanup_data  = await cleanup(sheetId,process.env.SCREAM_FROG_CSV_FILE,"URL,Title,H1,Desc.csv")
  //    cleanup_url=cleanup_data.cleanup_url
  //    totalCount=cleanup_data.totalCount
  //    let cannibalization_ss_url=await cannibalizationSnapshot(cleanup_url)
  // //#work here

  // await writeInDocx(doc,"image",{filePath:cannibalization_ss_url});

  // let broken_link_url=await broken_links(process.env.SCREAM_FROG_CSV_FILE,'broken_links.csv')

  // console.log("broken_links.csv>>>>>>>>>>>>>>",broken_link_url)
  // await addSpace(doc,{before:200,before:200});

  // await writeInDocx(doc,"hyperlink",{title:"find them here",url:broken_link_url})
  // //  await runScreamingFrog(businessUrl);
  // //  rich_url=await InitializeRichResultsScript(businessUrl)

  // // await auditIntroductionDocx(doc,businessName,businessUrl) //todo need to automate

  // // await auditKWResearchDocx(doc,businessName,businessUrl) //todo need to automate

  // await auditTechnicalSEODocx(doc,businessName,businessUrl)//todo need to automate

  // await auditOnPageSEODocx(doc, businessName, businessUrl)//todo need to automate

  // // await auditOffPageSEODocx(doc,businessName,businessUrl)//todo need to automate

  // await auditGBPDocx(doc, businessName,businessUrl)//todo need to automate

  // // await auditDYIDocx(doc,businessName,businessUrl)//todo need to automate

  const responseContent = await generateContentOptimizationReport(
    keyword,
    businessUrl
  );
  //  const responseContent = require("./page_optimizer.json")

  console.log(responseContent);

  // return
  const optimizationScore =
    responseContent?.response?.report?.cleanedContentBrief?.pageScore
      ?.pageScore ?? 0;
  const currentWordCount =
    responseContent?.response?.report?.wordCount?.current ?? 0;
  const targetWordCount =
    responseContent?.response?.report?.wordCount?.target ?? 0;

  await writeInDocx(
    doc,
    "heading",
    {
      text: `Keyword: ${keyword}`,
      font: "Arial",
      size: 22,
      bold: true,
    },
    { after: 200 }
  );

  await writeInDocx(
    doc,
    "heading",
    {
      text: `ReportId: ${responseContent?.response?.reportId}`,
      font: "Arial",
      size: 22,
      bold: true,
    },
    { after: 200 }
  );

  await writeInDocx(
    doc,
    "heading",
    {
      text: `Time: ${responseContent?.date_done}`,
      font: "Arial",
      size: 22,
      bold: true,
    },
    { after: 200 }
  );
  writeInDocx(doc, "addContent", {
    optimizationScore,
    currentWordCount,
    targetWordCount,
  });

  let contentOptizationStatus = "Opportunity";
  let contentOptimizationComment = [];

  // Handle Optimization Score
  if (optimizationScore < 60) {
    contentOptizationStatus = "Need to work";
    contentOptimizationComment.push(
      "The overall optimization score is low. Important elements like headings, content structure, or keyword usage likely need improvement."
    );
  } else if (optimizationScore >= 81) {
    contentOptizationStatus = "Good";
    contentOptimizationComment.push(
      "Great job! The content is well-optimized according to the tool. Just ensure content is kept up-to-date."
    );
  } else {
    contentOptizationStatus = "Opportunity";
    contentOptimizationComment.push(
      "Your page has decent optimization, but improvements in headings, content structure, or keyword usage can help push it further."
    );
  }

  // Handle Word Count Comparison
  if (currentWordCount < targetWordCount * 0.6) {
    contentOptimizationComment.push(
      `The current word count is significantly low (${currentWordCount} words vs. ${targetWordCount} target). Add more relevant content to compete.`
    );
  } else if (currentWordCount >= targetWordCount * 0.9) {
    contentOptimizationComment.push(
      `Your content length is close to the target (${currentWordCount} / ${targetWordCount}). No major changes needed.`
    );
  } else {
    contentOptimizationComment.push(
      `The word count is slightly below the target (${currentWordCount} / ${targetWordCount}). Consider expanding content for better competitiveness.`
    );
  }

  // Write to DOCX
  await writeInDocx(doc, "diagnose", {
    status: contentOptizationStatus,
    bullets: contentOptimizationComment,
  });
  await saveDoc(doc, docxFileName);
}

async function SERanking(
  businessUrl,
  businessName,
  keywords,
  sheetId,
  countryName = "USA"
) {
  let { data } = await createProject(businessUrl, businessName);

  let siteId = data?.site_id;
  console.log(siteId);

  let searchIds = await getSearchEngine();

  let searchEngine = searchIds.find(
    (item) => countryName === item?.name?.replace(/google/i, "").trim()
  );

  let { site_engine_id } = await AddSearchEngineData(
    siteId,
    searchEngine?.id ?? 200
  );

  let resultAddWords = await addKeywordsToSERanking(siteId, keywords);

  const today = new Date();
  const report_period_to = today.toISOString().split("T")[0];

  const month = new Date();
  month.setMonth(month.getMonth() - 1); // Go back 1 month
  const report_period_from = month.toISOString().split("T")[0];

  let response = null;
  setTimeout(async () => {
    response = await getKeywordStatistics(
      siteId,
      site_engine_id,
      report_period_from,
      report_period_to
    );

    let name = await CSVtoSE_RANKING(response[0]?.keywords);
    let url = await storeCSVInGoogleSheet(sheetId, name, "Ranking_vlookup");
    console.log(url);
  }, 1000 * 30);
}

// test()
module.exports = {main}