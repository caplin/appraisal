import {restrictToColumns} from "./utils.js";
import {getWhereClause} from "./filter.js";

const ratingColumns = ["id","dateTime","rater","ratee","comment","shareWithRatee","acknowledgedByRatee", "rateeComment", "lmComment", "active"]
const restrictToRatingColumns = restrictToColumns(ratingColumns)

export class Ratings {
    constructor(db) {
        this.db = db
    }

    async get(filter, limit = 0) {
        const sql = this.db
        const limitClause = limit > 0 ? sql`limit ${limit}` : sql``
        const result = await sql`
            SELECT rating.*,
                   CASE
                       WHEN COUNT(rating_score.*) = 0 THEN '[]'::json
                       ELSE json_agg(json_build_object('axis', rating_score.axis_id, 'score', rating_score.score))
                       END AS ratings,
                   MIN(ratee.manager) AS ratees_manager
            FROM rating
                     LEFT JOIN rating_score ON rating.id = rating_score.rating_id
                     LEFT JOIN person AS ratee ON ratee.email = rating.ratee
            ${getWhereClause(restrictToRatingColumns(filter), "rating")}
            GROUP BY rating.id
            ORDER BY rating.id DESC 
            ${limitClause};
        `
        return result
    }

    async getById(ratingId) {
        return (await this.get({id:ratingId}, 1))[0]
    }

    async upsert(newRating) {
        const sql = this.db
        const result = await sql.begin(async sql => {
            let id = newRating.id

            if (id && (await sql`select *
                                 from rating
                                 where id = ${id}`)) {
                await sql`update rating
                          set ${sql(restrictToRatingColumns(newRating))}
                          where id = ${id}`
            } else {
                const insertions = restrictToRatingColumns(newRating)
                id = (await sql`insert into rating ${sql(insertions)} returning id`)[0].id

                // update the id counter
                await sql`select setval(pg_get_serial_sequence('rating', 'id'), max(id))
                          from rating`
            }
            if (newRating.ratings) {
                await sql`delete
                          from rating_score
                          where rating_id = ${id}`
                for (const ratingScore of newRating.ratings) {
                    await sql`insert into rating_score
                              values (${id}, ${ratingScore.axis}, ${ratingScore.score})`
                }
            }

            const result = await sql`
                select rating.*, ratee.manager as ratees_manager
                from (select rating.*,
                             json_agg(json_build_object('axis', rating_score.axis_id, 'score',
                                                        rating_score.score)) AS ratings
                      from rating
                               join rating_score on rating.id = rating_score.rating_id
                      where rating.id = ${id}
                      group by rating.id) as rating
                         join person as ratee on ratee.email = rating.ratee
            `
            return result[0]
        })
        return result
    }

    async delete(ids) {
        if (!Array.isArray(ids)) {
            ids = [ids]
        }
        const sql = this.db
        await sql.begin(async sql => [
            sql`delete from rating_score where rating_id in ${sql(ids)}`,
            sql`delete from rating where id in ${sql(ids)}`
        ])
    }
}
