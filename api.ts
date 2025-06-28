import express from "express"
import fs from "fs"
import Keyv from "keyv"
import { KeyvFile } from "keyv-file"

import Browsers from "./browsers/browsers.ts"
import { getFilename, getFilepath, runCleanup } from "./utils.ts"

const app = express()

const port = process.env.PORT || 3000

const extensionPath = await fs.promises.realpath("./extensions/ad-block-plus")
const browsers = new Browsers(extensionPath)

if ( !fs.existsSync("./cache") ) {
    fs.mkdirSync("./cache")
    fs.mkdirSync("./cache/html")
    fs.mkdirSync("./cache/screenshot")
}

const keyv = new Keyv( {
    store: new KeyvFile( { filename: "./cache/keyv-file.json" } )
} )

app.get("/", async (req, res) => {
    res.send("Hello!")
})

app.get("/html", async (req, res) => {
    const url = req.query.url || "https://example.com"
    const blockAds = req.query.block_ads
    const useProxy = req.query.use_proxy

    const filename = getFilename(url)
    const cacheKey = `html_${filename}`
    let filepath = await keyv.get(cacheKey)

    if ( filepath ) {
        const HTMLContent = await fs.promises.readFile( filepath, "utf-8" )
        res.send(HTMLContent)
        return
    }

    const browser = await browsers.acquire(useProxy, blockAds)

    const page = await browser.newPage()
    await page.bringToFront()
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 })
    const HTMLContent = await page.content()
    await page.close()

    res.send(HTMLContent)

    filepath = getFilepath(filename, "html")
    await fs.promises.writeFile(filepath, HTMLContent)

    await keyv.set(cacheKey, filepath, 1000 * 60 * 60 * 4)

    await browsers.release(useProxy, blockAds, browser)
})

app.get("/screenshot", async (req, res) => {
    const url = req.query.url || "https://example.com"
    const blockAds = req.query.block_ads
    const useProxy = req.query.use_proxy
    const width = Number( req.query.width ) || 1920
    const height = Number( req.query.height ) || 1080

    const filename = getFilename(url)
    const cacheKey = `screenshot_${filename}`
    let filepath = await keyv.get(cacheKey)

    if ( filepath ) {
        const fullpath = await fs.promises.realpath(filepath)
        res.setHeader("Content-Type", "image/png").sendFile(fullpath)
        return
    }

    const browser = await browsers.acquire(useProxy, blockAds)

    const page = await browser.newPage()
    await page.bringToFront()
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 })
    await page.setViewport({ width, height })
    const ss = await page.screenshot({ fullPage: true })
    await page.close()

    res.setHeader("Content-Type", "image/png").send(ss)

    filepath = getFilepath(filename, "screenshot")
    await fs.promises.writeFile(filepath, ss, "binary")

    await keyv.set(cacheKey, filepath, 1000 * 60 * 60 * 4)

    await browsers.release(useProxy, blockAds, browser)
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

await runCleanup(keyv)