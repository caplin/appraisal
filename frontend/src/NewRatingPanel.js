import RateableUsers from "./RateableUsers"
import RatingForm from "./RatingForm"
import React, {useCallback, useState} from "react"
import "./NewRatingPanel.css"
import {post, status} from "./utils";

const {CHOOSE, RATING, SUBMITTING, SUBMITTED} = status

const NewRatingPanel = ({setDirty = () => {}, people}) => {
    let [ratee, internalSetRatee] = useState(undefined)
    let [status, internalSetStatus] = useState(CHOOSE)

    const setStatus = useCallback((newStatus) => {
        if (newStatus === status) {
            return
        }
        if (status !== RATING && newStatus === RATING) {
            setDirty(true)
        } else {
            setDirty(false)
        }
        console.log('setting the status', status, '=>', newStatus)
        internalSetStatus(newStatus)
    }, [status, setDirty, internalSetStatus])

    const setRatee = (r) => {
        const newStatus = r === undefined ? CHOOSE : RATING
        setStatus(newStatus)
        internalSetRatee(r)
    }

    return <div className="NewRatingPanel">
        <div className="ratingSelect">Rate&nbsp;
            <RateableUsers ratee={ratee} people={people} onSelection={setRatee}/>&nbsp;
            {(status === RATING || status === SUBMITTED) ? <button onClick={() => {
                if (status === RATING && !window.confirm("Are you sure? This will discard your current rating.")) {
                    return false
                }
                setRatee(undefined)
            }}>Rate Someone Else</button> : <></>}
        </div>

        <div className="newRatingDisplay">
            {status === RATING ? <RatingForm className="ratingBody" ratee={ratee} rating={{ratee: ratee.email, ratings:[]}} onSubmit={(rating) => {
                const ratingData = {
                    ratee: ratee.email,
                    shareWithRatee: false,
                    rateeComment: null,
                    active: true,
                    ...rating
                }
                console.log("Submitting rating", rating, ratingData)

                post('api/v1/ratings', ratingData, () => setStatus(SUBMITTED), err => window.alert("Problem submitting your rating"))
                setStatus(SUBMITTING)
            }} /> : <></>}

            {(status === SUBMITTED || status === SUBMITTING) ? <div>
                Thank you for submitting your rating.
            </div> : <></>}
        </div>
    </div>
}

export default NewRatingPanel