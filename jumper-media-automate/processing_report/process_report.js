const fs = require('fs');
const path = require('path');

const LOG_FOLDER = path.join(__dirname, 'process_report_log');

let returnfilePath=null

// Ensure the folder exists
function ensureLogFolderExists() {
  if (!fs.existsSync(LOG_FOLDER)) {
    fs.mkdirSync(LOG_FOLDER, { recursive: true });
    console.log(`Created folder: ${LOG_FOLDER}`);
  }
}

function createJsonLogFile(fileName, nameValue) {
    ensureLogFolderExists();
  
    if (!fileName.endsWith('.json')) {
      fileName += '.json';
    }
  
    const filePath = path.join(LOG_FOLDER, fileName);
  
    // If file exists, delete it
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Existing file deleted: ${filePath}`);
    }
  
    // Create new file with default content
    const content = {
      name: nameValue,
      timestamp: new Date().toISOString(),
      report: []
    };
  
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');
    console.log(`Created new log file: ${filePath}`);
    returnfilePath=filePath
    
    return filePath;
  }

  /**
   * Ensure directory exists
   */
  async function ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`📂 Created directory: ${dirPath}`);
    }
  }
  
// Append an object to the "report" array
function appendToLogReport(reportItem) {
  ensureLogFolderExists();

  reportItem.date= new Date().toISOString()

 
  fileName=getLastCreatedFilePath();

  const filePath = fileName

  if (!fs.existsSync(filePath)) {
    console.error(`File does not exist: ${filePath}`);
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  let json;

  try {
    json = JSON.parse(fileContent);
  } catch (err) {
    console.error(`Error parsing JSON from file: ${err.message}`);
    return;
  }

  if (!Array.isArray(json.report)) {
    console.error(`"report" is not an array in file: ${filePath}`);
    return;
  }

  json.report.push(reportItem);

  fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf-8');
  console.log(`Appended item to "report" in ${filePath}`);
}



function getLastCreatedFilePath() {
    if (!returnfilePath) {
      console.error('No file has been created yet.');
      return null;
    }
    return returnfilePath;
  }


module.exports = { createJsonLogFile,appendToLogReport,getLastCreatedFilePath };