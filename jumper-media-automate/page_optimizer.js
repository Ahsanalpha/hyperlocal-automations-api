
const axios = require("axios")
const domain = process.env.POP_DOMAIN
const apiKey = process.env.POP_KEY


async function createPOPTask(keyword, targetUrl, locationName = 'United States', targetLanguage = 'english') {
    const url = `${domain}/api/expose/get-terms/`
    const data = {
        apiKey,
        keyword,
        targetUrl,
        locationName,
        targetLanguage
    }
    return await axios.post(url, data)

}

async function getPOPTask(taskId) {

    const url = `${domain}/api/task/${taskId}/results/`
    return await axios.get(url);

}

async function popCustomRecomendation(reportId, strategy = 'target', approach = 'regular') {


}

async function generatePOPReport(lsaPhrases, prepareId, variations) {
    const url = `${domain}/api/expose/create-report/`
    const data = {
        apiKey,
        lsaPhrases,
        prepareId,
        variations
    }
    return await axios.post(url, data)


}


module.exports = { createPOPTask, getPOPTask, generatePOPReport }