const { createCSVAsync } = require("./csv-writer");
const { URL } = require("url");
const { createReadStream } = require('fs');
const csv = require('csv-parser')
require("dotenv").config();
const fs = require('fs').promises
const domain = "https://api.dataforseo.com/v3";
const getRecords = async () => {
  const records = await readCsvFile('jumper-media-automate/gbp_output_data/gbp_enhanced_records.csv');
  return records;
}

//get all regions of a country
async function getAllLocations(records) {
  const axios = require("axios");
  const clientCountryCode = records[0]["Country_Iso_Code"]
  return await axios({
    method: "GET",
    url: `${domain}/serp/google/locations/${clientCountryCode}`,
    auth: returnAuth(),
    headers: {
      "content-type": "application/json",
    },
  })
  .then((res) => {
    const filteredUSRegions = res.data.tasks[0].result;
    const filteredUSRegionsArray = filteredUSRegions?.map(
        (entity, index) => {
          return [
            index + 1,
            entity.location_name,
            entity.location_code,
            entity.location_code_parent,
            entity.country_iso_code,
            entity.location_type,
          ];
        }
      );
    createCSVAsync(
        [
          "No.",
          "Location_Name",
          "Location_Code",
          "Location_Code_Parent",
          "Country_ISO_Code",
          "Location_Type",
        ],
        filteredUSRegionsArray,
        "./jumper-media-automate/data_for_seo_reports/Fetched_Serp_Locations.csv",
        ","
      );
      console.log("Created Fetched_Serp_Locations Successfully!");

    // console.log("Locations:::",filteredUSRegions)
    // fs.writeFileSync('fetched_serp_locations.json',JSON.stringify(filteredUSRegions))
    return filteredUSRegions;
})
}

async function readCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        console.log(
          `📁 Successfully loaded ${results.length} records from CSV`
        );
        resolve(results);
      })
      .on("error", reject);
  });
}

async function getLocationCode(rawURL) {
  const records = await getRecords();
  const allLocations = await getAllLocations(records);
  const clientCity = records.find((entity) => {
    if(entity.URL.includes(rawURL)) {
      return entity;
    }
  });
  console.log("Client city:::",clientCity.City)
  const locationCode = allLocations.find((location) => {
    // console.log("Each location:::",location)
    const isCityFound = location.location_name.includes(clientCity.City)
    if(isCityFound) {
      const isStateFound = location.location_name.includes(clientCity.State_Short) || location.location_name.includes(clientCity.State_Long)
      if(isStateFound) {
        console.log(`Our matched address is ${location.location_name} and code is ${location.location_code}`);
        return location.location_code;
      }
    }
  });
  return locationCode.location_code;
}

async function extractHighestSearchVolumeKeyword(rawUrl) {
  const axios = require("axios");
  // const locationCode = await getLocationCode(rawUrl);
  return await axios({
    method: "post",
    url: `${domain}/dataforseo_labs/google/keywords_for_site/live`,
    auth: returnAuth(),
    data: [
      {
        target: rawUrl,
        language_code: "en",
        location_code: 2840,
        include_serp_info: true,
        include_subdomains: true,
        filters: ["serp_info.se_results_count", ">", 0],
        order_by: ["relevance,desc", "keyword_info.search_volume,desc"],
        limit: 10,
      },
    ],
    headers: {
      "content-type": "application/json",
    },
  })
    .then(function (response) {
      var res = response["data"];

      const keywordsArray = res?.tasks?.[0]?.result?.[0]?.items;
      // console.log(keywordsArray)
      const sortedKeywordsArray = keywordsArray?.sort(
        (a, b) => b.keyword_info.search_volume - a.keyword_info.search_volume
      );
      const highestRankedKeyword = sortedKeywordsArray?.[0];

      return highestRankedKeyword?.keyword;
    })
    .catch(function (error) {
      console.log("Error extractHighestSearchVolumeKeyword:::", error);
    });
}

async function getHigestPerformingCompetitors(rankingKeyword, rawURL, locationCode=2840) {
  const axios = require("axios");

  try {
    const processedName = new URL(rawURL).hostname;

    const response = await axios({
      method: "post",
      url: `${domain}/serp/google/organic/live/advanced`,
      auth: returnAuth(),
      data: [
        {
          depth: 18,
          language_code: "en",
          location_code: locationCode,
          keyword: rankingKeyword,
          calculate_rectangles: true,
        },
      ],
      headers: {
        "content-type": "application/json",
      },
    });

    const comparisonKeywordsArray = response?.data?.tasks?.[0]?.result?.[0]?.items
      ?.filter((comparisonKeyword) => {
        return (
          comparisonKeyword.type === "local_pack" ||
          comparisonKeyword.type === "organic"
        );
      })
      .slice(0, 13);

    let competitor = comparisonKeywordsArray?.[0]?.domain || "";

    const competitorComparisonDataArray = comparisonKeywordsArray?.map(
      (entity, index) => {
        return [
          index + 1,
          entity.type,
          rankingKeyword,
          entity.domain,
          "#",
          "#",
          entity?.rating?.value || "",
        ];
      }
    ) || [];

    const hasBusinessDomain = competitorComparisonDataArray.some((entity) =>
      entity.includes(processedName)
    );

    if (!hasBusinessDomain) {
      competitorComparisonDataArray.push([
        13,
        "organic",
        rankingKeyword,
        rawURL,
        "#",
        "#",
        "",
      ]);
    }

    await createCSVAsync(
      [
        "No.",
        "Type",
        "Keyword",
        "Url",
        "Backlinks",
        "Referring Domains",
        "Domain Rating",
      ],
      competitorComparisonDataArray,
      "./jumper-media-automate/data_for_seo_reports/Competitor_Comparison.csv",
      ","
    );

    console.log("Created Competitor Comparison Table Successfully!");
    return competitor;
  } catch (error) {
    console.log("__________________________________DataForSEO__________________________________");
    console.log("Error in getHigestPerformingCompetitors:", error.message);
  }
}


async function getCompetitorKeywords(competitorURL,locationCode=2840) {
  const axios = require("axios");
  return await axios({
    method: "post",
    url: `${domain}/dataforseo_labs/google/keywords_for_site/live`,
    auth: returnAuth(),
    data: [
      {
        target: competitorURL,
        language_code: "en",
        location_code: locationCode,
        include_serp_info: true,
        include_subdomains: true,
        filters: ["serp_info.se_results_count", ">", 0],
        order_by: ["relevance,desc", "keyword_info.search_volume,desc"],
        limit: 10,
      },
    ],
    headers: {
      "content-type": "application/json",
    },
  })
    .then(async function (response) {
      var rawCompetitorKeywordsData =
        response?.data?.tasks?.[0]?.result?.[0]?.items;
      const structuredCompetitorKeywordsData = rawCompetitorKeywordsData?.map(
        (keywordData, index) => {
          return [
            index + 1,
            keywordData.keyword || "",
            keywordData.keyword_info.search_volume || "",
            "#",
            keywordData.keyword_properties.keyword_difficulty,
            "#",
          ];
        }
      );
      const competitorKeywords = rawCompetitorKeywordsData?.map(
        (keywordsData) => {
          return keywordsData.keyword;
        }
      );

      await createCSVAsync(
        [
          "No.",
          "Keyword",
          "Volume",
          "Current_Position",
          "Keyword_Difficulty",
          "Ranking Page",
        ],
        structuredCompetitorKeywordsData,
        "./jumper-media-automate/data_for_seo_reports/Keyword_Research.csv",
        ","
      );

      console.log("Created Keyword Research Table Successfully!");
      return competitorKeywords;
    })
    .catch(function (error) {
      console.log("Error getCompetitorKeywords:::", error);
    });
}

function returnAuth() {
  return {
    username: process.env.DFSEO_USERNAME,
    password: process.env.DFSEO_PASSWORD,
  };
}

async function ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`📂 Created directory: ${dirPath}`);
    }
  }

if (require.main === module) {
  // extractHighestSearchVolumeKeyword('https://squeegeedetail.com')
  (async () => {
    await ensureDirectoryExists('jumper-media-automate/data_for_seo_reports')
    const locationCode = await getLocationCode("https://squeegeedetail.com")
    console.log("Final Location Code:::",locationCode)
    const highestRankingKeyword = await extractHighestSearchVolumeKeyword(
      "https://squeegeedetail.com"
    );
    console.log("Returned highest ranking keyword:::", highestRankingKeyword);
    const competitors = await getHigestPerformingCompetitors(
      "car detailing portland",
      "https://squeegeedetail.com",
      
    );
    console.log("Returned Competitor:::", competitors);
    const competitorKeywords = await getCompetitorKeywords("dapperpros.com");
    console.log("Returned competitor keywords:::", competitorKeywords);
  })();
}

module.exports = {
  getLocationCode,
  extractHighestSearchVolumeKeyword,
  getHigestPerformingCompetitors,
  getCompetitorKeywords,
};
