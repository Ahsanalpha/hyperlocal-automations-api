const path = require('path');
const readline = require('readline');

const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const { storeCSVInGoogleSheet }=require("./google_sheet")


  async function cleanup(sheetId,filePath = 'internal_all.csv',outputFileName='filtered_output.csv') {
    const records = [];
    
    return new Promise((resolve, reject) => {

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          const contentType = row['Content Type'];
          const statusCode = row['Status Code'];
          const address = row['URL Encoded Address'];
  
          if (contentType === 'text/html;charset=utf-8') {
            const code = parseInt(statusCode);
            const endsWithPng = (address || '').toLowerCase().endsWith('.png');
  
            if (endsWithPng) return;
  
            row.filtered = 'yes';
  
            if (code === 200) {
              records.push(row);
            } 
          }
        })
        .on('end', async () => {
          try {
            

            const specificColumn = [
              { id: 'URL Encoded Address', title: 'URL' },
              { id: 'Title 1', title: 'Title 1' },
              { id: 'Meta Description 1', title: 'Meta Description 1' },
              { id: 'H1-1', title: 'H1-1' },
              { id: 'H1-2', title: 'H1-2' },
              { id: 'H2-1', title: 'H2-1' },
          
              { id: 'Status Code', title: 'Status Code' },
              { id: 'Indexability', title: 'Indexability' },
            ];

      
  
            // Write the CSV file
            const goodWriter = createCsvWriter({
              path: outputFileName,
              header: specificColumn,
            });
  
            await goodWriter.writeRecords(records);
           
            console.log('✔ filtered_output.csv written.');
  
            console.log(path.join(__dirname,`../${outputFileName}`))
            // Store in Google Sheets and return the URL
            const url = await storeCSVInGoogleSheet(sheetId,path.join(__dirname,`../${outputFileName}`),outputFileName);
console.log("URL google sheet")
console.log(url)
            resolve({cleanup_url:url,totalCount:records.length});
            
          } catch (error) {
            console.log("Cleanup Error:",error.message)
            reject(error);
          }
        })
        .on('error', reject);
    });
  }


module.exports = { cleanup };