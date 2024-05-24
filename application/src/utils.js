import os from 'os'

export function requireSession(middleware) {
    return (req, res, next) => {
        if (req.user && req.user.token) {
            middleware(req, res, next)
        } else {
            next()
        }
    }
}

export const id = x => x

export function endpoints({address, family, port}, v6impliesv4 = true) {
    const interfaces = Object.values(os.networkInterfaces()).flatMap(id)

    if (address === '::') {
        if (v6impliesv4 === true) {
            return interfaces.map(iface => ({...iface, port}))
        } else {
            return interfaces
                .filter(iface => iface.family === "IPv6")
                .map(iface => ({...iface, port}))
        }
    } else if (address === "0.0.0.0") {
        return interfaces
            .filter(iface => iface.family === "IPv4")
            .map(iface => ({...iface, port}))
    }
    return [{address, family, port}]
}

export const zip = (a, b) => a.map((value, index) => [value, b[index]])

export const boolToStr = (x) => typeof x === 'boolean' ? String(x) : x

export const transformProps = (obj, fn) => {
    const result = {...obj}
    Object
        .entries(result)
        .forEach(([key, value]) => result[key] = fn(value))
    return result
}

export function toBool(val) {
    if (typeof val === 'string') {
        return val === 'true'
    } else if (typeof val === 'number') {
        return val === 1
    } else {
        return val === true
    }
}

export const restrictToColumns = columns => obj => {
    return Object.fromEntries(Object.entries(obj).filter(([field, value]) => {
        return columns.indexOf(field) >= 0 && value != undefined
    }))
}