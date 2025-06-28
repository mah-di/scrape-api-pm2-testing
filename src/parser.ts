import { Browser } from "puppeteer"

async function parseHTML( browser: Browser, url: string ) {
    const page = await browser.newPage()
    await page.bringToFront()
    await page.goto( url, { waitUntil: "networkidle2", timeout: 60_000 } )
    const HTMLContent = await page.content()
    await page.close()

    return HTMLContent
}

async function parseSS( browser: Browser, url: string, width: number, height: number ) {
    const page = await browser.newPage()
    await page.bringToFront()
    await page.goto( url, { waitUntil: "networkidle2", timeout: 60_000 } )
    await page.setViewport( { width, height } )
    const ss = await page.screenshot( { fullPage: true } )
    await page.close()

    return ss
}

export { parseHTML, parseSS }