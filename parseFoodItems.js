/**
 * This file parses each individual food item.
 *
 * Reads HTML files from
 *      ./data/html/food-items
 *
 * Outputs two JSON files:
 *      ./data/json/food-data.json
 *      ./data/json/food-data-min.json
 */
const fs = require("fs");
const cheerio = require("cheerio");

const items = require("./data/json/food-list.json");
const parsedItems = [];

let numParsed = 0;
let numFailed = 0;

const fields = {
  "kJ:": "kJ",
  "kcal:": "kcal",

  "Protín": "protein",
  "Fita": "fats",
  "Kolvetni": "carbohydrates",
  "Trefjar": "fibers",
  "Alkóhól": "alcohol",

  "Prótein, alls":              "protein",
  "Fita, alls":                 "fats",
  "Sykrur":                     "sugars",
  "Mettaðar fitusýrur":         "fatty_acids",
  "cis-Einómettaðar fitus.":    "fatty_acids_mono",
  "cis-Fjölómettaðar fitus.":   "fatty_acids_poly",
  "cis-Fjölóm. fitus. n-6":     "fatty_acids_n6_poly",
  "cis-Fjölóm. fitus. n-3":     "fatty_acids_n3_poly",
  "cis-Fjölóm. f. n-3 langar":  "fatty_acids_n3_poly_long",
  "trans-Fitusýrur":            "trans_fatty_acids",
  "Kólesteról":                 "cholesterol",
  "Kolvetni, alls":             "carbohydrates",
  "Viðbættur sykur":            "added_sugar",
  "Trefjaefni":                 "fibers",
  "Alkóhól":                    "alchohol",
  "Steinefni, alls":            "minerals",
  "Vatn":                       "water",
  "Kalk, Ca":                   "calcium",
  "Fosfór, P":                  "phosphorus",
  "Magnesíum, Mg":              "magnesium",
  "Natríum, Na":                "natrium",
  "Kalíum, K":                  "potassium",
  "Járn, Fe":                   "iron",
  "Zink, Zn":                   "zinc",
  "Kopar, Cu":                  "copper",
  "Joð, I":                     "iodine",
  "Mangan, Mn":                 "manganese",
  "Selen, Se":                  "selenium",
  "Kadmín, Cd":                 "cadmium",
  "Blý, Pb":                    "lead",
  "Kvikasilfur, Hg":            "mercury",
  "Arsen, As":                  "arsenic",
  "Retinol":                    "retinol",
  "Beta-karótín":               "beta_carotene",
  "A-vítamín, RJ":              "a_vitamins",
  "B-vítamín":                  "b_vitamins",
  "B1-vítamín, þíamín":         "b1_vitamins_thiamine",
  "B2-vítamín, ríbóflavín":     "b2_vitamins_riboflavin",
  "B6-vítamín":                 "b6_vitamins",
  "B12-vítamín":                "b12_vitamins",
  "C-vítamín":                  "c_vitamins",
  "D-vítamín":                  "d_vitamins",
  "E-vítamín":                  "e_vitamins",
  "E-vítamín, a-TJ":            "e_vitamins",
  "Alfa-tókóferól":             "alpha-tocopherol",
  "Níasín":                     "niacin",
  "Níasín-jafngildi":           "niacin_equivalents",
  "Fólat, alls":                "folate",
  "Beta-glúkanar":              "beta_glucans",
  "C 18:2 n-6":                 "linoleic_acid",
  "C 18:3 n-3":                 "alpha_linolenic_acid",
  "C 20:5 n-3":                 "eicosapentaenoic_acid",
  "C 22:6 n-3":                 "docosahexaenoic_acid",
};

const colNames = [
  "name",           // Heiti
  "unit",           // Ein.
  "amount",         // Innihald
  "amount_lowest",  // Lægst
  "amount_highest", // Hæst
  "not_used",       // Fjöldi - not used
  "grade",          // Gæðast.
  "year_measured",  // Mæliár
  "permit",         // Heimild
];

// Fields to be parsed as floats
const numericFields = [
  "amount",
  "lowest",
  "highest",
  "year",
  "kJ",
  "kcal",
  "protein",
  "fats",
  "carbohydrates",
  "fibers",
  "alchohol",
  "amount_lowest",
  "amount_highest",
  "year_measured",
];

function parseItem(i = 0) {
  if (!items[i]) {
    return;
  }

  const { id, name_is, name_en } = items[i];

  const filePath = `./data/html/food-items/${id}.html`
  if (!fs.existsSync(filePath)) {
    numFailed++;
    console.log(`Skipping: "${id} - ${name_is}" - HTML file does not exist`);
    parseItem(i + 1);
    return;
  }

  const $ = cheerio.load(fs.readFileSync(filePath));

  const item = { id, name_is, name_en, nutrients: [], energy: {}, percentages: {} };

  $("table#GridView1").find("tr").each((j, el) => {
    if (j !== 0) {
      const nutritionalValue = {};
      $(el).find("td").each((i, x) => {
        const text = $(x).text().trim();
        if (text) {
          if (colNames[i] === "field") {
            if (!fields[text]) {
              throw new Error(text);
            }
            nutritionalValue[colNames[i]] = fields[text];
          } else {
            if (numericFields.indexOf(colNames[i]) > -1) {
              nutritionalValue[colNames[i]] = parseFloat(text.replace(",", "."))
            } else {
              nutritionalValue[colNames[i]] = text;
            }
          }
        }
      });
      item.nutrients.push(nutritionalValue);
    }
  });

  $("table caption").each((i, x) => {
    let whichTable;

    const text = $(x).text().trim();
    if (text === "Orka í 100g:") {
      whichTable = "energy";
    } else if (text === "Orkudreifing:") {
      whichTable = "percentages";
    } else {
      throw new Error("Unexpected table: " + text);
    }

    $(x.parent).find("tr").each((_, el) => {
      let key;
      $(el).find("td").each((i, x) => {
        if (i === 0) {
          key = $(x).text().trim();
        } else if (i === 1) {
          const text = $(x).text().trim();
          if (numericFields.indexOf(fields[key]) > -1) {
            item[whichTable][fields[key]] = parseFloat(text.replace(",", "."));
          } else {
            item[whichTable][fields[key]] = text;
          }
        }
      });
    });
  });

  parsedItems.push(item);
  
  numParsed++;
  console.log(`Parsed: "${id} - ${name_is}"`);
  parseItem(i + 1);
}

parseItem();

console.log(`Parsed: ${numParsed}`);
console.log(`Failed: ${numFailed}`);

fs.writeFileSync("./data/json/food-data.json", JSON.stringify(parsedItems, null, 2));
fs.writeFileSync("./data/json/food-data-min.json", JSON.stringify(parsedItems));