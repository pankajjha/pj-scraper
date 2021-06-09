const pj_scraper = require('./src/node_scraper.js');
var Scraper = require('./src/modules/pj_scraper');

async function scrape(browser, browser_config, scrape_config) {
    // scrape config overwrites the browser_config
    Object.assign(browser_config, scrape_config);

    var scraper = new pj_scraper.ScrapeManager(browser, browser_config);

    await scraper.start();

    var results = await scraper.scrape(scrape_config);

    await scraper.quit();

    return results;
}

module.exports = {
    scrape: scrape,
    ScrapeManager: pj_scraper.ScrapeManager,
    Scraper: Scraper,
};
