'use strict';
const pj_scraper = require('../../index.js');
const fs = require('fs');
const util = require('util');

const puppeteer = require('puppeteer');
const { createLogger, transports } = require('winston');
const assert = require('assert');
const path = require('path');

const debug = require('debug')('pj-scraper:test');
const { GoogleMobileScraper } = require('../../src/modules/google-mobile');

describe('Module Google Mobile', function(){

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
        const googleMobileScraper = new GoogleMobileScraper({
            config: {
                search_engine_name: 'google_mobile',
                //throw_on_detection: true,
                keywords: ['cloud service'],
                logger: testLogger,
                scrape_from_file: '',
                scrape_from_string: fs.readFileSync('../mocks/google_mobile.html', 'utf8'),
            }
        });

        googleMobileScraper.STANDARD_TIMEOUT = 500;

        return googleMobileScraper.run({page}).then(({results, metadata, num_requests}) => {
            var data =results['cloud service']['1']['top_ads'];
            assert(data[0].visible_link != '',"At least one visible_link is required");  
            assert(data[0].tracking_link != '',"At least one tracking_link is required");
            assert(data[0].link != '',"At least one link is required");
            assert(data[0].title != '',"At least one title is required");
            assert(data[0].snippet != '',"At least one snippet is required");
            assert(data[0].links != '',"At least one links is required");
            assert(results['cloud service']['1']['top_ads'].length >= 1,"top_ads should be grater and equal to one");
        });
    });

});
