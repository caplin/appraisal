import express from 'express'
import session from 'express-session'
import passport from 'passport'
import passportGoogle from 'passport-google-oauth'
import Local from 'passport-local'
import cors from '../cors.js'
import MemoryStoreFactory from 'memorystore'

const MemoryStore = MemoryStoreFactory(session)

let lookupUserData = (profile) => ({profile})

export function setLookupUserData(fn) {
    lookupUserData = fn
}

const router = express.Router()

const successfulLoginRedirect = "/"

console.info("Google auth client id", process.env.GOOGLE_CLIENT_ID)

if (process.env.GOOGLE_CLIENT_ID) {
    // The below data is got from the google console: https://console.developers.google.com
    passport.use(new passportGoogle.OAuth2Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.GOOGLE_AUTH_HANDLER}`
    }, (token, refreshToken, profile, done) => {
       Promise.resolve(lookupUserData(profile)).then(
           userData => {
               done(null, {...userData, token})
           }
       )
    }))
} else {
    passport.use(new Local.Strategy(
        function(username, password, done) {
            if (password !== 'devpass') {
                console.info(`Dev: Local Strategy: Attempting to login with ${username} ${password}, disallowed because password was wrong.`)
                return done("bad password")
            }
            Promise.resolve(lookupUserData({
                id: '-local-testuser-id-',
                provider: 'local',
                emails: [{value: `${username}`}],
                photos: []}
            )).then(
                userData => {
                    console.info(`Dev: Local Strategy: Attempting to login with ${username} ${password}, allowed.  User is ${JSON.stringify(userData)}`)

                    done(null,  {
                        ...userData,
                        token: '-test-user-token-'
                    })
                }
            )
        }
    ))
}

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))

router.use(session({
    resave: false,
    secret: 'caplin-secret',
    saveUninitialized: true,
    cookie: {
        // sameSite: 'none'
    },
    store: new MemoryStore({
        checkPeriod: 1000*60*60*24*100 // prune expired entries every 100 days
    })
}))
router.use(express.urlencoded({extended: true}))
router.use(passport.initialize())
router.use(passport.session())

if (process.env.GOOGLE_CLIENT_ID) {
    router.get('/login', passport.authenticate(
        'google', {
            scope: ['https://www.googleapis.com/auth/userinfo.email']
        }))
} else {
    router.post('/login',
        passport.authenticate('local', {failureRedirect: '/login_failed.html'}),
        (req, res) => res.redirect(successfulLoginRedirect)
    )

    router.get('/login', (req, res) => {
        res.send(`
<p>You're seeing this because you haven't configured google auth (by adding the details to a .env file).</p>

<p>This form is for development use only. You can log in as any user for testing using the development password.</p>
<form action="/login" method="post">
    <div>
        <label>Username:</label>
        <input type="text" name="username"/>
    </div>
    <div>
        <label>Password:</label>
        <input type="password" name="password"/>
    </div>
    <div>
        <input type="submit" value="Log In"/>
    </div>
</form>
`)})
}


function profile(req) {
    if (req.user && req.user.token) {
        return {
            ...req.user,
            status: 'logged-in',
        }
    } else {
        return{
            status: 'not-logged-in',
            link: '/login'
        }
    }
}

router.use('/profile', cors())
router.get('/profile', (req, res) => {res.json(profile(req))})
router.get('/profile.js', (req, res) => {
    const profileText = JSON.stringify(profile(req))
    res.contentType("text/javascript")
    res.send(`export default ${profileText}`)
})
router.get('/logout', (req, res) => {
    req.logout()
    req.session.destroy()
    res.redirect('/')
})
router.get("/auth",
    passport.authenticate('google', {
        failureRedirect: '/login_failed.html'
    }),
    (req, res) => {
        const email = req.user.email
        console.info(`${email} authenticated.`)
        res.redirect(successfulLoginRedirect)
    }
)

export default router