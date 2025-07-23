

const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { storeCSVInGoogleSheet } = require("./google_sheet");

async function broken_links(sheetId, filePath = 'internal_all.csv', outputFileName = 'redirect_links.csv') {
  const redirectLinks = [];
  const headersSet = new Set();

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const statusCode = row['Status Code'];
        const code = parseInt(statusCode);

        if (code === 404) {
          // Capture dynamic headers
          Object.keys(row).forEach(header => headersSet.add(header));
          redirectLinks.push(row);
        }
      })
      .on('end', async () => {
        try {
          // Generate headers dynamically
          let headers = Array.from(headersSet).map(h => ({ id: h, title: h }));
          console.log(headers)
          if(headers.length>0){
          headers[0]['title']='Type'
        }
        else{
          headers=[
            { id: 'Type', title: 'Type' },
            { id: 'Source', title: 'Source' },
            { id: 'Destination', title: 'Destination' },
            { id: 'Size (Bytes)', title: 'Size (Bytes)' },
            { id: 'Alt Text', title: 'Alt Text' },
            { id: 'Anchor', title: 'Anchor' },
            { id: 'Status Code', title: 'Status Code' },
            { id: 'Status', title: 'Status' },
            { id: 'Follow', title: 'Follow' },
            { id: 'Target', title: 'Target' },
            { id: 'Rel', title: 'Rel' },
            { id: 'Path Type', title: 'Path Type' },
            { id: 'Link Path', title: 'Link Path' },
            { id: 'Link Position', title: 'Link Position' },
            { id: 'Link Origin', title: 'Link Origin' }
          ];
        }

          const writer = createCsvWriter({
            path: outputFileName,
            header: headers,
          });

          await writer.writeRecords(redirectLinks);
          const url = await storeCSVInGoogleSheet(sheetId, outputFileName, outputFileName);
          resolve(url);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

module.exports = { broken_links };