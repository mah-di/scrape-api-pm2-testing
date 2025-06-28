import Keyv from "keyv"
import fs from "fs"

import { getCacheKey, getFilename } from "../utils.ts"

async function fetchHTML( url: string, keyv: Keyv ) {
    const filename = getFilename( url )
    const cacheKey = getCacheKey( filename, "html" )
    let filepath = await keyv.get( cacheKey )

    if ( filepath ) {
        const HTMLContent = await fs.promises.readFile( filepath, "utf-8" )
        return HTMLContent
    }

    return null
}

async function fetchSS( url: string, keyv: Keyv ) {
    const filename = getFilename( url )
    const cacheKey = getCacheKey( filename, "screenshot" )
    let filepath = await keyv.get( cacheKey )

    if ( filepath ) {
        const fullpath = await fs.promises.realpath( filepath )
        return fullpath
    }

    return null
}

export { fetchHTML, fetchSS }