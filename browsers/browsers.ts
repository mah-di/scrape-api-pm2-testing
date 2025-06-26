import { Browser, launch } from "puppeteer"
import { anonymizeProxy } from "proxy-chain"

export default class Browsers {
    extensionPath: string = "./extensions"
    proxyUrl: string | null = null
    plain: Browser|null = null
    adblock: Browser|null = null
    proxy: Browser|null = null
    adblockProxy: Browser|null = null

    constructor(extensionPath: string) {
        this.extensionPath = extensionPath
        this.setProxyUrl()
        this.setBrowsers()
    }

    async setProxyUrl() {
        const originalProxyUrl = `http://${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`
        this.proxyUrl = await anonymizeProxy(originalProxyUrl)
    }

    async setBrowsers() {
        this.plain = await this.chromePlain()
        this.adblock = await this.chromeAdblock()
        this.proxy = await this.chromeProxy()
        this.adblockProxy = await this.chromeAdblockProxy()
    }

    async chromePlain() {
        return await launch({
            headless: false,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox"
            ]
        })
    }

    async chromeAdblock() {
        const browser = await launch({
            headless: false,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                `--disable-extensions-except=${this.extensionPath}`,
                `--load-extensions=${this.extensionPath}`
            ]
        })

        while ( true ) {
            const adblockPage = (
                await browser.pages()
                    .then(pages =>
                        pages
                            .filter(page => page.url().startsWith( 'https://welcome.adblockplus.org/' ))
                    )
                )[0]

            if ( adblockPage ) {
                adblockPage.close()
                break
            }

            await new Promise(resolve => setTimeout(resolve, 1000))
        }

        return browser
    }

    async chromeProxy() {
        return await launch({
            headless: false,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                `--proxy-server=${this.proxyUrl}`
            ]
        })
    }

    async chromeAdblockProxy() {
    const browser = await launch({
        headless: false,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            `--disable-extensions-except=${this.extensionPath}`,
            `--load-extensions=${this.extensionPath}`,
            `--proxy-server=${this.proxyUrl}`
        ]
    })

    while ( true ) {
        const adblockPage = (
            await browser.pages()
                .then(pages =>
                    pages
                        .filter(page => page.url().startsWith( 'https://welcome.adblockplus.org/' ))
                )
            )[0]

        if ( adblockPage ) {
            adblockPage.close()
            break
        }

        await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return browser
    }

    async resolve(useProxy: boolean, blockAds: boolean) {
        if ( useProxy && blockAds )
            return this.adblockProxy

        else if ( useProxy )
            return this.proxy

        else if ( blockAds )
            return this.adblock

        else
            return this.plain
    }
}