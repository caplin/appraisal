import postgres from 'postgres'
import { dirname, resolve} from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.info('Database connection:', process.env.DB_URL)
if (process.env.DB_NAME) {
    console.info("Database name overriden to", process.env.DB_NAME)
}

const options = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    onnotice: (..._args) => false,
    transform: postgres.camel
}

if (process.env.NODE_ENV !== 'production') {
    // I don't want to run the risk that someone connects to the real database
    // without the correct authorisations in place.  If you're not running in
    // production, then you're connecting to a test db on your own machine.

    options.host = "localhost"
}

const sql = postgres(process.env.DB_URL, options )

// Ensure the tables are set up correctly
await sql.file(resolve(__dirname, "../setup_tables.sql"))

export default sql
