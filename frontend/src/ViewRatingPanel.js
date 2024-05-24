import RatingsTable from "./RatingsTable"
import RatingForm from "./RatingForm"
import {getUrl, post} from "./utils"
import React, {useEffect, useState} from 'react'
import SplitterLayout from 'react-splitter-layout';
import 'react-splitter-layout/lib/index.css';

import "./ViewRatingPanel.css"

export default function ViewRatingPanel({people, setDirty = () => {}}) {
    const [viewableRatings, setViewableRatings] = useState(undefined)
    const [selectedRating, setSelectedRating] = useState(undefined)
    const [dirty, setLocalDirty] = useState(false)
    const [refreshCount, _forceRefresh] = useState(0)

    function internalSetDirty(newDirtyState) {
        if (newDirtyState === dirty) {
            return
        }
        setLocalDirty(newDirtyState)
        setDirty(newDirtyState)
    }

    useEffect(() => getUrl('api/v1/ratings', setViewableRatings, err => window.alert("Problem getting the ratings from the API")), [setViewableRatings, refreshCount])

    const splitterChildren = [
        <RatingsTable ratings={viewableRatings} onSelect={(rating) => {
            if (dirty && !window.confirm("Discard this rating?")) {
                return
            }
            internalSetDirty(false)
            setSelectedRating(rating)
        }} selectedRating={selectedRating}/>
    ]

    if (selectedRating) {
        splitterChildren.push(<div className="ratingView">
            <RatingForm rating={selectedRating} otherRatings={viewableRatings} ratee={people.find(p => p.email === selectedRating.ratee)} setDirty={internalSetDirty} onSubmit={(rating) => {
                console.log("Submitting rating", rating)

                post(`api/v1/ratings/${rating.id}`, rating, result => {
                    console.info("Submitted Rating", result)
                    internalSetDirty(false)
                    _forceRefresh(refreshCount+1)
                    setSelectedRating(undefined)
                }, err => window.alert("Problem submitting rating to API, see developer console."))
            }}/></div>)
    }

    return viewableRatings ? <SplitterLayout
        vertical={true}
        primaryIndex={1}
        secondaryMinSize={200}
        primaryMinSize={60}
        secondaryInitialSize={200}
    >
        {splitterChildren}
    </SplitterLayout> : <div>Loading ratings...</div>
}