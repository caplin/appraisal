import React, {useState, useEffect} from "react"
import {getUrlPromise, group} from "./utils"
import {
    Accordion,
    AccordionItem,
    AccordionItemButton, AccordionItemHeading,
    AccordionItemPanel
} from "react-accessible-accordion"
import {useImmer} from "use-immer"
import "./RatingForm.css"
import RatingSlider from "./RatingSlider"

const commentTemplate = `Hints:
 What are this persons strengths?
 How have they improved most recently?
 Where could they improve next?
 Summary for 2021
 Any other feedback?
 
`

const responseCommentTemplate = "# Thoughts\n\n\nAgree / Disagree";

function mergeAxes(axisData1 = [], axisData2 = []) {
    if (!Array.isArray(axisData1)) {
        console.error("axisData1 must be an array", axisData1)
        throw new TypeError("axisData1 must be an array")
    }

    const contains = new Set(axisData1.map(a => a.id))
    const result = axisData1.slice()
    for (const axis of axisData2) {
        if (!contains.has(axis.id)) {
            result.push(axis)
        }
    }
    return result
}

function renderAxis(category, axis, ratingState, modifyRating, modifyChangedCategories, ratee, setDirty, otherRatings) {
    // const level = ratee.level
    // const expectedMin = level > 200 ? 10*((level / 100) - 2) : (level / 20)
    // const expectedMax = expectedMin + (level > 200 ? 25 : 15)
    // const scoreRecord = ratingState.ratings.find(({a, s}) => Number(a) === Number(axis.id))

    // this bit isn't done yet, because it needs to be recalculated when the ratingState changes
    // It should probably be pulled out into its own component.
    const isUnusuallyPoor = false // scoreRecord && (scoreRecord.score < expectedMin)
    const isUnusuallyGood = false // scoreRecord && (scoreRecord.score > expectedMax)

    return <section className={"rating"} key={`axis-${axis.id}`}>
        <RatingSlider axis={axis} rating={ratingState} otherRatings={otherRatings} onAfterChange={(score) => {
                    setDirty(true)
                    modifyRating(draft =>  {
                        if (!draft.ratings) {
                            draft.ratings = []
                        }
                        const currentIndex = draft.ratings.findIndex(element => Number(element.axis) === Number(axis.id))
                        if (currentIndex >= 0) {
                            if (score > 0) {
                                draft.ratings[currentIndex].score = score
                            } else{
                                draft.ratings.splice(currentIndex, 1)
                            }
                        } else {
                            if (score > 0) {
                                draft.ratings.push({axis: axis.id, score})
                            }
                        }
                    })
                    modifyChangedCategories(draft => {draft[category] = true})
                }}
        />
        {isUnusuallyPoor ? <span className="outOfRangeMessage good">This is unusually poor for someone of this level</span> : <></>}
        {isUnusuallyGood ? <span className="outOfRangeMessage poor">This is unusually good for someone of this level. Should they be promoted?</span> : <></>}
    </section>
}

export default function RatingForm({rating, otherRatings, onSubmit, setDirty = () => {}, ratee}) {
    const [ratingState, modifyRating] = useImmer(undefined)
    const [groupedAxes, setGroupedAxes] = useState(undefined)
    const [changedCategories, modifyChangedCategories] = useImmer({})

    useEffect(() => {
        let cancelled = false
        modifyRating(draft => rating)
        modifyChangedCategories(draft => ({}))
        setGroupedAxes(undefined)

        const axesLoad = []

        if (!rating.permissions || rating.permissions.ratings) {
            axesLoad.push(getUrlPromise(`api/v1/axes?for=${rating.ratee}`).then(response => response.data))
        }
        if (rating.ratings) {
            const ratedAxisIds = rating.ratings.map(({axis, score}) => axis)
            if (ratedAxisIds.length > 0) {
                axesLoad.push(getUrlPromise(`api/v1/axes/${ratedAxisIds.join(",")}`).then(response => response.data))
            }
        }

        Promise.all(axesLoad).then(([activeAxes, scoredAxes]) => {
            if (cancelled) {return}
            const visualisedAxes = mergeAxes(activeAxes, scoredAxes)
            setGroupedAxes(Object.entries(group(visualisedAxes, (axis) => axis.category)))
        })

        return () => {cancelled = true}
    }, [rating, modifyRating, modifyChangedCategories, setGroupedAxes])

    let mainView = <p>loading...</p>

    if (groupedAxes) {
        let headerSection = (ratingState && ratingState.dateTime) ? <section className="ratingDescription">
            Rating for {ratingState.ratee} given by {ratingState.rater} at {new Date(Number(ratingState.dateTime)).toLocaleString()}
        </section> : <></>

        if (ratingState.comment === undefined) {
            modifyRating(draft => {draft.comment = commentTemplate})
        }

        const preExpanded = groupedAxes.length > 0 ? [groupedAxes[0][0]] : []
        const commentLabel = {"comment": "Raters Comment", "lmComment": "Line Managers Comment", "rateeComment": "Ratee Comment"}
        const commentSection = (ratingState ? ["comment", "lmComment", "rateeComment"].map(commentName => {
            const writeable = (ratingState.permissions && ratingState.permissions[commentName]) || (commentName === "comment" && !ratingState.permissions)
            const hasContent = ratingState[commentName] !== undefined
            if (writeable || hasContent) {
                return <section key={`comment-${commentName}`}>
                    <p>{commentLabel[commentName]}</p>
                    <textarea disabled={!writeable}
                              placeholder={commentName === "rateeComment" ? responseCommentTemplate : commentTemplate}
                              value={ratingState[commentName]}
                              onChange={(event) => {
                                setDirty(true)
                                modifyRating(draft => {draft[commentName] = event.target.value})
                                modifyChangedCategories(draft => {draft.comments = true})
                              }}>
                    </textarea>
                </section>
            } else {
                return <div key={`comment-${commentName}`}></div>
            }
        }) : <></>)

        const canShare = (ratingState.permissions && ratingState.permissions.shareWithRatee) || !ratingState.permissions
        const canDeactivate = ratingState.permissions && ratingState.permissions.active
        const canAck = ratingState.permissions && ratingState.permissions.acknowledgedByRatee
        const canEdit = (ratingState.permissions === undefined) || (Object.values(ratingState.permissions).some(x => x))

        mainView = <div className="ratingBody" key={"id" in rating ? rating.id : "new-rating"}>
            {headerSection}

            <div className="ratingScoresAndComments">
                <Accordion className="ratingScores"
                           allowMultipleExpanded={false}
                           allowZeroExpanded={true}
                           preExpanded={preExpanded.map(a => a.replace(/\s/g, "-"))}>
                    {groupedAxes.map(([category, axes]) => (
                        <AccordionItem key={category} uuid={category.replace(/\s/g, "-")}>
                            <AccordionItemHeading className={changedCategories[category] ? "modified" : "unmodified"}>
                                <AccordionItemButton>{category}</AccordionItemButton>
                            </AccordionItemHeading>
                            <AccordionItemPanel>
                                {axes.map((axis) => renderAxis(category, axis, ratingState, modifyRating, modifyChangedCategories, ratee, setDirty, otherRatings))}
                            </AccordionItemPanel>
                        </AccordionItem>
                    ))}
                </Accordion>
                <div className="ratingComments">
                    {commentSection}
                </div>
            </div>

            <section className="ratingFooter">
                Share With {rating.ratee}: <input type="checkbox" onChange={event => modifyRating(draft => {
                    setDirty(true)
                    draft.shareWithRatee = (event.target.checked)
                })} disabled={!canShare} style={{marginRight: 50}} checked={ratingState.shareWithRatee === true} />

                {canDeactivate ? <>
                    Active: <input type="checkbox" onChange={event => modifyRating(draft => {
                        setDirty(true)
                        draft.active = (event.target.checked)
                    })} style={{marginRight: 50}} checked={ratingState.active === true} />
                </>: <></>}

                {(canAck || (ratingState.permissions && ratingState.permissions.acknowledgedByRatee)) ? <>
                    Acknowledged: <input type="checkbox" onChange={event => modifyRating(draft => {
                    setDirty(true)
                    draft.acknowledgedByRatee = (event.target.checked)
                })} style={{marginRight: 50}} checked={ratingState.acknowledgedByRatee === true} />
                </>: <></>}

                {onSubmit? <button disabled={!canEdit} onClick={() => onSubmit(ratingState)}>Submit Rating</button> : <></>}
            </section>
        </div>
    }

    return mainView
}
