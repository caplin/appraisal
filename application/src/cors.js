import cors from "cors"

export default function() {
    return cors({
        origin: 'http://appraisal.caplin.com:8081',
        credentials: true
    })
}