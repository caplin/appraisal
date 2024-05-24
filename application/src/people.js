import {getWhereClause} from "./filter.js"
import {restrictToColumns} from "./utils.js";

const peopleColumns = ["name","email","team","level","manager","rateable","active"]
const restrictToPeopleColumns = restrictToColumns(peopleColumns)

export class People {
    constructor(db) {
        this.db = db
    }

    async get(filter = {}, limit = 0) {
        const sql = this.db
        const limitClause = limit > 0 ? sql`limit ${limit}` : sql``
        const results = await sql`
            select 
                p.*,
                array_remove(array_agg(g.group_name), NULL) as groups
            from person as p
            left join person_group as g
            on p.email = g.email
            ${getWhereClause(restrictToPeopleColumns(filter), "p")}
            group by p.email
            ${limitClause};
        `
        return results
    }

    async getUserByEmail(email) {
        const user = await this.get({email}, 1)
        return user[0]
    }

    async upsert(newPerson) {
        const sql = this.db
        const email = newPerson.email
        if (!email) {
            throw new Error("Can't create or update a user without an email present.")
        }
        await sql.begin(async sql => {
            let currentPerson = await sql`select * from person where email=${email}`

            if (currentPerson.length === 0) {
                await sql`insert into person ${sql(restrictToPeopleColumns(newPerson))}`
            } else {
                await sql`update person SET ${sql(restrictToPeopleColumns(newPerson))} where person.email = ${email}`
            }

            if (newPerson.groups) {
                await sql`delete from person_group where email = ${email}`
                for (const groupName of newPerson.groups) {
                    await sql`insert into person_group values(${email}, ${groupName})`
                }
            }
        })
    }

    // Intended operation is for users to be marked inactive rather than deleted.
    // This is provided for testing.
    async delete(emails) {
        if (!Array.isArray(emails)) {
            emails = [emails]
        }
        const sql = this.db
        await sql.begin(async sql => [
            sql`delete from person_group where email in ${sql(emails)}`,
            sql`delete from person where email in ${sql(emails)}`
        ])
    }
}