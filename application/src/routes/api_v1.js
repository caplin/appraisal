import express from 'express'
import privateApiRoutes from './private-api-routes.js'
import publicApiRoutes from './public-api-routes.js'
import cors from '../cors.js'
import { requireSession } from "../utils.js"

export const api = express.Router()

api.use(cors(), publicApiRoutes)
api.use(cors(), requireSession(privateApiRoutes))

api.get("/", (req, res) => {
    res.json({
        response: "all ok",
        version: "v1"
    })
})