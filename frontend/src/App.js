import "./App.css"
import React, {useEffect, useState} from "react"
import {Tab, TabList, TabPanel, Tabs} from 'react-tabs'
import './react-tabs.css'
import {getUrl} from "./utils"
import NewRatingPanel from "./NewRatingPanel"
import ViewRatingPanel from "./ViewRatingPanel"
import TeamRate from "./TeamRate"
import AxisPanel from "./AxisPanel"
import {config} from "./config"

function App() {
    console.info("Hi, thanks for trying out this appraisal system.\nI apologise for any problems you might be having with it.\nPlease contact Adam Iley on hangouts and show me any problems.")

    const [me, setMe] = useState(undefined)
    const [people, setPeople] = useState(undefined)
    const [isDirty, setIsDirty] = useState(false)

    useEffect(() => getUrl("profile", setMe, (_err) => window.alert("Problem getting the logged in users profile")), [setMe])

    useEffect(() => getUrl(`api/v1/people?rateable=true`, setPeople, (_err) => {
        window.alert("Problem getting the rateable people from the API.")
    }), [setPeople])

    useEffect(() => {
        const unloadListener = (event) => {
            if (isDirty) {
                event.preventDefault()
                return event.returnValue = "Do you want to leave this page - this will discard your rating."
            }
            return null
        }
        window.addEventListener('beforeunload', unloadListener, {capture: true});
        return () => {
            window.removeEventListener('beforeunload', unloadListener, {capture: true});
        }
    }, [isDirty])

    return (!me || !people) ? (
        <div>Loading...</div>
    ) : ( me.status === 'not-logged-in' ? (
        <div>
            <p>You are not logged in.  Please go to the <a href={`${config.apiServer}/login`}>login page</a>.</p>
        </div>
    ) : (
        <div className="App">
            <div className="appHeader">
                Welcome {me.name}
            </div>
            <Tabs className="appTabs" onSelect={(_index, _lastIndex, _event) => {
                    if (isDirty) {
                        if (window.confirm("Discard these changes?")) {
                            setIsDirty(false)
                            return true
                        }
                        return false
                    }
                }}>
                <TabList>
                    <Tab>Rate Someone</Tab>
                    <Tab>Rate My Team</Tab>
                    <Tab>View Ratings</Tab>
                    {me.groups.indexOf("lm") >= 0 ? <Tab>Axis Editor</Tab> : <></>}
                </TabList>
                <TabPanel>
                    <NewRatingPanel people={people} setDirty={setIsDirty}></NewRatingPanel>
                </TabPanel>
                <TabPanel>
                    <TeamRate me={me} people={people} setDirty={setIsDirty}></TeamRate>
                </TabPanel>
                <TabPanel>
                    <ViewRatingPanel people={people} setDirty={setIsDirty}></ViewRatingPanel>
                </TabPanel>
                <TabPanel>
                    {me.groups.indexOf("lm") >= 0 ? <AxisPanel></AxisPanel> : <></>}
                </TabPanel>
            </Tabs>
        </div>
    ))
}

export default App;
