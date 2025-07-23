const csv = require('csvtojson');
const fs = require('fs');
const path = require('path');



/**
 * Parses a CSV file and returns headers + JSON data
 * @param {string} fileName - Name of the CSV file to parse
 * @returns {Promise<{ headers: string[], jsonArray: object[] }>}
 */
async function csvToJsonWithHeaders(fileName, columnsToRemove = []) {
    const csvFilePath = path.join(__dirname, fileName);
  
    try {
      const jsonArray = await csv().fromFile(csvFilePath);
      
      // If no data, return early
      if (jsonArray.length === 0) {
        return { headers: [], jsonArray: [] };
      }
      
      // Get original headers
      const originalHeaders = Object.keys(jsonArray[0]);
      
      // Filter out columns to remove (case-insensitive comparison)
      const filteredHeaders = originalHeaders.filter(header => 
        !columnsToRemove.some(colToRemove => 
          header.toLowerCase() === colToRemove.toLowerCase()
        )
      );
      
      // Remove specified columns from each row
      const filteredJsonArray = jsonArray.map(row => {
        const filteredRow = {};
        filteredHeaders.forEach(header => {
          filteredRow[header] = row[header];
        });
        return filteredRow;
      });
  
      // Optionally, save JSON output to a file
      fs.writeFileSync('output.json', JSON.stringify(filteredJsonArray, null, 2));
  
      return { 
        headers: filteredHeaders, 
        jsonArray: filteredJsonArray 
      };
    } catch (err) {
      console.error('Failed to parse CSV:', err);
      throw err; // re-throw to allow the caller to handle it
    }
}


  module.exports = {csvToJsonWithHeaders};