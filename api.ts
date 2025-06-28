import express from "express"
import fs from "fs"
import Keyv from "keyv"
import { KeyvFile } from "keyv-file"

import Browsers from "./browsers/browsers.ts"
import { runCleanup } from "./utils.ts"
import { parseHTML, parseSS } from "./src/parser.ts"
import { cacheFile } from "./src/cacheFiles.ts"
import { fetchHTML, fetchSS } from "./src/fetchCachedFiles.ts"

const app = express()

const port = process.env.PORT || 3000

const extensionPath = await fs.promises.realpath( "./extensions/ad-block-plus" )
const browsers = new Browsers( extensionPath )

if ( !fs.existsSync( "./cache" ) ) {
    fs.mkdirSync( "./cache" )
    fs.mkdirSync( "./cache/html" )
    fs.mkdirSync( "./cache/screenshot" )
}

const keyv = new Keyv( {
    store: new KeyvFile( { filename: "./cache/keyv-file.json" } )
} )

app.get( "/", async ( req, res ) => {
    res.send( "Hello!" )
} )

app.get( "/html", async ( req, res ) => {
    const url = req.query.url || "https://example.com"
    const blockAds = req.query.block_ads
    const useProxy = req.query.use_proxy

    let HTMLContent = await fetchHTML( url, keyv )

    if ( HTMLContent !== null )
        return res.send( HTMLContent )

    const browser = await browsers.acquire( useProxy, blockAds )

    HTMLContent = await parseHTML( browser, url )

    res.send( HTMLContent )

    await cacheFile( url, HTMLContent, keyv, "html" )

    await browsers.release( useProxy, blockAds, browser )
} )

app.get( "/screenshot", async ( req, res ) => {
    const url = req.query.url || "https://example.com"
    const blockAds = req.query.block_ads
    const useProxy = req.query.use_proxy
    const width = Number( req.query.width ) || 1920
    const height = Number( req.query.height ) || 1080

    const cachedFilepath = await fetchSS( url, keyv )

    if ( cachedFilepath !== null )
        return res.setHeader( "Content-Type", "image/png" ).sendFile( cachedFilepath )

    const browser = await browsers.acquire( useProxy, blockAds )

    const ss = await parseSS( browser, url, width, height )

    res.setHeader( "Content-Type", "image/png" ).send( ss )

    await cacheFile( url, ss, keyv, "screenshot" )

    await browsers.release( useProxy, blockAds, browser )
} )

app.listen( port, () => {
    console.log(`Example app listening on port ${port}`)
} )

await runCleanup( keyv )