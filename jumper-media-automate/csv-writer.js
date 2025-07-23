const fs = require('fs');

function createCSV(headers, data, filename, delimiter = ',') {
  function escape(field) {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function rowToCSV(row) {
    if (Array.isArray(row)) {
      return row.map(escape).join(delimiter);
    }
    return headers.map(header => escape(row[header])).join(delimiter);
  }

  let csv = headers.map(escape).join(delimiter) + '\n';
  csv += data.map(rowToCSV).join('\n');
  
  fs.writeFileSync(filename, csv);
  return filename;
}

async function createCSVAsync(headers, data, filename, delimiter = ',') {
  function escape(field) {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function rowToCSV(row) {
    if (Array.isArray(row)) {
      return row.map(escape).join(delimiter);
    }
    return headers.map(header => escape(row[header])).join(delimiter);
  }

  let csv = headers.map(escape).join(delimiter) + '\n';
  if(data?.length>0) {
    csv += data.map(rowToCSV).join('\n');
  }
  
  await fs.promises.writeFile(filename, csv);
  return filename;
}

module.exports = { createCSV, createCSVAsync };