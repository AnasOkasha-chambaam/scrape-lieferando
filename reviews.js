const puppeteer = require("puppeteer-extra");
const fs = require("fs");
let env = require("dotenv");
let oldJson = require("./reviews.json");
// const { Condition } = require("selenium-webdriver");
let lastIndex = 0,
  lastURL = "";

env.config({ path: "./variables.env" });
console.log("ch-p", process.env.CHROME_PATH);
// Enable stealth plugin with all evasions
try {
  puppeteer.use(require("puppeteer-extra-plugin-stealth")());
  (async () => {
    // Launch the browser in headless mode and set up a page.
    const browser = await puppeteer.launch({
      executablePath: process.env.CHROME_PATH,
      // ignoreHTTPSErrors: true,
      args: ["--no-sandbox"],
      headless: false,
      // headless: true,
    });
    let restaurantsArr = Object.keys(oldJson.restaurants);
    console.log(restaurantsArr.length);
    for (let i = 99; i < restaurantsArr.length; i++) {
      lastIndex = i;
      const restaurant = oldJson.restaurants[restaurantsArr[i]];
      lastURL = restaurant.link;
      console.log(restaurant.link);
      const page = await browser.newPage();
      await page.goto(restaurant.link, {
        timeout: 0,
        waitUntil: "networkidle0",
      });
      await page.waitForTimeout(5000);
      let currentUrl = await page.evaluate(() => window.location.href);
      console.log("current url: ", currentUrl);
      if (currentUrl === restaurant.link) {
        console.log("Going On");
        await page.waitForSelector(
          '[data-qa="restaurant-header-rating-action"]'
        );
        await page.evaluate(async () => {
          let openReviews = document.querySelector(
            '[data-qa="restaurant-header-rating-action"]'
          );
          //   console.log(openReviews.innerText);
          openReviews.click();
          return "Okay";
        });
        await page.waitForSelector(
          "[data-qa=restaurant-info-modal-reviews-rating] [data-qa=heading][role=heading]"
        );
        let reviews = await page.evaluate(async () => {
          let ratingValue = document.querySelector(
            "[data-qa=restaurant-info-modal-reviews-rating] [data-qa=heading][role=heading]"
          ).innerText;
          let NoOfReviews = document.querySelector(
            "[data-qa=restaurant-info-modal-reviews-rating] [data-qa=text]"
          ).innerText;
          return { ratingValue, NoOfReviews };
        });
        await page.waitForTimeout(2000);
        await page.waitForSelector(
          "[data-qa=restaurant-info-modal-reviews-list] [data-qa=card]"
        );
        let reviewsItems = await page.evaluate(async () => {
          let reviewsCardsArr = [
              ...document.querySelectorAll(
                "[data-qa=restaurant-info-modal-reviews-list] [data-qa=card]"
              ),
            ],
            reviewsCards = [];
          console.log(reviewsCardsArr);
          reviewsCardsArr.forEach((card) => {
            let cardObj = {};
            let textContentArr = card.innerText.split("\n");
            textContentArr.forEach((line, index) => {
              if (line.startsWith("*")) {
                cardObj.respond = line;
              } else {
                switch (index) {
                  case 0:
                    cardObj.name = line;
                    break;
                  case 1:
                    cardObj.date = line;
                    break;
                  case 2:
                    cardObj.essen = card.querySelectorAll(
                      "[data-qa=rating-display-element]"
                    )[0]
                      ? card
                          .querySelectorAll(
                            "[data-qa=rating-display-element]"
                          )[0]
                          .getAttribute("aria-label")
                      : NaN;
                    break;
                  case 3:
                    cardObj.lieferung = card.querySelectorAll(
                      "[data-qa=rating-display-element]"
                    )[1]
                      ? card
                          .querySelectorAll(
                            "[data-qa=rating-display-element]"
                          )[1]
                          .getAttribute("aria-label")
                      : NaN;
                    break;
                  case 4:
                    cardObj.content = line;
                    break;

                  default:
                    break;
                }
              }
            });
            reviewsCards.push(cardObj);
          });
          console.log(reviewsCards);
          return reviewsCards;
        });
        reviews = { ...reviews, reviewsItems };
        restaurant.reviews = reviews;
        oldJson.restaurants[restaurantsArr[i]] = restaurant;
        fs.writeFile(
          "reviews.json",
          JSON.stringify(oldJson, null, 2),
          "utf8",
          function (err) {
            if (err) {
              return console.log(err);
            }
            console.log("Last Index:", lastIndex);
            console.log("Last URL:", lastURL);
            console.log(
              oldJson.restaurants[restaurantsArr[i]] +
                ". The data has been scraped and saved successfully! View it at './reviews.json'."
            );
          }
        );
      }
    }

    // await page.waitForTimeout(50000);
    // Save a screenshot of the results.

    //   await browser.close();
  })();
} catch (error) {
  console.log("Error");
  console.log("Last Index: ", lastIndex);
  console.log("Last URL: ", lastURL);
  console.log(error);
}
