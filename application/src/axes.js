import {getWhereClause} from "./filter.js";
import {restrictToColumns} from "./utils.js";

const axisColumns = ["id","name","category","description","referencePoints","creator","active"]
const restrictToAxisColumns = restrictToColumns(axisColumns)

export class Axes {
    constructor(db) {
        this.db = db
    }

    async get(forPerson, filter = {}) {
        const sql = this.db
        const results = await sql`
            SELECT DISTINCT axis.*, array_remove(array_agg(axis_audience.applicability),NULL) AS audience
            FROM axis
            JOIN axis_audience ON axis.id = axis_audience.axis_id
            JOIN person_group on person_group.email = ${forPerson} AND person_group.group_name = axis_audience.applicability
            ${getWhereClause(filter, 'axis')}
            GROUP BY axis.id;`
        return results
    }

    async getIds(axesIds) {
        return this.getAll({id:`inn(${axesIds.join(",")})`})
    }

    async getAll(filter = {}) {
        const sql = this.db
        const results = await sql`
            SELECT DISTINCT axis.*, array_remove(array_agg(axis_audience.applicability),NULL) AS audience
            FROM axis
            JOIN axis_audience ON axis.id = axis_audience.axis_id
            ${getWhereClause(filter, 'axis')}
            GROUP BY axis.id;`
        return results
    }

    async getById(id) {
        return (await this.getIds([id]))[0]
    }

    async upsert(newAxis) {
        const sql = this.db
        const result = await sql.begin(async sql => {
            let id = newAxis.id
            if (id && (await sql`select * from axis where id=${id}`).length > 0) {
                await sql`update axis SET ${sql(restrictToAxisColumns(newAxis))} where id=${newAxis.id}`
            } else {
                id = (await sql`insert into axis ${sql(restrictToAxisColumns(newAxis))} returning id`)[0].id
                // update the id counter
                await sql`select setval(pg_get_serial_sequence('axis', 'id'), max(id)) from axis`
            }
            if (newAxis.audience) {
                await sql`delete from axis_audience where axis_id=${id}`
                for (const group of newAxis.audience) {
                    await sql`insert into axis_audience values(${id}, ${group})`
                }
            }
            const result = await sql`
                SELECT DISTINCT axis.*, array_remove(array_agg(axis_audience.applicability),NULL) AS audience
                FROM axis
                JOIN axis_audience ON axis.id = axis_audience.axis_id
                WHERE axis.id = ${id}
                GROUP BY axis.id;
            `
            return result[0]
        })
        return result
    }

    // Intended operation is for axes to be marked inactive rather than deleted.
    // This is provided for testing.
    async delete(ids) {
        if (!Array.isArray(ids)) {
            ids = [ids]
        }
        const sql = this.db
        await sql.begin(async sql => [
            sql`delete from axis_audience where axis_id in ${sql(ids)}`,
            sql`delete from axis where axis_id in ${sql(ids)}`
        ])
    }
}