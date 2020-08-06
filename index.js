const pj_scraper = require('./src/pj_node_scraper.js');
var Scraper = require('./src/modules/pj-scraper');
const custom_scraper = require('./src/modules/custom.js');
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

module.exports = {
    scrape: scrape,
    ScrapeManager: pj_scraper.PJScrapeManager,
    Scraper: Scraper,
    CustomScraper: custom_scraper.CustomGoogleScraper
};
