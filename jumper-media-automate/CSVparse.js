const fs = require('fs');
const csv = require('csv-parser');

const results = [];


async function getCSVLength(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
  
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
        
          resolve(results.length);
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }

  

  async function checkCSVForKeyValue(value,key='URL',filePath='jumper-media-automate/gbp_output_data/gbp_enhanced_records.csv') {
    return new Promise((resolve, reject) => {
      const cleanValue = removeTrailingSlash(value);
      let found = false;
      let nap=null;
      let napData=[]
  
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          
          const dataValue = removeTrailingSlash(data[key] || '');
        
        if (dataValue === cleanValue) {
          found = true;
        }
        if(!data['Has_NAP']){
          nap=false
          napData.push(data)
        }
        })
        .on('end', () => {
           
          nap=nap??true
          resolve({homePageMap:found,nap,napData});
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }


  function removeTrailingSlash(str) {
    return str.endsWith('/') ? str.slice(0, -1) : str;
  }
module.exports={getCSVLength,checkCSVForKeyValue}
