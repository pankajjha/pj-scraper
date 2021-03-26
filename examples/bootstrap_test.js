const pj_scraper = require('../index.js');
const fs = require('fs');

(async () => {
    try{
        let browser_config = {
            debug_level: 1,
            headless: true,
        };
        let scrape_job = {
            search_engine: pj_scraper.CustomScraper,
            keywords: ['carloan'],
            num_pages: 1,
            scrape_from_string: fs.readFileSync('carloan.html', 'utf8'),
        };
    
        var results = await pj_scraper.scrape(browser_config, scrape_job);
    
        console.dir(results, {depth: null, colors: true});
    }catch(e){
        console.log('Error', e);
    }
    

})();
