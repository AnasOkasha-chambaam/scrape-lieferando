const scraperObject = {
  url: "https://www.lieferando.at/lieferservice/essen/",
  async scraper(browser, zipCode) {
    let url = this.url;
    console.log(zipCode);
    let page = await browser.newPage();
    console.log(`Navigating to ${this.url + zipCode}...`);
    // Navigate to the selected page
    await page.goto(this.url + zipCode, { timeout: 0 });
    await page.waitForSelector("._50YZr._3Maaj");
    let scrapedData = [];
    console.log(data);
    return data;
  },
};

module.exports = scraperObject;
