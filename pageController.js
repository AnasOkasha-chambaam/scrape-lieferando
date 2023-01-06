const pageScraper = require("./pageScraper");
const fs = require("fs");
async function scrapeAll(browserInstance) {
  let browser;
  try {
    browser = await browserInstance;
    let scrapedData = {};
    // Call the scraper for different set of books to be scraped
    scrapedData["8181"] = await pageScraper.scraper(browser, "8181");
    await browser.close();
    fs.writeFile(
      "data.json",
      JSON.stringify(scrapedData, null, 2),
      "utf8",
      function (err) {
        if (err) {
          return console.log(err);
        }
        console.log(
          "The data has been scraped and saved successfully! View it at './data.json'"
        );
      }
    );
  } catch (err) {
    console.log("Could not resolve the browser instance => ", err);
  }
}

module.exports = (browserInstance) => scrapeAll(browserInstance);
