const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

/**
 * Converts SE Ranking keyword data with positions to CSV
 * @param {Array} data - JSON array of keyword position data
 * @returns {string} CSV file name
 */
async function CSVtoSE_RANKING(data) {
  console.log(data);

  const rows = [];
  if (data) {
    data.forEach(keyword => {
      keyword.positions.forEach(position => {
        console.log(position)
        rows.push({
          keyword_id: keyword.id,
          keyword: keyword.name,
          group_id: keyword.group_id,
          volume: keyword.volume,
          competition: keyword.competition,
          cpc: keyword.cpc,
          suggested_bid: keyword.suggested_bid,
          landing_page: keyword.landing_pages?.[0]?.url || '',
          date: position.date,
          position: position.pos,
          change: position.change,
          depth: position.depth,
          paid_position: position.paid_position,
          is_map: position.is_map,
          map_position: position.map_position,
          results: keyword.results,
        });
      });
    });
  }

  // Define headers
  const fields = [
    'keyword_id',
    'keyword',
    'group_id',
    'volume',
    'competition',
    'cpc',
    'suggested_bid',
    'landing_page',
    'date',
    'position',
    'change',
    'depth',
    'paid_position',
    'is_map',
    'map_position',
    'results',
  ];

  // Convert to CSV with headers
  const parser = new Parser({ fields });
  const csv = parser.parse(rows);

  // Save to file
  const fileName = `se_ranking_export.csv`;
  const filePath = path.join(__dirname, fileName);
  fs.writeFileSync(filePath, csv);

  return fileName;
}

module.exports = { CSVtoSE_RANKING };
