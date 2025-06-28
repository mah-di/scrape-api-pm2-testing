require( "dotenv" ).config()

const env = process.env

module.exports = {
    apps: [
        {
            name: "SUPER_SCRAPER",
            script: "./api.ts",
            interpreter: "node",
            watch: false,
            env: {
                NODE_ENV: "development",
                ...env
            },
        },
    ],
}