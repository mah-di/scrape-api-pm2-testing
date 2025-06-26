import express from "express"
import setBrowsers from "./browsers/setBrowsers.ts"
import getBrowser from "./browsers/getBrowser.ts" 
import Browsers from "./browsers/browsers.ts"
import fs from "fs"

const app = express()

const port = process.env.PORT || 3000

const extensionPath = await fs.promises.realpath("./extensions/ad-block-plus")
const browsers = new Browsers(extensionPath)
// await setBrowsers()

app.get("/", async (req, res) => {
    res.send("Hello!")
})

app.get("/html", async (req, res) => {
    const url = req.query.url || "https://example.com"
    const blockAds = req.query.block_ads
    const useProxy = req.query.use_proxy

    // const browser = await getBrowser(useProxy, blockAds)
    const browser = await browsers.resolve(useProxy, blockAds)

    const page = await browser.newPage()
    await page.bringToFront()
    await page.goto(url, { waitUntil: "networkidle2" })
    const HTMLContent = await page.content()
    await page.close()

    res.send(HTMLContent)
})

app.get("/screenshot", async (req, res) => {
    const url = req.query.url || "https://example.com"
    const blockAds = req.query.block_ads
    const useProxy = req.query.use_proxy
    const width = Number( req.query.width ) || 1920
    const height = Number( req.query.height ) || 1080

    // const browser = await getBrowser(useProxy, blockAds)
    const browser = await browsers.resolve(useProxy, blockAds)

    const page = await browser.newPage()
    await page.bringToFront()
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 })
    await page.setViewport({ width, height })
    const ss = await page.screenshot({ fullPage: true })
    await page.close()

    res.set("Content-Type", "image/png").send(ss)
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})