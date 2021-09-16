'use strict';
const pj_scraper = require('../../index.js');
const fs = require('fs');
const util = require('util');

const puppeteer = require('puppeteer');
const { createLogger, transports } = require('winston');
const assert = require('assert');
const path = require('path');

const debug = require('debug')('pj-scraper:test');
const { YahooScraper } = require('../../src/modules/yahoo');

describe('Module Yahoo Desktop', function(){

    before(async function(){
        // Here mount our fake engine in both http and https listen server
        
        debug('Fake http search engine servers started');
    });

    after(function(){
        
    });

    let browser;
    let page;
    beforeEach(async function(){
        debug('Start a new browser');
        browser = await puppeteer.launch({
            //headless: false,
            ignoreHTTPSErrors: true,
            //userDataDir: './tmp',
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
            //dumpio: true,
            //headless: false,
        });
        debug('Open a fresh page');
        page = await browser.newPage();
    });

    afterEach(async function(){
        await browser.close();
    });

    const testLogger = createLogger({
        transports: [
            new transports.Console({
                level: 'error'
            })
        ]
    });

    it('one keyword one page', function(){
        const yahooScraper = new YahooScraper({
            config: {
                search_engine_name: 'yahoo_desktop',
                //throw_on_detection: true,
                keywords: ['cloud service'],
                logger: testLogger,
                scrape_from_file: '',
                scrape_from_string: fs.readFileSync('../mocks/yahoo_desktop.html', 'utf8'),
            }
        });

        yahooScraper.STANDARD_TIMEOUT = 500;

        return yahooScraper.run({page}).then(({results, metadata, num_requests}) => {
            //console.dir(results, {depth: null, colors: false});
           var data =results['cloud service']['1']['top_ads'];
            assert(data[0].visible_link != '');  
            assert(data[0].tracking_link != '');
            assert(data[0].link != '');
            assert(data[0].title != '');
            assert(data[0].snippet != '');
            assert(data[0].links != '');

            var dataBottomAds =results['cloud service']['1']['bottom_ads'];
            assert(dataBottomAds[0].visible_link != '');  
            assert(dataBottomAds[0].tracking_link != '');
            assert(dataBottomAds[0].link != '');
            assert(dataBottomAds[0].title != '');
            assert(dataBottomAds[0].snippet != '');
            assert(results['cloud service']['1']['top_ads'].length >= 1);
            assert(results['cloud service']['1']['bottom_ads'].length >= 1);
        });
    });

});