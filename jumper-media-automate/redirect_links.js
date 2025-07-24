const path = require('path');
const readline = require('readline');

const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { storeCSVInGoogleSheet }=require("./google_sheet")


  async function redirect_links(sheetId,filePath = 'internal_all.csv',outputFileName='redirect_links.csv') {

    const redirectLinks = [];
    
    return new Promise((resolve, reject) => {

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          const contentType = row['Content Type'];
          const statusCode = row['Status Code'];
          const address = row['URL Encoded Address'];

          if (contentType === 'text/html; charset="utf-8"') {
            const code = parseInt(statusCode);
            const endsWithPng = (address || '').toLowerCase().endsWith('.png');

            if (endsWithPng) return;
  
            row.filtered = 'yes';

              if (code === 301) {

                const valuesArray = Object.values(row);
            
                row.address=valuesArray[0] || ''
                redirectLinks.push(row);
            }
          }
        })
        .on('end', async () => {

          try {
    
  
            const specificColumn = [
              
              { id: 'address', title: 'Address' },
              { id: 'Content Type', title: 'Content Type' },
              { id: 'Status Code', title: 'Status Code' },
              { id: 'Status', title: 'Status' },
              { id: 'Indexability', title: 'Indexability' },
              { id: 'Indexability', title: 'Indexability Status' },
              { id: 'inlinks', title: 'Inlinks' },
              { id: 'Response Time', title: 'Response Time' },
              { id: 'Redirect URL', title: 'Redirect URL' },          

              { id: 'Redirect Type', title: 'Redirect Type' },

            ];
  
            // Write the CSV file
            const goodWriter = createCsvWriter({
              path: outputFileName,
              header: specificColumn,
            });
  
            // console.log(redirectLinks)
            await goodWriter.writeRecords(redirectLinks);
            // console.log('✔ redirect_links.csv written.');
  
            // Store in Google Sheets and return the URL
            const url = await storeCSVInGoogleSheet(sheetId,path.join(__dirname,`../${outputFileName}`),outputFileName);
            resolve(url);
      
            // resolve("need to uncomment")
            
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  module.exports = { redirect_links };


