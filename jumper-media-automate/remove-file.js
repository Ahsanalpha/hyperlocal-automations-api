const fs = require('fs');

function removingFiles(filePath){
if (fs.existsSync(filePath)) {
  fs.unlinkSync(filePath);
  console.log('File removed.');
} else {
  console.log('File does not exist.');
}
}

function checkFileExistence(filePath)
{

  if (fs.existsSync(filePath)) {
   return true
  } 

  return false
}


module.exports = { removingFiles , checkFileExistence };