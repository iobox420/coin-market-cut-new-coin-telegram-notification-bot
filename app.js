const puppeteer = require("puppeteer");
const fs = require("fs");
const fss = require("fs").promises;
const util = require("util");
const fetch = require("node-fetch");
const TelegramBot = require("node-telegram-bot-api");
const config = require("./config");
const bot = new TelegramBot(config.token, { polling: true });

function read(file, utf) {
  const readFile = util.promisify(fs.readFile);
  return readFile(file, utf);
}

function save(data, path) {
  const writeFile = util.promisify(fs.writeFile);
  return writeFile(data, path);
}

async function fetchCoinMarketCup() {
  /*  //Загружаем html разметку и сохраняем
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  console.log("start go to https://coinmarketcap.com/new/");
  await page.goto("https://coinmarketcap.com/new/");

  let html = await page.content();*/
  let html = await fetch("https://coinmarketcap.com/new/").then((res) =>
    res.text()
  );

  /*return read("data1.html", "utf8").then((html) => {*/
  let start = html.indexOf("<tbody>");
  let end = html.indexOf("</tbody>");
  let pageAfterCut = html.slice(start + 7, end);

  let startSpan, endSpan, newPage, r1, r2;

  //prettier-ignore
  arrC = [
      "<span ",
      '</span',
      '<p ',
      "</p",
      "<a ",
      "</a",
      '<button ',
      '</button',
      '<div ',
      '</div',
      '<img ',
      '</img',
    ];

  function cut(arrCUT, table) {
    let newT;
    arrCUT.forEach((cur, i) => {
      while (table.indexOf(cur) !== -1) {
        startSpan = table.indexOf(cur);
        endSpan = table.indexOf(">", startSpan);
        r1 = table.slice(0, startSpan);
        r2 = table.slice(endSpan + 1);
        newT = r1 + r2;
        table = newT.slice();
        /*console.log(newT);*/
      }
    });
    return newT;
  }

  /*Save(cut(arrC, page), "data1.html")*/
  let parse = cut(arrC, pageAfterCut);

  /* console.log(parse);*/

  function line(data) {
    let startTR, endTR, pushItem;
    let arr = [];
    while (data.indexOf("<tr>") !== -1) {
      startTR = data.indexOf("<tr>");
      endTR = data.indexOf("</tr>");
      pushItem = data.slice(startTR, endTR);
      arr.push(pushItem);
      data = data.slice(endTR + 5);
    }
    return arr;
  }

  let afterLine = line(parse);

  function tdLine(data) {
    let startTR, endTR, startTR2, newData;
    let arr = [];
    let arrMain = [];
    data.forEach((cur, i) => {
      arr = [];
      while (data[i].indexOf("<td>") !== -1) {
        startTR = data[i].indexOf("<td");
        startTR2 = data[i].indexOf(">", startTR);
        endTR = data[i].indexOf("</td>");
        arr.push(data[i].slice(startTR2 + 1, endTR));
        data[i] = data[i].slice(endTR + 5);
      }
      arrMain.push(arr);
    });
    return arrMain;
  }

  let result = tdLine(afterLine);
  return result;
  /*Save(JSON.stringify(result), `./results/${Date.now()}.json`);*/
  /* });*/
  /*Save(html, "data1.html");*/
}

function main() {
  //Сделали запрос
  let fetch = fetchCoinMarketCup();
  //Сохранили результаты запроса

  fetch.then((newAr) => {
    /*console.log(newAr);*/
    fs.writeFile("new.json", JSON.stringify(newAr), () => {
      console.log("save file");
      read("old.json", "utf8")
        .then((res) => {
          return JSON.parse(res);
        })
        .then((oldAr) => {
          console.log("before compare");

          let ARR = [];
          newAr.forEach((curNew, i) => {
            let x = 0;
            oldAr.forEach((curOld, iOld) => {
              if (curNew[2] === curOld[2]) {
                x++;
              }
            });
            if (x === 0) {
              ARR.push(curNew[2]);
            }
          });
          let currentDate = new Date();

          if (ARR.length === 0) {
          } else {
            fs.writeFile("old.json", JSON.stringify(newAr), () => {
              let text =
                currentDate +
                `\\r\\n New coins : \\r\\n` +
                ARR[0] +
                `\\r\\n` +
                ARR[1] +
                `\\r\\n` +
                ARR[2] +
                `\\r\\n` +
                ARR[3] +
                `\\r\\n` +
                ARR[4] +
                `\\r\\n`;
              bot.sendMessage(config.chatId, text).then((r) => {
                console.log(r);
              });
            });
          }
        });
    });
  });
}
main();
setInterval(() => {
  main();
}, 20000);
