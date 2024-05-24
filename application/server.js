import { join, dirname } from "path"
import { fileURLToPath } from "url"

import express from "express"
import morgan from "morgan"

import {api} from "./src/routes/api_v1.js"
import authRoutes from "./src/routes/auth-routes.js"
import {requireSession} from "./src/utils.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const isProd = process.env.NODE_ENV === "production"

const app = express()

app.use(morgan(isProd ? "common": "dev"))
app.use(express.json())

app.use(express.static(join(__dirname, 'public')))
app.use('/private', requireSession(express.static(join(__dirname, 'private'))))

app.use(authRoutes)
app.use('/api/v1', api)

// Start the server
const port = process.env.PORT || 5000
const hostname = process.env.HOST || ""

app.listen(port, hostname, () => {
    console.info(`Server started at ${new Date().toISOString()} on http://${hostname}:${port}/`)
})

