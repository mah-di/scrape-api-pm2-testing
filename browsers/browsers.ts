import { Browser, launch } from "puppeteer"
import { anonymizeProxy } from "proxy-chain"
import genericPool from "generic-pool"

export default class Browsers {
    extensionPath:          string = "./extensions"
    proxyUrl:               string | null = null

    plainBP:                genericPool.Pool<Browser>|null = null
    adblockBP:              genericPool.Pool<Browser>|null = null
    proxyBP:                genericPool.Pool<Browser>|null = null
    adblockProxyBP:         genericPool.Pool<Browser>|null = null

    constructor(extensionPath: string) {
        this.extensionPath = extensionPath
        this.setProxyUrl()
        this.setBrowserPools()
    }

    async setProxyUrl() {
        const originalProxyUrl = `http://${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`
        this.proxyUrl = await anonymizeProxy(originalProxyUrl)
    }

    async setBrowserPools() {
        while ( !this.proxyUrl ) await new Promise( resolve => setTimeout( resolve, 200 ) )

        this.setPool( 'plainBP', 'chromePlain' )
        this.setPool( 'adblockBP', 'chromeAdblock' )
        this.setPool( 'proxyBP', 'chromeProxy' )
        this.setPool( 'adblockProxyBP', 'chromeAdblockProxy' )
    }

    setPool( poolName: string, functionName: string ) {
        this[poolName] = genericPool.createPool( {
            create: async () => await this[functionName](),
            destroy: async ( browser ) => await browser.close()
        }, { max: 5, min: 1 } )
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

    async acquire(useProxy: boolean, blockAds: boolean) {
        if ( useProxy && blockAds )
            return await this.adblockProxyBP?.acquire()

        else if ( useProxy )
            return await this.proxyBP?.acquire()

        else if ( blockAds )
            return await this.adblockBP?.acquire()

        else
            return await this.plainBP?.acquire()
    }

    async release(useProxy: boolean, blockAds: boolean, browser: Browser) {
        if ( useProxy && blockAds )
            await this.adblockProxyBP?.release(browser)

        else if ( useProxy )
            await this.proxyBP?.release(browser)

        else if ( blockAds )
            await this.adblockBP?.release(browser)

        else
            await this.plainBP?.release(browser)
    }
}