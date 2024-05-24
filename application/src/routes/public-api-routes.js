import express from 'express'
import storage from '../storage.js'

const api = express.Router()

async function getPeople(filter) {
    return Array.from(await storage.people.get(filter))
        // restrict to public fields
        .map(({name, email, team, level, manager, groups, rateable, active}) => ({name, email, team, level, manager, groups, rateable, active}))
}

api.get('/people', async (req, res) => {
    let filter = {...req.query}
    const all = await getPeople(filter)
    res.json(all)
})

api.get('/people/:email', async (req, res) => {
    const result = await storage.people.getUserByEmail(req.params.email)
    res.json(result)
})

api.get('/axes', async (req, res) => {
    if (!req.query.for) {
        res.json(Array.from(await storage.axes.getAll(req.query)))
    } else {
        const axes = Array.from(await storage.axes.get(req.query.for, {active: true}))
        res.json(axes)
    }
})

api.get('/axes/:ids', async (req, res) => {
    res.json(Array.from(await storage.axes.getIds(req.params.ids.split(","))))
})

export default api