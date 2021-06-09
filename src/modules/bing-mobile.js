'use strict';

const cheerio = require('cheerio');
const Scraper = require('./pj_scraper');
const debug = require('debug')('pj-scraper:BingMobileScraper');

class BingMobileScraper extends Scraper {

    async parse_async(html) {

        let results = await this.page.evaluate(() => {

            let _text = (el, s) => {
                let n = el.querySelector(s);
              
                if (n) {
                  return n.textContent;
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
              };
              
              let parseAds = (container, selector) => {
                document.querySelectorAll(selector).forEach((el) => {
                  let ad_obj = {
                    title: _text(el, 'h2 a'),
                    snippet: _text(el, '.b_caption p'),
                    visible_link: _text(el, '.b_adurl cite'),
                    tracking_link: _attr(el, 'h2 a', 'href'),
                    link: _attr(el, 'h2 a', 'href'),
                    links: [],
                  };
                  container.push(ad_obj);
                });
              };
              
              parseAds(results.top_ads, '#b_results .b_ad ul li');
              parseAds(results.bottom_ads, '#b_context .b_ad .sb_add');


            let effective_query_el = document.querySelector('#sp_requery a');

            if (effective_query_el) {
                results.effective_query = effective_query_el.innerText;
            }

            return results;
        });

        results.results = this.clean_results(results.results, ['title', 'link']);
        results.top_ads = this.clean_results(results.top_ads, ['title', 'visible_link', 'tracking_link']);
        results.time = (new Date()).toUTCString();
        return results;
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
        await this.page.waitForSelector('#b_content', { timeout: this.STANDARD_TIMEOUT });
    }

    async detected() {
        // TODO: I was actually never detected by bing. those are good boys.
    }
}

module.exports = {
    BingMobileScraper: BingMobileScraper,
};