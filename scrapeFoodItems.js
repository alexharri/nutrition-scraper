const fs = require("fs");
const request = require("request");

const toUrl = id => `http://www1.matis.is/ISGEM/details1.aspx?FAEDA=${id}`;

const items = require("./data/json/food-item-list.json");

function fetchItem(i = 0) {
  if (!items[i]) {
    return;
  }

  const { id, name_is } = items[i];

  const filePath = `./data/html/food-items/${id}.html`
  if (fs.existsSync(filePath)) {
    console.log(`Exists already: "${id} - ${name_is}" - Skipping`);
    fetchItem(i + 1);
    return;
  }

  request(toUrl(id), (err, res, html) => {
    if (err) { throw err; }
  
    fs.writeFileSync(filePath, html);
    console.log(`Downloaded: "${id} - ${name_is}"`);
    setTimeout(() => {
      fetchItem(i + 1);
    }, 10);
  });
}

fetchItem();