
require('dotenv').config();

const puppeteer = require('puppeteer-extra')

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())



function calculatePostDate(input) {
    const regex = /^(\d+)([hdmoyrw]{1,2})$/;

    const timeConstants = {
        'h': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000,
        'w': 7 * 24 * 60 * 60 * 1000,
        'mo': 30.44 * 24 * 60 * 60 * 1000,
        'yr': 365.25 * 24 * 60 * 60 * 1000,
    };

    if (input.toLowerCase() === 'now') {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        return formattedDate;
    }

    const match = input.match(regex);

    if (!match) {
        throw new Error('Invalid input format');
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    if (!timeConstants[unit]) {
        throw new Error('Invalid unit of time');
    }

    const currentDate = new Date();
    const postDate = new Date(currentDate.getTime() - value * timeConstants[unit]);

    const year = postDate.getFullYear();
    const month = String(postDate.getMonth() + 1).padStart(2, '0');
    const day = String(postDate.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;

    return formattedDate;
}

    



function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  } 



async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}



async function getDetails(browser, url) {
    const page = await browser.newPage();
    let resultArray = [];
    const username = process.env.USERNAME_LINKEDIN;
    const password = process.env.PASSWORD;

    await page.setUserAgent('user-agent here'); //replace with your user-agent

    try {
        await page.goto(url, { 'timeout': 10000, 'waitUntil': 'load' });
        await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });

        await delay(3000);

        await page.type("#username", username);
        await delay(1000);
        await page.type("#password", password);
        await delay(1000);
        const form = await page.$('button.btn__primary--large');
        await form.evaluate(form => form.click());

        await delay(30000);
        await page.waitForSelector('button.artdeco-dropdown__trigger.artdeco-dropdown__trigger--placement-bottom.ember-view.display-flex.t-normal.t-12.t-black--light');
        const form2 = await page.$('button.artdeco-dropdown__trigger.artdeco-dropdown__trigger--placement-bottom.ember-view.display-flex.t-normal.t-12.t-black--light');
        await form2.evaluate(form2 => form2.click());
        await delay(3000);

        await page.waitForSelector('div.artdeco-dropdown.artdeco-dropdown--placement-bottom.artdeco-dropdown--justification-right.ember-view.sort-dropdown__dropdown>div>div>ul>li:nth-child(2)>div>button');
        const form3 = await page.$("div.artdeco-dropdown.artdeco-dropdown--placement-bottom.artdeco-dropdown--justification-right.ember-view.sort-dropdown__dropdown>div>div>ul>li:nth-child(2)>div>button");
        await form3.evaluate(form3 => form3.click());
        await delay(5000);

        await autoScroll(page);

        await page.waitForSelector('div.scaffold-finite-scroll__content>div>div>div>div>div>div.feed-shared-update-v2__description-wrapper>div>div');
        await page.waitForSelector('div.scaffold-finite-scroll__content>div>div>div>div>div>div.feed-shared-control-menu>div>button');
        await page.waitForSelector('div.scaffold-finite-scroll__content>div>div>div>div>div>div.update-components-actor>div>a>span>div>div>img');
        await page.waitForSelector('div.scaffold-finite-scroll__content>div>div>div>div>div>div.update-components-actor>div>div>a:nth-child(2)');
        await page.waitForSelector('div.scaffold-finite-scroll__content>div>div>div>div>div>div.update-components-actor>div>div>a>span.update-components-actor__title>span>span.visually-hidden');
        

        const selectedDescription = await page.$$("div.scaffold-finite-scroll__content>div>div>div>div>div>div.feed-shared-update-v2__description-wrapper>div>div");
        const selectedShareButton = await page.$$("div.scaffold-finite-scroll__content>div>div>div>div>div>div.feed-shared-control-menu>div>button");
        const selectedAuthorPicture = await page.$$("div.scaffold-finite-scroll__content>div>div>div>div>div>div.update-components-actor>div>a>span>div>div>img");
        const selectedDate = await page.$$("div.scaffold-finite-scroll__content>div>div>div>div>div>div.update-components-actor>div>div>a:nth-child(2)");
        const selectedAuthorName = await page.$$("div.scaffold-finite-scroll__content>div>div>div>div>div>div.update-components-actor>div>div>a>span.update-components-actor__title>span.update-components-actor__name>span.visually-hidden");
       

        let idx = 0;
        for (const content of selectedDescription) {
            let data = {
                authorName: "",
                authorPicture: "",
                postUrl: "",
                date: "",
                description: "",
            }

            const shareBtn = selectedShareButton[idx];
            const dateElement = selectedDate[idx];
            const authorPictureElement = selectedAuthorPicture[idx];
            const authorNameElement = selectedAuthorName[idx];

            try {
                const authorName = await authorNameElement.evaluate(authorNameElement => authorNameElement.textContent.trim());
                const authorPicture = await authorPictureElement.evaluate(authorPictureElement => authorPictureElement.getAttribute("src"));
                const description = await page.evaluate(content => content.textContent.trim(), content);

                const dateExtracted = await dateElement.evaluate(dateElement => dateElement.getAttribute("aria-label").trim().replace("•", ''));
                const date = calculatePostDate(dateExtracted.replace("  Edited •", '').trim());

                await shareBtn.evaluate(shareBtn => shareBtn.click());
                await page.waitForSelector('div>div>div>div>div>div.feed-shared-control-menu>div>div>div>ul>li.feed-shared-control-menu__item.option-share-via>div');

                const copyLink = await page.$("div>div>div>div>div>div.feed-shared-control-menu>div>div>div>ul>li.feed-shared-control-menu__item.option-share-via>div");
                await copyLink.evaluate(copyLink => copyLink.click());
                await delay(1000);

                await page.waitForSelector("div.artdeco-toast-item.artdeco-toast-item--visible>div>p>a")
                const linkHref = await page.$("div.artdeco-toast-item.artdeco-toast-item--visible>div>p>a");
                const postUrl = await linkHref.evaluate(linkHref => linkHref.getAttribute('href'));

                data.authorName = authorName;
                data.description = description;
                data.postUrl = postUrl;
                data.date = date;
                data.authorPicture = authorPicture;

                console.log(data);

                idx = idx + 1;
            } catch (err) {
                console.error("Error in loop iteration:", err);
                idx = idx + 1;
                continue;
            }
        }
    } catch (error) {
        console.error("Error in getDetails function:", error);
    } finally {
        await browser.close();
    }
}





async function main(){
    const baseUrl = "https://www.linkedin.com/company/sparky-studios/posts/";

    // const browser = await puppeteer.launch({headless: "new"});   
    const browser = await puppeteer.launch({
        headless:'new',
        args:[
           '--start-maximized' 
        ]
        });  

    const dataArray = await getDetails(browser,baseUrl);      
    
    // await insertData(tableName,dataArray);
}

main();