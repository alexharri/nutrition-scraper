const fs = require("fs");
const cheerio = require("cheerio");

const $ = cheerio.load(fs.readFileSync(`./data/html/food-list.html`));

const items = [];

$("table#GridView1").find("tr").each((_, el) => {
  if (_ === 0) {
    return;
  }

  const item = {};
  const propTable = ["id", "name_is", "name_en"];
  $(el).find("td").each((i, x) => {
    item[propTable[i]] = $(x).text().trim();
  });
  items.push(item);
});

items.sort((a, b) => parseInt(a.id) - parseInt(b.id));

fs.writeFileSync("./data/json/food-item-list.json", JSON.stringify(items, null, 2));