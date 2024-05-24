import {Ratings} from "./ratings.js"
import {People} from "./people.js"
import {Axes} from "./axes.js"
import {setLookupUserData} from "./routes/auth-routes.js";
import db from './database.js'

class Storage {
    constructor(db) {
        this.people = new People(db)
        this.axes = new Axes(db)
        this.ratings = new Ratings(db)
    }
}

setLookupUserData(async (profile) => {
    const email = profile.emails[0].value
    const dataFromDb = await storage.people.getUserByEmail(email)
    return {
        team: "unknown",
        level: 0,
        manager: "unknown@unknown.com",
        rateable: false,
        active: true,
        groups: ["unknown-user"],
        ...dataFromDb,
        id: profile.id,
        emails: profile.emails,
        photos: profile.photos,
        provider: profile.provider,
        email
    }
})

const storage = new Storage(db)
export default storage