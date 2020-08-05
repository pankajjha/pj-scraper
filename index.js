const se_scraper = require('./src/pj_node_scraper.js');
var Scraper = require('./src/modules/pj_scraper');
const custom_scraper = require('./src/custom.js');


async function scrape(browser_config, scrape_config) {
    // scrape config overwrites the browser_config
    Object.assign(browser_config, scrape_config);

    var scraper = new se_scraper.PJScrapeManager(browser_config);

    await scraper.start();

    var results = await scraper.scrape(scrape_config);

    await scraper.quit();

    return results;
}

module.exports = {
    scrape: scrape,
    ScrapeManager: se_scraper.PJScrapeManager,
    Scraper: Scraper,
    CustomScraper: custom_scraper.CustomGoogleScraper
};
