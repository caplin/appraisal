import "./TeamRate.css"

import {useState, useEffect} from "react"
import {getUrl, post, wordToTitleCase} from "./utils"
import RatingForm from "./RatingForm"

export default function TeamRate({me, people, setDirty = () => {}}) {
    const [quarterlyRatings, setQuarterlyRatings] = useState(undefined)
    const [selectedRating, setSelectedRating] = useState(undefined)
    const [submitted, setSubmitted] = useState(false)
    const [refresh, forceRefresh] = useState(0)

    const now = new Date()
    const since = new Date(now.getFullYear(), now.getMonth() - 4, 1).getTime()

    let isDirty = false
    const internalSetDirty = (newDirtyState) => {
        if (newDirtyState !== isDirty) {
            isDirty = newDirtyState
            setDirty(newDirtyState)
        }
    }

    useEffect(() => getUrl(`api/v1/ratings?rater=${me.email}&dateTime=gte(${since}.0)&active=true`, setQuarterlyRatings, (err) => window.alert("Problem getting recent ratings.")), [setQuarterlyRatings, refresh, since, me.email])

    const isLoading = quarterlyRatings === undefined || people === undefined

    const myTeam = isLoading ? [] : people.filter(person => person.team === me.team)

    if (isLoading) {
        if (submitted !== false) {
            setSubmitted(false)
        }
        return <p>loading...</p>
    }

    const mostRecentRating = quarterlyRatings.reduce((acc, rating) => {
        return {...acc, [rating.ratee]: rating}
    }, {})

    const select = (rating) => () => {
        if (isDirty && !window.confirm("Discard this rating?")) {
            return
        }
        internalSetDirty(false)
        setSubmitted(false)
        setSelectedRating(rating)
    }

    return <div className="TeamRate">
        <div className="RatingsTable">
            Ratings for {wordToTitleCase(me.team)} team since {new Date(since).toDateString()}.
            <table>
                <thead>
                    <tr><th>Name</th><th>Email</th><th>Manager</th><th>Rated?</th><th> </th></tr>
                </thead>
                <tbody>
                {myTeam.map(person => {
                    const rating = mostRecentRating[person.email]
                    return <tr key={person.name} className={rating ? "teammate rated" : "teammate unrated"}>
                        <td>{person.name}</td>
                        <td>{person.email}</td>
                        <td>{person.manager}</td>
                        <td>{rating ? "✔️" : "❌"}</td>
                        <td>{rating ? <button onClick={select(rating)}>Rated</button>
                                    : <button onClick={select({ratee: person.email, ratings: []})}>{person.email === me.email ? "Rate yourself" : "Still To Rate"}</button>
                        }</td>
                    </tr>
                })}
                </tbody>
            </table>
        </div>
        {selectedRating && <div className="ratingView">
            {submitted ? <p>Thank you for submitting your rating for {selectedRating.ratee}.</p> :
            <RatingForm ratee={people.find(p => p.email === selectedRating.ratee)} rating={selectedRating} setDirty={internalSetDirty} onSubmit={(rating) => {
                console.log("Submitting rating", rating)

                post(`api/v1/ratings${rating.id ? ("/"+rating.id) : ""}`, rating, result => {
                    internalSetDirty(false)
                    forceRefresh(refresh + 1)
                }, err => {
                    window.alert("Problem submitting rating to API, see developer console for more.")
                })
                setSubmitted(true)
            }}/>}
        </div>}
    </div>
}