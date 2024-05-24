import sql from "./database.js";

function toSnake(camel) {
    return camel.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export function getWhereClause(filter, tablename) {
    const terms = getWhereClauseTerms(filter, tablename)

    if (terms.length > 0) {
        return sql`where true ${terms}`
    } else {
        return sql``
    }
}

export function getWhereClauseTerms(filter, tablename) {
    const filterEntries = Object.entries(filter)
    return filterEntries.map(compareSql(tablename))
}

const compRE = /^([a-z]{3})\((.*)\)$/
function compareSql(tablename) {
    return ([field, opVal]) => {
        const match = String(opVal).match(compRE)
        let op = 'equ'
        let value = opVal
        if (match) {
            op = match[1]
            value = match[2]
        }
        // this isn't great - string turning into boolean, e.g. for active=true
        if (typeof value === 'string' && ['true'].indexOf(value.toLowerCase()) >= 0) {
            value = true
        }
        return comparisons[op](tablename, field, value)
    }
}
const comparisons = {
    gtn: (tablename, col, val) => sql`and ${sql(tablename)}.${sql(col)} > ${val}`,
    ltn: (tablename, col, val) => sql`and ${sql(tablename)}.${sql(col)} < ${val}`,
    gte: (tablename, col, val) => sql`and ${sql(tablename)}.${sql(col)} >= ${val}`,
    lte: (tablename, col, val) => sql`and ${sql(tablename)}.${sql(col)} <= ${val}`,
    nte: (tablename, col, val) => sql`and ${sql(tablename)}.${sql(col)} != ${val}`,
    equ: (tablename, col, val) => sql`and ${sql(tablename)}.${sql(col)} = ${val}`,
    lik: (tablename, col, val) => sql`and ${sql(tablename)}.${sql(col)} LIKE ${val}`,
    inn: (tablename, col, val) => {
        if (!Array.isArray(val)) {
            val = val.split(",")
        }
        return sql`and ${sql(tablename)}.${sql(col)} IN ${sql(val)}`
    },
    bet: (tablename, col, val) => sql`and ${sql(tablename)}.${sql(col)} BETWEEN ${val}`
}