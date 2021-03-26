# This is a modified version of [NikolaiT/se-scraper](https://github.com/NikolaiT/se-scraper)

## Custom Search Engine Scraper - pj-scraper

[![npm](https://img.shields.io/npm/v/pj-scraper.svg?style=for-the-badge)](https://www.npmjs.com/package/pj-scraper)

This node module allows you to scrape search engines like google and bing through locally downloaded html page.
you just have to pass the html content as a string and it will return the SERP result in JSON

#### Table of Contents
- [Installation](#installation)
- [Minimal Example](#minimal-example)
- [Using Proxies](#proxies)
- [Custom Scrapers](#custom-scrapers)
- [Examples](#examples)
- [Scraping Model](#scraping-model)
- [Technical Notes](#technical-notes)
- [Advanced Usage](#advanced-usage)
- [Special Query String Parameters for Search Engines](#query-string-parameters)


Pj-scraper supports the following search engines:
* Google
* Google News
* Google News App version (https://news.google.com)
* Google Image
* Bing
* Bing News
* Infospace
* Duckduckgo
* Yandex
* Webcrawler

This module uses [NikolaiT/se-scraper](https://github.com/NikolaiT/se-scraper) and adds capablity to scrape using string

## Installation

You need a working installation of **node** and the **npm** package manager.


For example, if you are using Ubuntu 18.04, you can install node and npm with the following commands:

```bash
sudo apt update;

sudo apt install nodejs;

# recent version of npm
curl -sL https://deb.nodesource.com/setup_10.x -o nodesource_setup.sh;
sudo bash nodesource_setup.sh;
sudo apt install npm;
```

This command will install dependencies:

```bash
# install all that is needed by chromium browser. Maybe not everything needed
sudo apt-get install gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget;
```

Install **pj-scraper** by entering the following command in your terminal

```bash
npm install pj-scraper
```

If you **don't** want puppeteer to download a complete chromium browser, add this variable to your environment. Then this module is not guaranteed to run out of the box.

```bash
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
```

## Minimal Example

Create a file named `minimal.js` with the following contents

```js
const fs = require('fs');
const pj_scraper = require('pj-scraper');

(async () => {
    let scrape_job = {
        search_engine: pj_scraper.CustomScraper,
        keywords: ['car loan'],
        num_pages: 1,
        scrape_from_string: fs.readFileSync('carloan.html', 'utf8'), //You can also put your "html code" here
    };

    var results = await pj_scraper.scrape({}, scrape_job);

    console.dir(results, {depth: null, colors: true});
})();
```

Start scraping by firing up the command `node minimal.js`

## Technical Notes

Scraping is done with a headless chromium browser using the automation library puppeteer. Puppeteer is a Node library which provides a high-level API to control headless Chrome or Chromium over the DevTools Protocol.

The chromium browser is started with the following flags to prevent
scraping detection.

```js
var ADDITIONAL_CHROME_FLAGS = [
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-spki-list',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--window-size=1920x1080',
    '--hide-scrollbars',
    '--disable-notifications',
];
```

Furthermore, to avoid loading unnecessary ressources and to speed up
scraping a great deal, we instruct chrome to not load images and css and media:

```js
await page.setRequestInterception(true);
page.on('request', (req) => {
    let type = req.resourceType();
    const block = ['stylesheet', 'font', 'image', 'media'];
    if (block.includes(type)) {
        req.abort();
    } else {
        req.continue();
    }
});
```

## Advanced Usage

Use **pj-scraper** by calling it with a script such as the one below.

```js
const pj_scraper = require('pj-scraper');

// those options need to be provided on startup
// and cannot give to se-scraper on scrape() calls
let browser_config = {
    // the user agent to scrape with
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3835.0 Safari/537.36',
    // if random_user_agent is set to True, a random user agent is chosen
    random_user_agent: false,
    // whether to select manual settings in visible mode
    set_manual_settings: false,
    // log ip address data
    log_ip_address: false,
    // log http headers
    log_http_headers: false,
    // how long to sleep between requests. a random sleep interval within the range [a,b]
    // is drawn before every request. empty string for no sleeping.
    sleep_range: '',
    // which search engine to scrape
    search_engine: 'google',
    compress: false, // compress
    // whether debug information should be printed
    // level 0: print nothing
    // level 1: print most important info
    // ...
    // level 4: print all shit nobody wants to know
    debug_level: 1,
    keywords: ['nodejs rocks',],
    // whether to start the browser in headless mode
    headless: true,
    // specify flags passed to chrome here
    chrome_flags: [],
    // the number of pages to scrape for each keyword
    num_pages: 1,
    // path to output file, data will be stored in JSON
    output_file: '',
    // whether to also passthru all the html output of the serp pages
    html_output: false,
    // whether to return a screenshot of serp pages as b64 data
    screen_output: false,
    // whether to prevent images, css, fonts and media from being loaded
    // will speed up scraping a great deal
    block_assets: true,
    // path to js module that extends functionality
    // this module should export the functions:
    // get_browser, handle_metadata, close_browser
    //custom_func: resolve('examples/pluggable.js'),
    custom_func: '',
    throw_on_detection: false,
    // use a proxy for all connections
    // example: 'socks5://78.94.172.42:1080'
    // example: 'http://118.174.233.10:48400'
    proxy: '',
    // a file with one proxy per line. Example:
    // socks5://78.94.172.42:1080
    // http://118.174.233.10:48400
    proxy_file: '',
    // whether to use proxies only
    // when this is set to true, se-scraper will not use
    // your default IP address
    use_proxies_only: false,
    // check if headless chrome escapes common detection techniques
    // this is a quick test and should be used for debugging
    test_evasion: false,
    apply_evasion_techniques: true,
    // settings for puppeteer-cluster
    puppeteer_cluster_config: {
        timeout: 30 * 60 * 1000, // max timeout set to 30 minutes
        monitor: false,
        concurrency: Cluster.CONCURRENCY_BROWSER,
        maxConcurrency: 1,
    }
};

(async () => {
    // scrape config can change on each scrape() call
    let scrape_config = {
        // which search engine to scrape
        search_engine: 'google',
        // an array of keywords to scrape
        keywords: ['car loan'],
        scrape_from_string: fs.readFileSync('carloan.html', 'utf8'), //You can also put your "html code" here
        // the number of pages to scrape for each keyword
        num_pages: 2,

        // OPTIONAL PARAMS BELOW:
        google_settings: {
            gl: 'us', // The gl parameter determines the Google country to use for the query.
            hl: 'fr', // The hl parameter determines the Google UI language to return results.
            start: 0, // Determines the results offset to use, defaults to 0.
            num: 100, // Determines the number of results to show, defaults to 10. Maximum is 100.
        },
        // instead of keywords you can specify a keyword_file. this overwrites the keywords array
        keyword_file: '',
        // how long to sleep between requests. a random sleep interval within the range [a,b]
        // is drawn before every request. empty string for no sleeping.
        sleep_range: '',
        // path to output file, data will be stored in JSON
        output_file: 'output.json',
        // whether to prevent images, css, fonts from being loaded
        // will speed up scraping a great deal
        block_assets: false,
        // check if headless chrome escapes common detection techniques
        // this is a quick test and should be used for debugging
        test_evasion: false,
        apply_evasion_techniques: true,
        // log ip address data
        log_ip_address: false,
        // log http headers
        log_http_headers: false,
    };

    let results = await pj_scraper.scrape(browser_config, scrape_config);
    console.dir(results, {depth: null, colors: true});
})();
```

[Output for the above script on my machine.](examples/results/advanced.json)