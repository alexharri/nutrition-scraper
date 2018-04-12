const fs = require("fs");
const request = require("request");

const URL = "http://www1.matis.is/ISGEM/FoodTable.aspx";

request(URL, (err, res, html) => {
  if (err) { throw err; }

  fs.writeFileSync("./data/food-item-list.html", html);
});