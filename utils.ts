import fs from "fs"
import Keyv from "keyv"

function getFilename( url: string ) {
    return url
        .replace( /^https?:\/\//, "" )
        .replace( /^www./, "" )
        .replace( /\/$/, "" )
        .replace( /[^a-zA-Z0-9]/g, "_" )
}

function getFilepath( filename: string, filetype: string ) {
    let fileExt = "png"

    if ( filetype === "html" ) fileExt = "html"

    return `./cache/${filetype}/${filename}.${fileExt}`
}

function getCacheKey( filename: string, filetype: string ) {
    return `${filetype}_${filename}`
}

async function runCleanup( keyv: Keyv ) {
    while ( true ) {
        let i = 0
        console.log( "Clearing cache..." )

        for ( let filetype of [ "html", "screenshot" ] ) {
            const files = await fs.promises.readdir( `./cache/${filetype}` )

            await Promise.all(
                files.map( async filename => {
                    const cacheKey = `${filetype}_${filename}`.replace( `.${filetype === "html" ? "html" : "png"}`, "" )
                    const exists = await keyv.has( cacheKey )

                    if ( !exists )
                        await fs.promises.unlink( `./cache/${filetype}/${filename}` ).then( () => i++ )

                })
            )
        }

        console.log( `Cleared cache: ${i} files removed.` )

        await new Promise( resolve => setTimeout( resolve, 120_000 ) )
    }
}

export { getFilename, getFilepath, getCacheKey, runCleanup }