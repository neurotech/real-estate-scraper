import dotenv from "dotenv";
import { firefox } from "playwright";
import fs from "fs";
import { generateDiscordMessage } from "./discord";
import tiny from "tiny-json-http";
import { logger } from "./logger";
import clc from "cli-color";
import path from "path";

dotenv.config({ path: path.join(__dirname, "./.env") });

const LISTINGS_JSON_PATH = path.join(__dirname, "./listings.json");

interface Query {
  type: "Sale" | "Rental";
  url: string;
  suburb: string;
  streetName: string;
}

const queries: Query[] = [
  {
    type: "Sale",
    url: "https://www.domain.com.au/sale/frenchs-forest-nsw-2086/?ssubs=0&sort=dateupdated-desc",
    suburb: "Frenchs Forest",
    streetName: "Nandi"
  },
  {
    type: "Rental",
    url: "https://www.domain.com.au/rent/frenchs-forest-nsw-2086/?ssubs=0&sort=dateupdated-desc",
    suburb: "Frenchs Forest",
    streetName: "Nandi"
  },
  {
    type: "Sale",
    url: "https://www.domain.com.au/sale/queenscliff-nsw-2096/?ssubs=0&sort=dateupdated-desc",
    suburb: "Queenscliff",
    streetName: "Dalley"
  },
  {
    type: "Rental",
    url: "https://www.domain.com.au/rent/queenscliff-nsw-2096/?ssubs=0&sort=dateupdated-desc",
    suburb: "Queenscliff",
    streetName: "Dalley"
  },
  {
    type: "Sale",
    url: "https://www.domain.com.au/sale/cremorne-nsw-2090/?ssubs=0&sort=dateupdated-desc",
    suburb: "Cremorne",
    streetName: "Young"
  },
  {
    type: "Rental",
    url: "https://www.domain.com.au/rent/cremorne-nsw-2090/?ssubs=0&sort=dateupdated-desc",
    suburb: "Cremorne",
    streetName: "Young"
  },
  {
    type: "Sale",
    url: "https://www.domain.com.au/sale/cremorne-nsw-2090/?ssubs=0&sort=dateupdated-desc",
    suburb: "Cremorne",
    streetName: "Benelong"
  },
  {
    type: "Rental",
    url: "https://www.domain.com.au/rent/cremorne-nsw-2090/?ssubs=0&sort=dateupdated-desc",
    suburb: "Cremorne",
    streetName: "Benelong"
  },
  {
    type: "Sale",
    url: "https://www.domain.com.au/sale/7-poate-place-davidson-nsw-2085/?ssubs=0&sort=dateupdated-desc",
    suburb: "Davidson",
    streetName: "Poate"
  },
  {
    type: "Rental",
    url: "https://www.domain.com.au/rent/7-poate-place-davidson-nsw-2085/?ssubs=0&sort=dateupdated-desc",
    suburb: "Davidson",
    streetName: "Poate"
  }
];

if (!fs.existsSync(LISTINGS_JSON_PATH)) {
  fs.writeFileSync(LISTINGS_JSON_PATH, JSON.stringify([]));
}

const discordWebhookUrl = process.env.REAL_ESTATE_WATCHER_DISCORD_WEBHOOK_URL;

const performQuery = async (query: Query) => {
  try {
    logger.log(
      `Looking for ${clc.yellow(query.type)} listings in ${clc.green(
        query.suburb
      )} for street names that contain "${clc.magenta(query.streetName)}"...`
    );
    const browser = await firefox.launch({ headless: true, timeout: 60000 });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" +
        " AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
    });
    const page = await context.newPage();

    await page.goto(query.url);

    const results = await page
      .getByTestId("results")
      .locator("a.address")
      .filter({ hasText: query.streetName.toLowerCase() })
      .all();

    if (results.length) {
      for (const result of results) {
        const existingListings: string[] = JSON.parse(
          fs.readFileSync(LISTINGS_JSON_PATH, "utf8")
        );
        const address = await result.textContent();
        const resultUrl = await result.getAttribute("href");

        const id = resultUrl?.replace(/\/+$/, "");

        if (id && !existingListings.includes(id)) {
          fs.writeFileSync(
            LISTINGS_JSON_PATH,
            JSON.stringify([...existingListings, id], null, "  ")
          );

          const properUrl = new URL(
            resultUrl?.startsWith("https://")
              ? resultUrl
              : "https://www.domain.com.au" + resultUrl
          );

          logger.log(
            `[${query.type.toUpperCase()}] [${address}] [${properUrl}]`
          );

          if (discordWebhookUrl && address) {
            const data = generateDiscordMessage(address, properUrl, query.type);
            await tiny.post({ url: discordWebhookUrl, data });
          }
        }
      }
    }

    await browser.close();
  } catch (error) {
    logger.error(error);
  }
};

const performQueries = async () => {
  if (!discordWebhookUrl || discordWebhookUrl === "") {
    return logger.error("Error: Discord Webhook URL is missing!");
  } else {
    for (const query of queries) {
      await performQuery(query);
    }
  }
};

performQueries();
