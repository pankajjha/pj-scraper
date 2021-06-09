'use strict';
const meta = require('./metadata.js');
const common = require('./common.js');
var log = common.log;

/*
    Get useful JS knowledge and get awesome...

    Read this shit: https://javascript.info/class-inheritance
    And this: https://medium.freecodecamp.org/here-are-examples-of-everything-new-in-ecmascript-2016-2017-and-2018-d52fa3b5a70e
 */

module.exports = class Scraper {
    constructor(options = {}) {
        const {
            config = {},
            context = {},
            page = null,
        } = options;

        this.page = page;
        this.last_response = null; // the last response object
        this.metadata = {
            scraping_detected: false,
        };
        this.config = config;
        this.context = context;

        this.keywords = config.keywords;

        this.STANDARD_TIMEOUT = 10000;

        this.results = {};
        this.result_rank = 1;
        // keep track of the requests done
        this.num_requests = 0;
        // keep track of the keywords searched
        this.num_keywords = 0;

        let settings = this.config[`${this.config.search_engine}_settings`];
        if (settings) {
            if (typeof settings === 'string') {
                settings = JSON.parse(settings);
                this.config[`${this.config.search_engine}_settings`] = settings;
            }
        }
    }

    async run({page, data}) {

        if (page) {
            this.page = page;
        }

        await this.page.setViewport({ width: 1920, height: 1040 });

        await this.scraping_loop();

        return {
            results: this.results,
            metadata: this.metadata,
            num_requests: this.num_requests,
        }
    }

    /**
     * Each scraper basically iterates over a list of
     * keywords and a list of pages. This is the generic
     * method for that.
     *
     * @returns {Promise<void>}
     */
    async scraping_loop() {
        for (var keyword of this.keywords) {
            this.num_keywords++;
            this.keyword = keyword;
            this.results[keyword] = {};
            this.result_rank = 1;

            try {
                this.page_num = 1;
                do {

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

                console.error(`Problem with scraping ${keyword} in search engine ${this.config.search_engine_name}: ${e}`);

                if (this.last_response) {
                    log(this.config, 2, this.last_response);
                }

                if (this.config.debug_level > 2) {
                    try {
                        // Try to save a screenshot of the error
                        await this.page.screenshot({path: `debug_se_scraper_${this.config.search_engine_name}_${keyword}.png`});
                    } catch (e) {
                    }
                }

                this.metadata.scraping_detected = await this.detected();

                if (this.metadata.scraping_detected === true) {
                    console.error(`${this.config.search_engine_name} detected the scraping!`);
                    if (this.config.throw_on_detection === true) {
                        throw( e );
                    } else {
                        return;
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

    /**
     * Generic function to append queryArgs to a search engine url.
     *
     * @param: The baseUrl to use for the build process.
     */
    build_start_url(baseUrl) {
        let settings = this.config[`${this.config.search_engine}_settings`];

        if (settings) {
            for (var key in settings) {
                baseUrl += `${key}=${settings[key]}&`
            }

            log(this.config, 1, 'Using startUrl: ' + baseUrl);

            return baseUrl;
        }

        return false;
    }

    sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms)
        })
    }

    async random_sleep() {
        const [min, max] = this.config.sleep_range;
        let rand = Math.floor(Math.random() * (max - min + 1) + min); //Generate Random number
        log(this.config, 1, `Sleeping for ${rand}s`);
        await this.sleep(rand * 1000);
    }

    async set_input_value(selector, value) {
        await this.page.waitFor(selector);
        await this.page.evaluate((value, selector) => {
            return document.querySelector(selector).value = value;
        }, value, selector);
    }

    no_results(needles, html) {
        for (let needle of needles) {
            if (html.includes(needle)) {
                console.log(this.config, 2, `HTML contains needle ${needle}. no_results=true`);
                return true;
            }
        }
        return false;
    }

    /*
        Throw away all elements that do not have data in the
        specified attributes. Most be of value string.
     */
    clean_results(results, attributes) {
        const cleaned = [];
        for (var res of results) {
            let goodboy = true;
            for (var attr of attributes) {
                if (!res[attr] || !res[attr].trim()) {
                    goodboy = false;
                    break;
                }
            }
            if (goodboy) {
                res.rank = this.result_rank++;
                cleaned.push(res);
            }
        }
        return cleaned;
    }

    parse(html) {

    }

    async parse_async(html) {

    }

    /**
     *
     * @returns true if startpage was loaded correctly.
     */
    async load_start_page() {

    }

    /**
     * Searches the keyword by inputting it into the form and hitting enter
     * or something similar.
     *
     * @param keyword
     * @returns {Promise<void>}
     */
    async search_keyword(keyword) {

    }

    /**
     *
     * @returns true if the next page was loaded correctely
     */
    async next_page() {

    }

    async wait_for_results() {

    }

    async detected() {

    }
};
