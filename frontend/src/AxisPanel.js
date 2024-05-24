import React, {useEffect, useState} from 'react'

import "./AxisPanel.css"
import AxisEditor from "./AxisEditor";
import {getUrl, postPromise} from "./utils";

export default function AxisPanel() {
    const [axes, setAxes] = useState([])
    const [selectedAxis, setSelectedAxis] = useState(undefined)

    useEffect(() => getUrl('api/v1/axes?active=true', setAxes, err => window.alert("Problem getting the active axes from the API")), [setAxes])

    return <div className="AxisPanel">
            <div className={selectedAxis ? "AxisTable" : "AxisTable noSelection"}>
                <table>
                    <tbody>
                    <tr>
                        <td>
                            <button onClick={() => setSelectedAxis(
                                {name: "New Axis", category: "Category", description: "A description", audience: [], referencePoints: []}
                            )}>Create</button>
                        </td><td>Create New Axis</td><td></td><td></td>
                    </tr>
                        {axes.map(axis => <tr key={axis.name}>
                            <td><button onClick={() => setSelectedAxis(axis)}>Edit</button> </td>
                            <td>{axis.name}</td><td>{axis.category}</td><td>{axis.description}</td>
                            <td>{axis.active ? "✔️" : "❌"}</td>
                        </tr>)}
                    </tbody>
                </table>
            </div>
        {selectedAxis ? <AxisEditor axis={selectedAxis} onSubmit={(axis) => {
        postPromise(`api/v1/axes${axis.id ? ("/"+axis.id) : ""}`, axis).then(result => {
            if (result.status !== 200) {
                console.error("Problem submitting axis", result)
                window.alert("Problem submitting axis, see developer console.")
            } else {
                console.log('Submitted', result)
            }
        }).catch(err => {
            console.error(err)
            window.alert("Problem submitting axis, see developer console.")
        })
    }}>

        </AxisEditor> : <></>}
    </div>
}