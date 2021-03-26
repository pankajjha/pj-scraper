const pj_scraper = require('./src/pj_node_scraper.js');
var Scraper = require('./src/modules/pj-scraper');
const custom_scraper = require('./src/modules/custom.js');
const custom_bing_scraper = require('./src/modules/custom-bing.js');
const custom_google_mobile_scraper = require('./src/modules/custom-google-mobile.js');
const custom_yahoo_scraper = require('./src/modules/custom-yahoo.js');
const debug = require('debug')('pj-scraper:Index');

async function scrape(browser_config, scrape_config) {
    // scrape config overwrites the browser_config
    Object.assign(browser_config, scrape_config);

    var scraper = new pj_scraper.PJScrapeManager(browser_config);

    await scraper.start();
    try{
        var results = await scraper.scrape(scrape_config);
    } catch(e){
        debug('Navigation');
    }
    

    await scraper.quit();

    return results;
}

function getScraperEngine(browser_name)
{
    var searchEngine = custom_scraper.CustomGoogleScraper;
    switch(browser_name) {
        case 'bing':
            searchEngine = custom_bing_scraper.CustomBingScraper;
            break;
        case 'google':
            searchEngine = custom_scraper.CustomGoogleScraper;
            break;
        case 'google-mobile':
            searchEngine = custom_google_mobile_scraper.CustomGoogleMobileScraper;
            break;
        case 'yahoo':
            searchEngine = custom_yahoo_scraper.CustomYahooScraper;
            break;
        default:
            searchEngine = custom_scraper.CustomGoogleScraper;
    }
    return searchEngine;
}

module.exports = {
    scrape: scrape,
    getScraperEngine: getScraperEngine,
    ScrapeManager: pj_scraper.PJScrapeManager,
    Scraper: Scraper,
    CustomScraper: custom_scraper.CustomGoogleScraper,
    CustomMobileScraper: custom_google_mobile_scraper.CustomGoogleMobileScraper,
    CustomBingScraper: custom_bing_scraper.CustomBingScraper,
    CustomYahooScraper: custom_yahoo_scraper.CustomYahooScraper
};
