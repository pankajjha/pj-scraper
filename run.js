const pj_scraper = require('./index.js');
const puppeteer = require('puppeteer-extra')
const fs = require('fs');
const util = require('util');
const launchOptions = {
    //headless: (process.env.CRAWL_HEADLESS || false),
    headless: false,
    ignoreHTTPSErrors: true,
    userDataDir: './tmp',
    args: [
        '--disable-sync',
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
    ]
};

// those options need to be provided on startup
// and cannot give to se-scraper on scrape() calls
let browser_config = {
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
};



(async () => {
    // scrape config can change on each scrape() call
    let scrape_config = {
        // which search engine to scrape
        search_engine: 'google_desktop',
        //search_engine: 'google',
        // an array of keywords to scrape
        keywords: ['cloud service'],
        // the number of pages to scrape for each keyword
        num_pages: 1,
        scrape_from_string: fs.readFileSync('google-test.html', 'utf8'),
    };
    const browser = await puppeteer.launch(launchOptions);
    let results = await pj_scraper.scrape(browser, browser_config, scrape_config);
    console.dir(results, {depth: null, colors: true});
})();

