'use strict';

const NodeScraper = require('./node_scraper');

class PJScrapeManager extends NodeScraper.ScrapeManager{
    constructor(config, context={}) {
        config.scrape_from_string = 'TEST';
        super(config, context);
        // this.config = _.defaults(config, {
        //     scrape_from_string: 'TEST',
        // });
    }
}
module.exports = {
    PJScrapeManager: PJScrapeManager,
};