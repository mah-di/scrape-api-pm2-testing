import fs from "fs"
import Keyv from "keyv"

import { getCacheKey, getFilename, getFilepath } from "../utils.ts"

async function cacheFile( url: string, content: string|any, keyv: Keyv, fileType: string ) {
    const filename = getFilename( url )
    const cacheKey = getCacheKey( filename, fileType )
    const filepath = getFilepath( filename, fileType )

    const mode = ( fileType === "html" ) ? "utf-8" : "binary"

    await fs.promises.writeFile( filepath, content, mode )

    await keyv.set( cacheKey, filepath, 1000 * 60 * 60 * 4 )
}

export { cacheFile }