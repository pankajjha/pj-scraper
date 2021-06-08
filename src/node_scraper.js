'use strict';

var fs = require('fs');
var os = require("os");

const UserAgent = require('user-agents');
const google_desktop = require('./modules/google-desktop.js');
const google_mobile = require('./modules/google-mobile.js');
//const { Cluster } = require('./puppeteer-cluster/dist/index.js');
const common = require('./modules/common.js');
var log = common.log;

const MAX_ALLOWED_BROWSERS = 6;

function write_results(fname, data) {
    fs.writeFileSync(fname, data, (err) => {
        if (err) throw err;
        console.log(`Results written to file ${fname}`);
    });
}

function read_keywords_from_file(fname) {
    let kws =  fs.readFileSync(fname).toString().split(os.EOL);
    // clean keywords
    kws = kws.filter((kw) => {
        return kw.trim().length > 0;
    });
    return kws;
}


function getScraper(search_engine, args) {
    if (typeof search_engine === 'string') {
        return new {
            google_desktop: google_desktop.GoogleDesktopScraper,
            google_mobile: google_mobile.GoogleMobileScraper,
        }[search_engine](args);
    } else if (typeof search_engine === 'function') {
        return new search_engine(args);
    } else {
        throw new Error(`search_engine must either be a string of class (function)`);
    }
}


class ScrapeManager {

    constructor(browser, config, context={}) {
        this.scraper = null;
        this.context = context;
        this.browser = browser;

        this.config = {
            // the user agent to scrape with
            user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3835.0 Safari/537.36',
            // which search engine to scrape
            search_engine: 'google_desktop',
            search_engine_name: 'google_desktop',
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
            // whether to strip JS and CSS from the html_output
            // has only an effect if `html_output` is true
            clean_html_output: true,
            // remove all data images from the html
            clean_data_images: true,
            // whether to return a screenshot of serp pages as b64 data
            screen_output: false,
            // Scrape url from local file. Mainly used for testing.
            scrape_from_file: '',
            scrape_from_string:'',
            block_assets: true,
            throw_on_detection: false,
        };

        // overwrite default config
        for (var key in config) {
            this.config[key] = config[key];
        }

        if (fs.existsSync(this.config.keyword_file)) {
            this.config.keywords = read_keywords_from_file(this.config.keyword_file);
        }

        log(this.config, 2, this.config);
    }

    /*
     * Launches the puppeteer cluster or browser.
     *
     * Returns true if the browser was successfully launched. Otherwise will return false.
     */
    async start() {
        this.page = await this.browser.newPage();
    }

    /*
     * Scrapes the keywords specified by the config.
     */
    async scrape(scrape_config = {}) {

        if (!scrape_config.scrape_from_file && !scrape_config.scrape_from_string) {
            console.error('Either keywords or keyword_file must be supplied to scrape()');
            return false;
        }

        Object.assign(this.config, scrape_config);

        var results = {};
        var num_requests = 0;
        var metadata = {};
        var startTime = Date.now();

        this.config.search_engine_name = typeof this.config.search_engine === 'function' ? this.config.search_engine.name : this.config.search_engine;

        if (this.config.keywords && this.config.search_engine) {
            log(this.config, 1,
                `[pj-scraper] started at [${(new Date()).toUTCString()}] and scrapes ${this.config.search_engine_name} with ${this.config.keywords.length} keywords on ${this.config.num_pages} pages each.`)
        }

        this.scraper = getScraper(this.config.search_engine, {
            config: this.config,
            context: this.context,
            page: this.page,
        });

        var {results, metadata, num_requests} = await this.scraper.run(this.page);


        let timeDelta = Date.now() - startTime;
        let ms_per_request = timeDelta/num_requests;

        log(this.config, 1, `Scraper took ${timeDelta}ms to perform ${num_requests} requests.`);
        log(this.config, 1, `On average ms/request: ${ms_per_request}ms/request`);

        metadata.elapsed_time = timeDelta.toString();
        metadata.ms_per_keyword = ms_per_request.toString();
        metadata.num_requests = num_requests;

        log(this.config, 2, metadata);

        if (this.config.output_file) {
            log(this.config, 1, `Writing results to ${this.config.output_file}`);
            write_results(this.config.output_file, JSON.stringify(results, null, 4));
        }

        return {
            results: results,
            metadata: metadata || {},
        };
    }

    /*
     * Quit the puppeteer cluster/browser.
     */
    async quit() {
        this.page.close();
    }
}

module.exports = {
    ScrapeManager: ScrapeManager,
};
