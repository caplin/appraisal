import "./AxisEditor.css"
import RatingSlider from "./RatingSlider"
import {useState, useEffect, useRef} from "react"
import {useImmer} from "use-immer";
import {getUrl} from "./utils";

export default function AxisEditor({axis, onSubmit}) {
    const [axisData, setAxisData] = useImmer(axis)
    const [value, setValue] = useState(0)
    const [rateableUsers, setRateableUsers] = useState([])
    const audienceInput = useRef()
    const [submitted, setSubmitted] = useState(false)

    useEffect(() => {
        if (axisData.id !== axis.id) {
            setAxisData(draft => axis)
            setSubmitted(false)
        }
    }, [axis, setAxisData])

    useEffect(() => getUrl("api/v1/people?rateable=true", (users) => setRateableUsers(users)), [])

    function lookupValue() {
        const point = axisData.referencePoints.find(refPoint => refPoint.rating === value)
        return point ? point.description : ""
    }

    const inUseGroups = Array.from(new Set(rateableUsers.flatMap(user => user.groups))).filter(a => a.indexOf("@") < 0)
    inUseGroups.sort()

    if (submitted) {
        return <div className="AxisEditor">
            <p>Thank you for submitting your axis.</p>
        </div>
    }

    return <div className="AxisEditor" key={axisData.id || "new-axis"}>
        <div>
            <label htmlFor="name">Axis Name</label> <input id="name" type="text" defaultValue={axisData.name} onChange={(event) => {
                setAxisData(draft => {draft.name = event.target.value})
            }}></input>
        </div>
        <div>
            <label htmlFor="catgegory">Category</label> <input id="category" type="text" defaultValue={axisData.category} onChange={(event) => {
                setAxisData(draft => {draft.category = event.target.value})
            }}></input>
        </div>
        <div>
            <label htmlFor="description">Description</label> <input id="description" type="text" defaultValue={axisData.description} onChange={(event) => {
                setAxisData(draft => {draft.description = event.target.value})
            }}></input>
        </div>
        <div>
            <label htmlFor="active">Active</label> <input id="active" type="checkbox" defaultChecked={axisData.active} onChange={(event) => {
                setAxisData(draft => {draft.active = event.target.checked})
            }}></input>
        </div>
        <div>
            <label>Audience</label>
            <div className="audienceSetting">
                <ul>
                    {axisData.audience.map(group => <li key={group}>{group} <button onClick={() => {
                        setAxisData(draft => {
                            draft.audience = draft.audience.filter(a => a !== group)
                        })
                    }}>x</button></li>)}
                </ul>
                <p>Groups currently assigned to users: {inUseGroups.map(a => <><span className="group" key={"span-" + a} onClick={() => audienceInput.current.value = a}>{a}</span>, </>)}</p>
                <p>You can also use email addresses to target individuals directly.</p>
                Add group <input ref={audienceInput} type="text" defaultValue="everyone"></input>
                <button onClick={() => {
                    setAxisData(draft => {
                        const group = audienceInput.current.value
                        draft.audience = draft.audience.filter(a => a !== group)
                        draft.audience.push(group)
                    })
                }}>Add</button> to the audience for this axis.
            </div>
        </div>

        <p>When defining general anchor points, and it makes sense to do so, aim for Grad at level 5,
            Junior at level 10, Engineer at level 25, Senior at 45, Lead at 65, Principal/Architect at 85,
            World expert 95. Ideally, the skills come in a little before the levels
            (e.g. 5/10/20/40/60/80/95), so that people have chance to practice before they get promoted.</p>

        <section className="rating">
            <RatingSlider value={value} axis={axisData} editor={true} onAfterChange={newValue => setValue(Math.round(newValue))}></RatingSlider>
        </section>

        <div>
            <label htmlFor="anchorvalue">Anchor Value</label> <input id="anchorvalue" readOnly={true} type="number" value={value}></input>
        </div>
        <div>
            <label htmlFor="anchortext">Text</label> <input id="anchortext" type="text" value={lookupValue()} onChange={(event) => {
                setAxisData(draft => {
                    let point = draft.referencePoints.find(refPoint => refPoint.rating === value)
                    if (!point) {
                        point = {rating: value}
                        draft.referencePoints.push(point)
                    }
                    point.description = event.target.value
                })
            }}></input>
            <button onClick={() => {
                setAxisData(draft => {
                    const index = draft.referencePoints.findIndex(refPoint => refPoint.rating === value)
                    if (index >= 0) {
                        draft.referencePoints.splice(index, 1)
                    }
                })
            }}>x</button>
        </div>
        {onSubmit ? <section className="submitSection">
            <button onClick={() => {
                onSubmit(axisData)
                setSubmitted(true)
            }}>Submit Axis</button>
        </section> : <></>}
    </div>
}