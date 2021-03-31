'use strict';

const cheerio = require('cheerio');
const Scraper = require('./pj-scraper');
const debug = require('debug')('pj-scraper:CustomYahooMobileScraper');

class CustomYahooMobileScraper extends Scraper {

    async parse_async(html) {

        let results = await this.page.evaluate(() => {

            let _text = (el, s) => {
                let n = el.querySelector(s);

                if (n) {
                    return n.innerText;
                } else {
                    return '';
                }
            };

            let _attr = (el, s, attr) => {
                let n = el.querySelector(s);

                if (n) {
                    return n.getAttribute(attr);
                } else {
                    return null;
                }
            };

            let results = {
                num_results: '',
                no_results: false,
                effective_query: '',
                results: [],
                top_ads: [],
                bottom_ads: [],
                right_side_ads: [],
            };

            let organic_results = document.querySelectorAll('#results #cols #left #main #web ol .relsrch');
            organic_results.forEach((el) => {
                let serp_obj = {
                link: _attr(el, 'h3 a', 'href'),
                title: _text(el, 'h3'),
                snippet: _text(el, '.compText p'),
                visible_link: _text(el, '.compTitle div span'),
                };
                
                results.results.push(serp_obj);
            });

            // check if no results
            results.no_results = (results.results.length === 0);

            let parseAds = (container, selector) => {
                document.querySelectorAll(selector).forEach((el) => {
                  let ad_obj = {
                    visible_link: _text(el, '.tad-url a:first-child'),
                    tracking_link: _attr(el, '.tad-url a:first-child', 'href'),
                    link: _attr(el, '.tad-title a:first-child', 'href'),
                    title: _text(el, '.tad-title a:first-child'),
                    snippet: _text(el, '.grp .tad-abst p span'),
                    links: [],
                  };
                  el.querySelectorAll('.compDlink li').forEach((node) => {
                    ad_obj.links.push({
                      tracking_link: _attr(el, 'a', 'href'),
                      link: _attr(el, 'a', 'href'),
                      title: _text(node, 'a'),
                    })
                  });
                  container.push(ad_obj);
                });
              };
              
            parseAds(results.top_ads, '.searchCenterTopAds .AdTop');
            parseAds(results.bottom_ads, '.searchCenterBottomAds .AdBttm');
            parseAds(results.right_side_ads, '.searchRightBottomAds .AdNrrw');

            return results;
        });
        
        results.results = this.clean_results(results.results, ['title', 'link']);

        results.top_ads = this.clean_results(results.top_ads, ['title', 'visible_link', 'tracking_link']);
        results.bottom_ads = this.clean_results(results.bottom_ads, ['title', 'visible_link', 'tracking_link']);
        results.right_side_ads = this.clean_results(results.right_side_ads, ['title', 'visible_link', 'tracking_link']);
        results.time = (new Date()).toUTCString();
        
        return results;
    }

    async load_start_page() {
        let startUrl = this.build_start_url('https://www.bing.com/search?') || 'https://www.bing.com/';

        if (this.config.bing_settings) {
            startUrl = `https://www.${this.config.bing_settings.bing_domain}/search?`;
            if (this.config.bing_settings.bing_domain) {
                startUrl = `https://www.${this.config.bing_settings.bing_domain}/search?`;
            } else {
                startUrl = `https://www.bing.com/search?`;
            }

            for (var key in this.config.bing_settings) {
                if (key !== 'bing_domain') {
                    startUrl += `${key}=${this.config.bing_settings[key]}&`
                }
            }
        }

        await this.page.goto(startUrl);
        await this.page.waitForSelector('input[name="q"]', { timeout: this.STANDARD_TIMEOUT });
        
        return true;
    }

    async search_keyword(keyword) {
        const input = await this.page.$('input[name="q"]');
        await this.set_input_value(`input[name="q"]`, keyword);
        await this.sleep(50);
        await input.focus();
        await this.page.keyboard.press("Enter");
    }

    async next_page() {
        let next_page_link = await this.page.$('.sb_pagN', {timeout: 1000});
        if (!next_page_link) {
            return false;
        }

        this.last_response = await Promise.all([
            next_page_link.click(), // The promise resolves after navigation has finished
            this.page.waitForNavigation(), // Clicking the link will indirectly cause a navigation
        ]);

        return true;
    }

    async wait_for_results() {
        await this.page.waitForSelector('#results', { timeout: this.STANDARD_TIMEOUT });
    }

    async detected() {
        // TODO: I was actually never detected by bing. those are good boys.
    }
}

module.exports = {
    CustomYahooMobileScraper: CustomYahooMobileScraper,
};