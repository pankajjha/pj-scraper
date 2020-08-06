'use strict';
const se_scraper = require('se-scraper');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
var fs = require('fs');

class PJScrapeManager extends se_scraper.ScrapeManager{
    constructor(config, context={}) {
        const content = fs.readFileSync('./file2.html', 'utf8');
        config.scrape_from_string = content;
        config.logger = createLogger({
            level: 'info',
            format: combine(
                timestamp(),
                printf(({ level, message, timestamp }) => {
                    return `${timestamp} [${level}] ${message}`;
                })
            ),
            transports: [
                new transports.Console()
            ]
        }),
        super(config, context);
    }
}
module.exports = {
    PJScrapeManager: PJScrapeManager,
};