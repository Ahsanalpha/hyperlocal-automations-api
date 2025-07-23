
const axios = require("axios")
const domain = process.env.SE_RANKING_DOMAIN
const apiKey = process.env.SE_RANKING_API_KEY


async function createProject(site_url,keyword,search_engine_id=1) {
    const url = `${domain}/sites`
    const data = {
        url:site_url,
        keyword,
      
    }
    return await axios.post(url, data,{headers:returnHeader()});

}


async function getKeywordStatistics(
  site_id,
  site_engine_id,
  report_period_from,
  report_period_to,
  with_landing_pages = 1,
  with_serp_features = 1
) {
  

    try {
      const url = `${domain}/sites/${site_id}/positions`;
  
      const { data } = await axios.get(url, {
        headers: returnHeader(),
        params: {
          site_id,
          site_engine_id,
          // report_period_from,
          // report_period_to,
          with_landing_pages,
          with_serp_features
        }
      });
  
      console.log('✅ Success:', data);
      return data;
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
    }

  
  
}

function returnHeader(){

    
       return {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
}

async function AddSearchEngineData(siteId, searchEngineId) {
  try {
    const url = `${domain}/sites/${siteId}/search-engines?search_engine_id=${searchEngineId}`;

    const response = await axios.post(
      url,
      {
        search_engine_id: searchEngineId,
      },
      {
        headers: returnHeader(),
      }
    );

    console.log('Search Engine Data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching search engine data:', error.response?.data || error.message);
    throw error;
  }
}

// async function getSearchEngineData(projectId, engineId) {
//   const url = `https://api4.seranking.com/sites/${projectId}/search-engines?search_engine_id=${engineId}`;

//   try {
//     const response = await axios.get(url, {
//       headers: {
//         'Authorization': 'Token YOUR_API_TOKEN', // 🔁 Replace with your actual token
//         'Content-Type': 'application/json'
//       }
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching search engine data:', error?.response?.data || error.message);
//     throw error;
//   }
// }
async function addKeywordsToSERanking(siteId, keywords) {
  const url = `${domain}/sites/${siteId}/keywords`;
  
  // Convert keyword strings into expected format
  const keywordObjects = keywords.map(keyword => ({ keyword }));

  try {
    const response = await axios.post(url, keywordObjects, {
      headers: returnHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error adding keywords:', error.response?.data || error.message);
    throw error;
  }
}
async function getSearchEngine(){
  try {
    const url = `${domain}/system/search-engines`;

    const { data } = await axios.get(url, {
      headers: returnHeader()
    });

    console.log('✅ Success:', data);
    return data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }


}


module.exports = { createProject, getKeywordStatistics,AddSearchEngineData,addKeywordsToSERanking,getSearchEngine}