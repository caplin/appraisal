import React from "react"

export default function RateableUsers({ratee, onSelection = (val) => console.log(val), people}) {
    const sortedPeople = people.slice().sort((a,b) => (a.name > b.name) ? 1 : -1)
    return (
        <select value={(ratee && ratee.email) || ""}
                disabled={ratee !== undefined}
                required={true}
                onChange={(event) => onSelection(sortedPeople.find((user) => user.email === event.target.value))}>
            <option key={'null'} value={""}>Choose someone to rate...</option>
            {sortedPeople.map(item => (
                <option key={item.email} value={item.email}>
                    {item.name}
                </option>
            ))}
        </select>
    )
}