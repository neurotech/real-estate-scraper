import { firefox } from "playwright";
import fs from "fs";
import { generateDiscordMessage } from "./discord";
import tiny from "tiny-json-http";

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
    streetName: "Nandi",
  },
  {
    type: "Rental",
    url: "https://www.domain.com.au/rent/frenchs-forest-nsw-2086/?ssubs=0&sort=dateupdated-desc",
    suburb: "Frenchs Forest",
    streetName: "Nandi",
  },
  {
    type: "Sale",
    url: "https://www.domain.com.au/sale/queenscliff-nsw-2096/?ssubs=0&sort=dateupdated-desc",
    suburb: "Queenscliff",
    streetName: "Dalley",
  },
  {
    type: "Rental",
    url: "https://www.domain.com.au/rent/queenscliff-nsw-2096/?ssubs=0&sort=dateupdated-desc",
    suburb: "Queenscliff",
    streetName: "Dalley",
  },
  {
    type: "Sale",
    url: "https://www.domain.com.au/sale/cremorne-nsw-2090/?ssubs=0&sort=dateupdated-desc",
    suburb: "Cremorne",
    streetName: "Young",
  },
  {
    type: "Rental",
    url: "https://www.domain.com.au/rent/cremorne-nsw-2090/?ssubs=0&sort=dateupdated-desc",
    suburb: "Cremorne",
    streetName: "Young",
  },
  {
    type: "Sale",
    url: "https://www.domain.com.au/sale/cremorne-nsw-2090/?ssubs=0&sort=dateupdated-desc",
    suburb: "Cremorne",
    streetName: "Benelong",
  },
  {
    type: "Rental",
    url: "https://www.domain.com.au/rent/cremorne-nsw-2090/?ssubs=0&sort=dateupdated-desc",
    suburb: "Cremorne",
    streetName: "Benelong",
  },
  {
    type: "Sale",
    url: "https://www.domain.com.au/sale/7-poate-place-davidson-nsw-2085/?ssubs=0&sort=dateupdated-desc",
    suburb: "Davidson",
    streetName: "Poate",
  },
  {
    type: "Rental",
    url: "https://www.domain.com.au/rent/7-poate-place-davidson-nsw-2085/?ssubs=0&sort=dateupdated-desc",
    suburb: "Davidson",
    streetName: "Poate",
  },
];

if (!fs.existsSync("listings.json")) {
  fs.writeFileSync("listings.json", JSON.stringify([]));
}

const discordWebhookUrl = process.env.REAL_ESTATE_WATCHER_DISCORD_WEBHOOK_URL;

const performQuery = async (query: Query) => {
  console.log(
    `\n[🔎] Looking for ${query.type} listings in ${query.suburb} for street names that contain "${query.streetName}"...`
  );
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" +
      " AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
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
      const address = await result.textContent();
      const resultUrl = await result.getAttribute("href");

      const id = resultUrl?.replace(/\/+$/, "");
      const existingListings: string[] = JSON.parse(
        fs.readFileSync("listings.json", "utf8")
      );

      if (id && !existingListings.includes(id)) {
        fs.writeFileSync(
          "listings.json",
          JSON.stringify([...existingListings, id], null, "  ")
        );

        const properUrl = new URL(
          resultUrl?.startsWith("https://")
            ? resultUrl
            : "https://www.domain.com.au" + resultUrl
        );

        console.log(
          `[✅] [${query.type.toUpperCase()}] [${address}] [${properUrl}]`
        );

        if (discordWebhookUrl && address) {
          const data = generateDiscordMessage(address, properUrl, query.type);
          await tiny.post({ url: discordWebhookUrl, data });
        }
      }
    }
  }

  await browser.close();
};

const performQueries = async () => {
  for (const query of queries) {
    await performQuery(query);
  }
};

performQueries();
