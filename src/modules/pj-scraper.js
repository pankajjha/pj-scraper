'use strict';

const se_scraper = require('se-scraper');
const debug = require('debug')('pj-scraper:Scraper');


module.exports = class Scraper extends se_scraper.Scraper {
    constructor(options = {}) {
        debug('child constructor');
        super(options);
        this.logger = this.config.logger;
    }

    async run({page, data}) {

        if (page) {
            this.page = page;
        }

        await this.page.setViewport({ width: 1920, height: 1040 });
        let do_continue = true;

        await this.scraping_loop();

        return {
            results: this.results,
            metadata: this.metadata,
            num_requests: this.num_requests,
        }
    }

    async scraping_loop() {
        debug('Inside Scraping Loop')
        for (var keyword of this.keywords) {
            this.num_keywords++;
            this.keyword = keyword;
            this.results[keyword] = {};
            this.result_rank = 1;
            debug('Trying...', keyword)
            try {
                this.page_num = 1;
                do {
                    this.logger.info(`${this.config.search_engine_name} scrapes keyword "${keyword}" on page ${this.page_num}`);
                    if (this.config.scrape_from_file.length <= 0) {
                        await this.page.setContent(this.config.scrape_from_string)
                    } else {
                        this.last_response = await this.page.goto(this.config.scrape_from_file);
                    }
                    let html = await this.page.content();
                    let parsed = await this.parse(html);
                    this.results[keyword][this.page_num] = parsed ? parsed : await this.parse_async(html);

                    if (this.config.screen_output) {
                        this.results[keyword][this.page_num].screenshot = await this.page.screenshot({
                            encoding: 'base64',
                            fullPage: false,
                        });
                    }

                    if (this.config.html_output) {

                        if (this.config.clean_html_output) {
                            await this.page.evaluate(() => {
                                // remove script and style tags
                                Array.prototype.slice.call(document.getElementsByTagName('script')).forEach(
                                  function(item) {
                                    item.remove();
                                });
                                Array.prototype.slice.call(document.getElementsByTagName('style')).forEach(
                                  function(item) {
                                    item.remove();
                                });

                                // remove all comment nodes
                                var nodeIterator = document.createNodeIterator(
                                    document.body,
                                    NodeFilter.SHOW_COMMENT,    
                                    { acceptNode: function(node) { return NodeFilter.FILTER_ACCEPT; } }
                                );
                                while(nodeIterator.nextNode()){
                                    var commentNode = nodeIterator.referenceNode;
                                    commentNode.remove();
                                }
                            });
                        }

                        if (this.config.clean_data_images) {
                            await this.page.evaluate(() => {
                                Array.prototype.slice.call(document.getElementsByTagName('img')).forEach(
                                  function(item) {
                                    let src = item.getAttribute('src');
                                    if (src && src.startsWith('data:')) {
                                        item.setAttribute('src', '');
                                    }
                                });
                            });
                        }

                        let html_contents = await this.page.content();
                        // https://stackoverflow.com/questions/27841112/how-to-remove-white-space-between-html-tags-using-javascript
                        // TODO: not sure if this is save!
                        html_contents = html_contents.replace(/>\s+</g,'><');
                        this.results[keyword][this.page_num].html = html_contents;
                    }

                    this.page_num += 1;

                    // only load the next page when we will pass the next iteration
                    // step from the while loop
                    if (this.page_num <= this.config.num_pages) {

                        let next_page_loaded = await this.next_page();

                        if (next_page_loaded === false) {
                            break;
                        } else {
                            this.num_requests++;
                        }
                    }

                } while (this.page_num <= this.config.num_pages);

            } catch (e) {

                this.logger.warn(`Problem with scraping ${keyword} in search engine ${this.config.search_engine_name}: ${e.message}`);
                debug('this.last_response=%O', this.last_response);

                if (this.config.take_screenshot_on_error) {
                    await this.page.screenshot({ path: `debug_se_scraper_${this.config.search_engine_name}_${keyword}.png` });
                }

                this.metadata.scraping_detected = await this.detected();

                if (this.metadata.scraping_detected === true) {
                    this.logger.warn(`${this.config.search_engine_name} detected the scraping!`);

                    if (this.config.is_local === true) {
                        await this.sleep(this.SOLVE_CAPTCHA_TIME);
                        this.logger.info(`You have ${this.SOLVE_CAPTCHA_TIME}ms to enter the captcha.`);
                        // expect that user filled out necessary captcha
                    } else {
                        if (this.config.throw_on_detection === true) {
                            throw( e );
                        } else {
                            return;
                        }
                    }
                } else {
                    // some other error, quit scraping process if stuff is broken
                    if (this.config.throw_on_detection === true) {
                        throw( e );
                    } else {
                        return;
                    }
                }
            }
        }
    }
}