import axios from "axios"
import {config} from "./config.js"

export function postPromise(url, data) {
    const apiServer = config.apiServer
    console.info(`> Posting data to ${apiServer}${url}`, data)

    return axios.post(`${apiServer}${url}`, data,{withCredentials: true})
}

export function wordToTitleCase(string) {
    return string.substring(0, 1).toUpperCase() + string.substring(1).toLowerCase()
}

export function post(url, body, onSuccess, onError) {
    postPromise(url, body).then(result => {
            if (result.status !== 200) {
                console.error(`Request for ${url} failed with status ${result.status} ${result.statusText}.`)
                throw result.data
            }
            onSuccess(result.data)
        }).catch(err => {
            console.error(err)
            onError(err)
        })
}

export function getUrlPromise(url) {
    const apiServer = config.apiServer

    console.info(`> Getting ${apiServer}${url}`)
    return axios.get(`${apiServer}${url}`, {withCredentials: true})
}

export function getUrl(url, action, onError) {
    let isCancelled = false
    getUrlPromise(url)
        .then(result => {
            if (!isCancelled) {
                console.debug("< RESPONSE", url, result)
                if (result.status !== 200) {
                    console.error(`Request for ${url} failed with status ${result.status} ${result.statusText}.`)
                    throw result.data
                }
                action(result.data)
            }
        })
        .catch(onError)

    return () => {isCancelled = true}
}

export function cancellableGet(url, action) {
    return () => getUrl(url, action)
}

export function log(arg) {
    console.log(arg);
    return arg
}

export function group(collection, groupAssigner) {
    const result = {}
    for (let item of collection) {
        const group = groupAssigner(item)
        if (result[group] === undefined) {
            result[group] = []
        }
        result[group].push(item)
    }
    return result
}

export const status = new Proxy({}, {
    get: (target, name, receiver) => ({
        name,
        toString: () => `status: ${name}`
    })
})