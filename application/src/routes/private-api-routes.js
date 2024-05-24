import express from "express"
import storage from "../storage.js"
import {toBool} from "../utils.js"

const api = express.Router()

api.post('/axes', async (req, res) => {
    const me = req.user.email

    if (req.body.id) {
        res.status(500).json({
            status: 'error',
            message: `To modify this axis, post to /axes/${req.body.id}`
        })
    } else if (!req.body.name || !req.body.category || !req.body.description || !req.body.audience || !req.body.referencePoints) {
        res.status(500).json({
            status: 'error',
            message: `Please provide a name, category, description, audience and referencePoints`
        })
    } else {
        const result = await storage.axes.upsert({...req.body, active: true, creator: me})
        res.json(result)
    }
})

api.post('/axes/:id', async (req, res) => {
    const me = req.user.email
    const id = req.params.id
    const axis = await storage.axes.getById(id)

    if (axis.creator === me || req.user.groups.indexOf('admin') >= 0 || req.user.groups.indexOf('lm') >= 0) {
        const result = await storage.axes.upsert({
            ...req.body,
            creator: axis.creator,
            id: id
        })
        res.json(result)
    } else {
        console.error("Only the creator or someone in the admin group can edit axes")
        res.status(500).json({
            status: 'error',
            message: 'only the creator or someone in the admin group can edit axes'
        })
    }
})

const allowedRatingsFilters = ["id", "dateTime", "rater", "ratee", "shareWithRatee", "acknowledgedByRatee", "active"]

api.post('/ratings', async (req, res) => {
    const {ratee, ratings, comment, shareWithRatee, lmComment, rateeComment} = req.body
    const rater = req.user.email
    const dateTime = Date.now()

    if (req.body.id) {
        res.status(500).json({status: 'error', message: `To update this rating, post to /ratings/${req.body.id}`})
    } else if (!ratee || !ratings) {
        res.status(500).json({status: 'error', message: 'A valid rating includes a `ratee` email and a `ratings` array of ratings in the form {axis: axisId, score: score}.'})
    } else {
        const result = await storage.ratings.upsert({dateTime, rater, ratee, ratings, comment, lmComment, rateeComment, shareWithRatee: toBool(shareWithRatee), acknowledgedByRatee: false, active: true})
        res.json(result)
    }
})

api.get('/ratings/:id', async (req, res) => {
    const filter = allowedRatingsFilters.reduce((filter, key) => req.query[key] ? {...filter, [key]: req.query[key]} : filter, {})
    filter.id = req.params.id

    const results = (await getRatings(filter, req.user, 1))[0]
    res.json(results)
})

api.get('/ratings', async (req, res) => {
    const filter = allowedRatingsFilters.reduce((filter, key) => req.query[key] ? {...filter, [key]: req.query[key]} : filter, {})
    const results = await getRatings(filter, req.user, 400)
    res.json(results)
})

api.post('/ratings/:id', async (req, res) => {
    const id = req.params.id
    const me = req.user.email
    const rating = (await getRatings({id}, req.user, 1))[0]

    if (!rating) {
        console.warn(`${me} requested rating id ${id} which does not exist.`)
        res.status(404).json({status: 'error', message: `rating ${id} was not found.`})
        return
    }

    const perms = getRatingPermission(req.user, req.body)

    let allowedChanges = {}, disallowedChanges = {}, permissionsProblem = false

    for (let key in req.body) {
        if (key !== 'permissions' && key !== 'view') {
            if (perms[key]) {
                allowedChanges[key] = req.body[key]
            } else if (key !== "ratings" && req.body[key] !== rating[key])  {
                disallowedChanges[key] = rating[key]
                permissionsProblem = true
            }
        }
    }

    if (permissionsProblem) {
        console.warn(`${me} attempted to make disallowed changes:`, disallowedChanges)
        res.status(403).json({status: 'error', message: `User ${me} does not have permission to make these modifications.`, request: disallowedChanges})
        return
    }

    const ratingToStore = {
        ...rating,
        ...allowedChanges}

    ratingToStore.shareWithRatee = toBool(ratingToStore.shareWithRatee)
    ratingToStore.acknowledgedByRatee = toBool(ratingToStore.acknowledgedByRatee)
    ratingToStore.active = toBool(ratingToStore.active)

    await storage.ratings.upsert(ratingToStore)

    res.json(ratingToStore)
})

function getRatingPermission(user, rating) {
    const permissions = {view: false}

    if (rating.rater === user.email) {
        // you gave this rating
        permissions.view = true
        permissions.comment = true
        permissions.ratings = true
        permissions.shareWithRatee = true
        permissions.active = true
    }
    if (user.groups && (user.groups.indexOf('engman') >= 0 || user.groups.indexOf('excom') >= 0 || user.groups.indexOf('hr') >= 0)) {
        // If you're an hr or excom user you can see all ratings
        permissions.view = true
    }
    if (rating.shareWithRatee && rating.ratee === user.email && rating.active) {
        // this rating is about you
        permissions.view = true
        permissions.rateeComment = true
        permissions.acknowledgedByRatee = true
    }
    if (rating.rateesManager === user.email) {
        // this rating is about someone you manage
        permissions.view = true
        permissions.lmComment = true
        permissions.shareWithRatee = true
        permissions.active = true
        permissions.rateeComment = true
        permissions.acknowledgedByRatee = true
    }

    return permissions
}


async function getRatings(filter, user, limit = 0) {
    const ratingsInSystem = await storage.ratings.get(filter, limit)
    const withPerm = Array.from(ratingsInSystem).map(rating => {
        rating.permissions = getRatingPermission(user, rating)
        return rating
    })
    const result = withPerm.filter(rating => rating.permissions.view)
    return result
}

api.post('/people', async (req, res) => {
    const isAdmin = req.user.groups && (req.user.groups.indexOf('HR') >= 0 || req.user.groups.indexOf('excom') >= 0)
    const me = req.user.email

    if (!isAdmin) {
        res.status(500).json({
            status: 'error',
            message: `${me} is not allowed to add or edit people.`
        })
        return
    }

    res.json(await storage.people.upsert(req.body))
})

const startTime = new Date()

api.get('/debug', async (req, res) => {
    res.json({
        yourHeaders: req.headers,
        googleClientId: process.env.GOOGLE_CLIENT_ID === undefined ? null : process.env.GOOGLE_CLIENT_ID,
        dbUrl: process.env.DB_URL,
        me: req.user,
        startTime: startTime.toISOString(),
        env: process.env.NODE_ENV,
        port: process.env.PORT,
        host: process.env.HOST
    })
})

export default api
