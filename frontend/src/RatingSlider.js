import "./RatingSlider.css"
import {Slider} from "./Slider"

export default function RatingSlider({rating, otherRatings, axis, value, onAfterChange = () => {}, editor=false}) {
    const axisId = axis.id
    function findScore(rating) {
        if (!rating || !rating.ratings) {
            return undefined
        }
        const result = rating.ratings.find(({axis, score}) => Number(axis) === Number(axisId))
        return result ? Number(result.score) : undefined
    }

    const refPoints = axis.referencePoints.map(({rating, description}) => ({point:rating, label:description}))

    // [{point, label}]
    const previousRatings = otherRatings ? otherRatings.reduce((result, oldRating) => {
        const oldScore = findScore(oldRating)
        if (oldScore !== undefined && oldRating.ratee === rating.ratee) {
            return [...result, {point: oldScore, label: `${oldRating.rater} ${new Date(Number(oldRating.dateTime)).toLocaleDateString("en-gb")}`}]
        } else {
            return result
        }
    }, []) : undefined

    return <div className="RatingSlider">
        {axis.name}
        <p className="axisDescription">{axis.description}</p>
        <Slider disabled={rating && rating.permissions && !rating.permissions.ratings}
                data={{anchor:refPoints, previousRatings}}
                value={value !== undefined ? value : findScore(rating)}
                onChange={onAfterChange}
        />
    </div>
}