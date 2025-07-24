const path = require("path");
const readline = require("readline");
const fs = require("fs");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const OpenAI = require("openai");
const { storeCSVInGoogleSheet } = require("./google_sheet");
const {appendToLogReport} = require("./processing_report/process_report")

// Initialize OpenAI SDK v5.0.2
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



// Send data to ChatGPT and save response to CSV
async function canniblization(sheetId,inputFile, outputFile) {
  
  try {
    const records = await readCSV(inputFile);
    if (records.length === 0) throw new Error("No valid rows found in CSV.");

    const dataBlock = records.map((r) => `${r.url},${r.title}`).join("\n");

    const prompt = `
  Analyze the following URLs and titles for keyword cannibalization issues. 
  Return ONLY a CSV format with exactly 6 columns and these headers: URL,Title,Primary_Keywords,Cannibalization_Risk,Conflicting_URLs,Recommendations
  
  CRITICAL RULES:
  1. Output must be valid CSV format with EXACTLY 6 columns per row
  2. Use double quotes around fields that contain commas, semicolons, or newlines
  3. Replace any internal quotes with single quotes
  4. No additional text, explanations, or markdown formatting
  5. Cannibalization_Risk must be exactly one of: Low, Medium, High
  6. Primary_Keywords should be 2-3 keywords separated by semicolons
  7. Conflicting_URLs should list conflicting URLs separated by semicolons (or "None" if no conflicts)
  8. Recommendations should be brief actionable advice in one sentence
  9. Every row must have exactly 6 comma-separated values
  10. If a field is empty, use an empty string (not "N/A" or similar)
  
  Data:
  URL,Title
  ${dataBlock}
  `;

    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an SEO expert. Return only valid CSV data with exactly 6 columns per row. No explanations or extra text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const resultText = chatResponse.choices[0].message.content.trim();

//     if (!resultText.includes(","))
//       throw new Error("Invalid CSV output from OpenAI.");

//     const lines = resultText.split("\n");

// const firstTwoHeader=['"Address"','"Title 1"'];
// // Extract only the first two columns (URL and Title) for the rest
// const extractedData = lines.slice(1)
//   .map((line) => {
//     const match = line.match(/^"([^"]*)","([^"]*)"/);
//     if (!match) return null;
//     return `"${match[1]}","${match[2]}"`;
//   })
//   .filter(Boolean); // Remove nulls

// // Prepend the header back
// const finalCsv = [firstTwoHeader, ...extractedData].join("\n");
const requiredHeader = `"URL","Title","Primary_Keywords","Cannibalization_Risk","Conflicting_URLs","Recommendations"`;

const lines = resultText.split("\n").map(l => l.trim()).filter(l => l);

// Check if the first row is the expected header
const hasValidHeader = lines[0].toLowerCase().includes("url") && lines[0].split(",").length === 6;

// Add the header only if missing
const finalCsv = hasValidHeader
  ? lines.join("\n")
  : [requiredHeader, ...lines].join("\n");

// Write to file
fs.writeFileSync(outputFile, finalCsv, 'utf8');

    // fs.writeFileSync(outputFile, resultText);

    let url = await storeCSVInGoogleSheet(sheetId,path.join(__dirname,`../${outputFile}`),outputFile);

    return url;


    appendToLogReport({source:"Open AI",purpose:"Cannibalization",success:true,error:''})

    console.log(`✅ CSV analysis saved to: ${outputFile}`);
  } catch (err) {

    console.log("____________________________Cannibalization Error______________________________\n");

    appendToLogReport({source:"Open AI",purpose:"Cannibalization",success:false,error:err.message})
    
    console.error("❌ Error:", err.message);
}
}

// Read CSV file and extract rows
function readCSV(inputFile) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(inputFile)
      .pipe(csv())
      .on("data", (data) => {
        if (data["URL"] && data["Title 1"]) {
          results.push({ url: data["URL"], title: data["Title 1"] });
        }
      })
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

async function canniblizationDiagnoseResult(filePath){

  try{
    const records = await readCSV(filePath);
    if (records.length === 0) throw new Error("No valid rows found in CSV.");

    const dataBlock = records.map((r) => `${r.url},${r.title}`).join("\n");

    const prompt = `
    Analyze the following list of URLs and titles for overall keyword cannibalization and SEO optimization issues.
    
    Return ONLY one JSON object using this exact format:
    {
      "status": "Good" | "Need to work" | "Opportunity",
      "comments": [
        "Short actionable comment 1",
        "Short actionable comment 2",
        ...
      ]
    }
    
    RULES:
    1. The "status" should summarize the entire dataset's SEO quality and cannibalization risk:
       - "Good" = No major issues, everything is optimized
       - "Opportunity" = Mostly fine, with room for improvements
       - "Need to work" = Multiple instances of keyword overlap or poor optimization
    2. Include no more than 5 short and precise comments — each must be actionable
    3. Focus on patterns across the dataset, not individual URLs
    4. Do not return any markdown, explanation, text, or formatting — only raw JSON as described
    
    Here is the data:
    URL,Title
    ${dataBlock}
    `;
    

    
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
          "You are an SEO expert. Return only JSON. Do not include any text or formatting other than a raw JSON array.",
        
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const resultText = chatResponse.choices[0].message.content.trim();
   
    appendToLogReport({ source: "Open AI", purpose: "Cannibalization Diangose Results", success: true, error: '' })

    return JSON.parse(resultText);

  }
  catch(error){
   
    appendToLogReport({ source: "Open AI", purpose: "Cannibalization Diangose Results", success: false, error: error.message })
  }

}

module.exports = { canniblization,canniblizationDiagnoseResult };
