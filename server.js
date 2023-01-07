const puppeteer = require("puppeteer-extra");
// Enable stealth plugin with all evasions
puppeteer.use(require("puppeteer-extra-plugin-stealth")());
(async () => {
  // Launch the browser in headless mode and set up a page.
  const browser = await puppeteer.launch({
    executablePath: `C:\\Users\\ECPS\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe`,
    // ignoreHTTPSErrors: true,
    args: ["--no-sandbox"],
    headless: false,
  });
  const page = await browser.newPage();

  // Navigate to the page that will perform the tests.
  const testUrl = "https://www.lieferando.at/lieferservice/essen/8121";
  await page.goto(testUrl, { waitUntil: "networkidle0", timeout: 0 });
  await page.waitForTimeout(15000);
  await page.waitForSelector("._50YZr._3Maaj[data-qa=restaurant-info-name]"); // name
  await page.waitForSelector("._3Imuh._1imAt[data-qa=restaurant-rating-score]"); // rating
  await page.waitForSelector("._3Imuh[data-qa=restaurant-rating-votes]");
  await page.waitForSelector("._3Imuh[data-qa=mov-indicator-content]");
  await page.waitForSelector(
    "._3Imuh[data-qa=delivery-costs-indicator-content]"
  );
  await page.waitForSelector(
    "._3Imuh[data-qa=shipping-time-indicator-content]"
  );
  await page.waitForSelector("._3jA7k._2THKE[data-qa=restaurant-cuisines]");
  await page.waitForSelector("img._1xp4W");

  console.log("Heyy");
  let any;
  console.log(
    "Hey",
    await page.evaluate(() => {
      console.log("We are in...");
      let restaurants = [];
      let toGet = [
        ["name", "._50YZr._3Maaj[data-qa=restaurant-info-name]"],
        ["rating_score", "._3Imuh._1imAt[data-qa=restaurant-rating-score]"],
        ["votes", "._3Imuh[data-qa=restaurant-rating-votes]"],
        ["mov", "._3Imuh[data-qa=mov-indicator-content]"],
        [
          "cost",
          "._3Imuh[data-qa=delivery-costs-indicator-content]",
          ["shipping_time", "._3Imuh[data-qa=shipping-time-indicator-content]"],
        ],
        ["cuisines", "._3jA7k._2THKE[data-qa=restaurant-cuisines]"],
        ["logo", "img._1xp4W"],
      ];

      for (let i = 0; i < toGet.length; i++) {
        let infoText = [...document.querySelectorAll(toGet[i][1])];
        for (let x = 0; x < infoText.length; x++) {
          restaurants[x] = restaurants[x] || {};
          if (toGet[i][1].startsWith("img")) {
            restaurants[x][toGet[i][0]] = infoText[x].src;
            infoText[x].setAttribute('style', 'diplay: none');
          } else {
            restaurants[x][toGet[i][0]] = infoText[x].innerText;
            infoText[x].setAttribute("style", "background: orange !important");
          }
        }
      }

      console.log(restaurants);
      return restaurants;
    })
  );
  console.log(any);
  // await page.waitForTimeout(50000);
  // Save a screenshot of the results.

  // await browser.close();
})();
