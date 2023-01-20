const puppeteer = require("puppeteer-extra");
const fs = require("fs");
let env = require("dotenv");
let oldJson = require("./restaurants.json");
const { Condition } = require("selenium-webdriver");

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
  await page.waitForTimeout(5000);
  await page.evaluate(async () => {
    console.log("Start Scrolling");
    await window.scrollTo({ top: 9 * 100000, behavior: "smooth" });
    await window.scrollTo({ top: 9 * 100000, behavior: "smooth" });
  });
  await page.waitForTimeout(1000);
  await page.waitForSelector("[data-qa=link]"); // Link
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
  let allRestaurants = {};
  let restaurants = await page.evaluate(async () => {
    let restaurants = ["blank"];
    console.log("We are in...");
    console.log(true);
    restaurants = await [...document.querySelectorAll("[data-qa=link]")];
    for (let i = 0; i < restaurants.length; i++) {
      restaurants[i] = await { index: i + 1, link: restaurants[i].href };
    }
    return restaurants;
  });

  // loop through restaurants
  for (let i = 0; i < restaurants.length; i++) {
    // fetch info of each restaurant (excluding alcoholics)
    let newPage = await browser.newPage();
    await newPage.goto(restaurants[i].link, {
      waitUntil: "networkidle0",
      timeout: 0,
    });
    await newPage.waitForTimeout(1000);
    await newPage.evaluate(async () => {
      for (
        let i = 0;
        i < document.documentElement.scrollHeight;
        i += (window.innerHeight * 2) / 3
      ) {
        window.scrollTo({ top: 10 * i, behavior: "smooth" });
      }
    });
    await newPage.waitForTimeout(900);
    await newPage.waitForSelector(
      "[data-qa=restaurant-header] [data-qa=flex] div:first-child div:first-child"
    );
    let singleResturant = {
      i,
      name: await newPage.evaluate(async () => {
        let element = document.querySelectorAll(
          "[data-qa=restaurant-header] [data-qa=flex] div:first-child div:first-child"
        )[0].innerText;
        console.log(element);
        return element;
      }),
      logo: await newPage.evaluate(() => {
        return document.querySelectorAll(
          "[data-qa=avatar] [data-qa=picture] img"
        )[0].src;
      }),
      info: "",
      meals: {
        category: "",
      },
    };

    singleResturant.meals = await newPage.evaluate(() => {
      let meals = {};
      let currentCateg = document.querySelectorAll(
        "[data-qa=menu-list] [data-qa=popular-items] [data-qa=popular-items-header-info]"
      )[0].innerText;
      meals[currentCateg] = {
        categoryName: currentCateg,
        categoryDescription: "popular meals",
        items: [],
      };
      [
        ...document.querySelectorAll(
          "[data-qa=menu-list] [data-qa=popular-items] [data-qa=popular-items-list] [data-qa=item] [data-qa=item-element]"
        ),
      ].forEach((item, i) => {
        if ([...item.querySelectorAll("[data-qa=util] svg")].length === 1) {
          meals[currentCateg].items.push({
            name: item.querySelector(
              "[data-qa=util] [data-qa=flex] h3[data-qa=heading]"
            )
              ? item.querySelector(
                  "[data-qa=util] [data-qa=flex] h3[data-qa=heading]"
                ).innerText
              : "",
            description: item.querySelectorAll("[data-qa=flex]")[0]
              ? item
                  .querySelectorAll("[data-qa=flex]")[0]
                  .innerText.split(/\r?\n|\r|\n/g)
                  .slice(0, -1)
                  .join("\r\n")
              : "",
            price: item.querySelectorAll("[data-qa=flex]")[0]
              ? item
                  .querySelectorAll("[data-qa=flex]")[0]
                  .innerText.split(/\r?\n|\r|\n/g)[
                  item
                    .querySelectorAll("[data-qa=flex]")[0]
                    .innerText.split(/\r?\n|\r|\n/g).length - 1
                ]
              : "",
          });
        }
      });
      [
        ...document.querySelectorAll(
          "[data-qa=menu-list] [data-qa=item-category]"
        ),
      ].forEach((category) => {
        currentCateg = category.querySelector(
          "[data-qa=util] > h2[data-qa=heading]"
        )
          ? category.querySelector("[data-qa=util] > h2[data-qa=heading]")
              .innerText
          : "";
        if (
          !currentCateg.startsWith("Alkoh") &&
          !currentCateg.startsWith("Alcoh")
        ) {
          meals[currentCateg] = {
            categoryName: currentCateg,
            categoryDescription: category.querySelector(
              "[data-qa=util] [data-qa=item-category-description]"
            )
              ? category.querySelector(
                  "[data-qa=util] [data-qa=item-category-description]"
                ).innerText
              : "",
            items: [],
          };
          [...category.querySelectorAll("[data-qa=item-element]")].forEach(
            (item) => {
              if (
                [...item.querySelectorAll("[data-qa=util] svg")].length === 1
              ) {
                meals[currentCateg].items.push({
                  name: item.querySelector(
                    "[data-qa=util] [data-qa=flex] h3[data-qa=heading]"
                  )
                    ? item.querySelector(
                        "[data-qa=util] [data-qa=flex] h3[data-qa=heading]"
                      ).innerText
                    : "",
                  description: item.querySelectorAll("[data-qa=flex]")[0]
                    ? item
                        .querySelectorAll("[data-qa=flex]")[0]
                        .innerText.split(/\r?\n|\r|\n/g)
                        .slice(0, -1)
                        .join("\r\n")
                    : "",
                  price: item.querySelectorAll("[data-qa=flex]")[0]
                    ? item
                        .querySelectorAll("[data-qa=flex]")[0]
                        .innerText.split(/\r?\n|\r|\n/g)[
                        item
                          .querySelectorAll("[data-qa=flex]")[0]
                          .innerText.split(/\r?\n|\r|\n/g).length - 1
                      ]
                    : "",
                });
              }
            }
          );
        }
      });
      return meals;
    });

    // to get address

    await newPage.waitForTimeout(200);
    await newPage.evaluate(() => {
      document.querySelector("[data-qa=restaurant-header-action-info]").click();
    });
    // await newPage.close();
    newPage.waitForSelector(
      "[data-qa=restaurant-info-modal-info-address-element]"
    );
    await newPage.waitForTimeout(900);
    singleResturant.info = await newPage.evaluate(() => {
      let info = [];
      [
        ...document.querySelectorAll(
          "[data-qa=restaurant-info-modal-info-address-element] > div > div > *"
        ),
      ].forEach((one) => {
        info.push(one.innerText);
        console.log(one.innerText);
      });
      console.log(info);
      return info;
    });

    // await infoPage.close();
    // final merge
    restaurants[singleResturant.i] = {
      ...restaurants[singleResturant.i],
      ...singleResturant,
    };
    allRestaurants[
      singleResturant.name
        .replace(/[^a-zA-Z ]/g, "")
        .split(" ")
        .join("")
        .toLowerCase()
    ] = singleResturant;
  }

  let lastVersion = oldJson || { zipcodes: {}, restaurants: {} };
  lastVersion.zipcodes[`${process.env.ZIP_CODE}`] = restaurants;
  lastVersion.restaurants = { ...lastVersion.restaurants, ...allRestaurants };
  fs.writeFile(
    "restaurants.json",
    JSON.stringify(lastVersion, null, 2),
    "utf8",
    function (err) {
      if (err) {
        return console.log(err);
      }
      console.log(
        "The data has been scraped and saved successfully! View it at './restaurants.json'."
      );
      console.log("Restaurants of " + process.env.ZIP_CODE + " were added!.");
    }
  );

  // await page.waitForTimeout(50000);
  // Save a screenshot of the results.

  await browser.close();
})();
