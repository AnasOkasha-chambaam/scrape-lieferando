const puppeteer = require("puppeteer-extra");
const fs = require("fs");
let env = require("dotenv");

env.config({ path: "./variables.env" });
console.log("ch-p", process.env.CHROME_PATH);
// Enable stealth plugin with all evasions
puppeteer.use(require("puppeteer-extra-plugin-stealth")());
(async () => {
  // Launch the browser in headless mode and set up a page.
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH,
    // ignoreHTTPSErrors: true,
    args: ["--no-sandbox"],
    headless: false,
  });
  const page = await browser.newPage();

  // Navigate to the page that will perform the tests.
  const testUrl =
    "https://www.lieferando.at/lieferservice/essen/" + process.env.ZIP_CODE;
  await page.goto(testUrl, { waitUntil: "networkidle0", timeout: 0 });
  await page.waitForTimeout(15000);
  await page.waitForSelector("[data-qa=restaurant-info-name]"); // name
  await page.waitForSelector("[data-qa=restaurant-rating-score]"); // rating
  await page.waitForSelector("[data-qa=restaurant-rating-votes]");
  // await page.waitForSelector("[data-qa=mov-indicator-content]");
  // await page.waitForSelector("[data-qa=delivery-costs-indicator-content]");
  // await page.waitForSelector("[data-qa=shipping-time-indicator-content]");
  await page.waitForSelector("[data-qa=restaurant-cuisines]");
  await page.waitForSelector("[data-qa=picture]");
  await page.waitForSelector("img._1xp4W");

  console.log("Heyy");
  let restaurants = await page.evaluate(() => {
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
      ["logo", "[data-qa=avatar] [data-qa=picture] img._1xp4W"],
    ];

    for (let i = 0; i < toGet.length; i++) {
      let infoText = [...document.querySelectorAll(toGet[i][1])];
      for (let x = 0; x < infoText.length; x++) {
        restaurants[x] = restaurants[x] || {};
        console.log(infoText[x]);
        if (toGet[i][0] === "logo") {
          restaurants[x][toGet[i][0]] = infoText[x].src;
          infoText[x].style.opacity = "0 !important";
        } else {
          restaurants[x][toGet[i][0]] = infoText[x].innerText;
          infoText[x].style.background = "orange !important";
        }
      }
    }

    console.log(restaurants);
    return restaurants;
  });

  fs.writeFile(
    "restaurants.json",
    JSON.stringify({ 8121: restaurants }, null, 2),
    "utf8",
    function (err) {
      if (err) {
        return console.log(err);
      }
      console.log(
        "The data has been scraped and saved successfully! View it at './restaurants.json'"
      );
    }
  );

  // await page.waitForTimeout(50000);
  // Save a screenshot of the results.

  await browser.close();
})();
