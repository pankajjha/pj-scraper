'use strict';
const express = require('express');
const puppeteer = require('puppeteer');
const { createLogger, transports } = require('winston');
const http = require('http');
const https = require('https');
const assert = require('assert');
const path = require('path');
const keyCert = require('key-cert');
const Promise = require('bluebird');
const Proxy = require('http-mitm-proxy');

const debug = require('debug')('pj-scraper:test');
const { YahooMobileScraper } = require('../../src/modules/yahoo-mobile');

const httpPort = 3012;
const httpsPort = httpPort + 1;
const proxyPort = httpPort + 2;

const fakeSearchEngine = express();
fakeSearchEngine.get('/search', (req, res) => {
    debug('q=%s', req.query.q);
    const pageNumber = ((req.query.start/10) || 0)  + 1;
    res.sendFile(path.join(__dirname, '../mocks/yahoo-mobile/' + req.query.q + '_page' + pageNumber + '.html'));
});
fakeSearchEngine.use(express.static('test/mocks/yahoo-mobile', {extensions: ['html']}));

describe('Module Google Mobile', function(){

    let httpServer, httpsServer, proxy;
    before(async function(){
        // Here mount our fake engine in both http and https listen server
        httpServer = http.createServer(fakeSearchEngine);
        httpsServer = https.createServer(await keyCert(), fakeSearchEngine);
        
        proxy = Proxy();
        proxy.onRequest((ctx, callback) => {
            ctx.proxyToServerRequestOptions.host = 'localhost';
            ctx.proxyToServerRequestOptions.port = (ctx.isSSL) ? httpsPort : httpPort;
            ctx.proxyToServerRequestOptions.headers['X-Forwarded-Host'] = 'ProxiedThroughFakeEngine';
            debug('connection proxied askedHost=%s toPort=%s', ctx.clientToProxyRequest.headers.host, ctx.proxyToServerRequestOptions.port);
            return callback();
        });

        await Promise.promisify(proxy.listen, { context: proxy })({ port: proxyPort });
        await Promise.promisify(httpServer.listen, {context: httpServer})(httpPort);
        await Promise.promisify(httpsServer.listen, {context: httpsServer})(httpsPort);
        debug('Fake http search engine servers started');
    });

    after(function(){
        proxy.close();
        httpsServer.close();
        httpServer.close();
    });

    let browser;
    let page;
    beforeEach(async function(){
        debug('Start a new browser');
        browser = await puppeteer.launch({
            //dumpio: true,
            //headless: false,
            ignoreHTTPSErrors: true,
            args: [ '--proxy-server=http://localhost:' + proxyPort ]
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
        const yahooMobileScraper = new YahooMobileScraper({
            config: {
                search_engine_name: 'yahoo_mobie',
                throw_on_detection: true,
                keywords: ['shein'],
                logger: testLogger,
                scrape_from_file: '',
            }
        });
        yahooMobileScraper.STANDARD_TIMEOUT = 500;
        return yahooMobileScraper.run({page}).then(({results, metadata, num_requests}) => {
            assert.strictEqual(num_requests, 1, 'Must do one request');
            assert.strictEqual(results['shein']['1'].results.length, 10, 'Must have 10 organic results parsed');
        });
    });

});