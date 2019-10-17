import * as functions from 'firebase-functions';

const admin = require('firebase-admin');
admin.initializeApp();
const firestore = admin.firestore();
const puppeteer = require('puppeteer');

exports.scrapeAiseki = functions.pubsub
    .schedule('every 15 minutes')
    .timeZone('Asia/Tokyo')
    .onRun(async (context) => {
        const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.goto('https://oriental-lounge.com');

        // 店舗取得
        const shops: [any] = await page.$$('.shop');

        await Promise.all(shops.map(async shop => await setShopData(shop)));
        await browser.close();
    });

async function setShopData(shop: any) {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    const shopNameTag = await shop.$('.shop_name');
    const shopNameEnTag = await shopNameTag.$('.en');
    const shopNameTextContent = await shopNameEnTag.getProperty('textContent');
    const shopNameEn: string = await shopNameTextContent.jsonValue()

    const numTag = await shop.$('.num');

    const manTag = await numTag.$('.man')
    const manTagText = await manTag.getProperty('textContent');
    const man: string = await manTagText.jsonValue();

    const womanTag = await numTag.$('.woman');
    const womanTagText = await womanTag.getProperty('textContent');
    const woman: string = await womanTagText.jsonValue();

    // firestoreに保存
    const ref = firestore.collection(shopNameEn);

    console.log('shop_name_en', shopNameEn);
    console.log('man', man);
    console.log('woman', woman);
    console.log('timestamp', timestamp);

    const data = {
        shop_name_en: shopNameEn,
        man: man,
        woman: woman,
        timestamp: timestamp,
    }
    ref.add(data);
}