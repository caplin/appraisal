import React from 'react'
import {removeOverlapInOneDimension} from "webcola"
import useMeasure from 'react-use-measure'

import "./Slider.css"

const trackMargin = 8
const defaultDatasetHeight = 90
const initialWidth = 900
const labelMargin = 2
const joinAdjust = 4

const Connector = ({className, x, labelX, trackY, joinY, labelY, onClick}) => <>
    <path onClick={onClick} className={`line ${className}`} d={`M${x} ${trackY} V${joinY} H${labelX} V${labelY}`}/>
    <circle onClick={onClick} className={`point ${className}`} cx={x} cy={trackY}/>
</>

const Track = ({className = "", trackWidth, y}) => <line
    className={`track ${className}`}
    x1={trackMargin} y1={y}
    x2={trackWidth + trackMargin} y2={y}
/>

const doNothing = () => {}

/**
 * A slider suited to displaying multiple datasets as well as selection of a value.
 *
 * @example
 * ```
 *      Slider({
 *          labelWidth: 100,
 *          data: {"dataset-name": [{point: 20, label: "points in percent"}, {point:40, label: "other point"}]},
 *          disabled: false,
 *          value: 20,
 *          onChange: (value, oldValue) => {}
 *      })
 * ```
 *
 * @param props {labelWidth: number, data: {}, disabled: boolean, value: number, onChange: function } The props for this slider
 */
export const Slider = ({labelWidth = 115, data = {}, disabled = false, value = undefined, onChange = doNothing}) => {
    const [ref, bounds] = useMeasure()
    const datasetNames = Object.keys(data).filter(datasetName => Array.isArray(data[datasetName]))
    const datasets = Object.values(data).filter(dataset => Array.isArray(dataset)).map(dataset => dataset.sort((a, b) => a.point - b.point))
    const width = bounds.width === 0 ? initialWidth : bounds.width
    const height = bounds.height === 0 ? datasets.length * defaultDatasetHeight : bounds.height
    const trackWidth = width - trackMargin * 2
    const rowHeight = (height - trackMargin) / datasets.length
    const trackRow = Math.ceil(datasets.length / 2)
    const trackY = rowHeight * trackRow
    const percentToX = percent => trackWidth * percent / 100 + trackMargin
    const xToPercent = x => Math.min(100, Math.max(0, (x - trackMargin) * 100/ trackWidth))
    const halfLabelWidth = labelWidth / 2
    const centers = datasets.map(dataSet => dataSet
        .map(({point}) => ({desiredCenter:percentToX(point), size: labelWidth + labelMargin * 2})))
        .map(anchorSpans => anchorSpans.length > 0 ? removeOverlapInOneDimension(anchorSpans, trackMargin, width - trackMargin).newCenters : anchorSpans)
    const selectedX = (value !== undefined && value !== null) ? percentToX(value) : undefined

    const rowToY = (row) => (row >= trackRow) ? rowHeight * (row + 1) : rowHeight * row

    return <div ref={ref} tabIndex={0} className={`Rating ${disabled ? 'disabled' : 'enabled'}`} style={{padding: 0, margin: 0}}
        onKeyDown={(evt) => {
            if (disabled) return
            const currentValue = value === undefined ? 0 : value
            if (evt.key === "ArrowRight") {
                onChange(Math.min(100, Math.ceil(currentValue) + 1), value)
            } else if (evt.key === "ArrowLeft") {
                onChange(Math.max(0, Math.floor(currentValue) - 1), value)
            }
        }}
    >
        <div style={{height: height, overflow: 'hidden', padding: 0, margin: 0}}>
        <svg style={{padding: 0, margin: 0}} viewBox={`0 0 ${width} ${height}`} width={width} height={height}
             onClick={evt => {
                 if (disabled) return
                 if (evt.target.tagName === "svg") {
                     const dim = evt.target.getBoundingClientRect()
                     onChange(xToPercent(evt.clientX - dim.left), value)
                 }
             }}
             onMouseMove={(evt) => {
                 if (disabled) return
                 const target = evt.target
                 if (target.tagName === 'svg' && evt.buttons > 0) {
                     const dim = target.getBoundingClientRect()
                     onChange(xToPercent(evt.clientX - dim.left), value)
                 }
             }}
            >
            <Track trackWidth={trackWidth} y={trackY} />
            {value !== undefined ? <Track className={"selected"} trackWidth={selectedX - trackMargin} y={trackY} /> : null}
            {datasets.map((dataset, j) => {
                    const aboveTrack = j < trackRow
                    let step = 0
                    let lastEnd = -1000
                    let lastPoint = -1
                    return dataset.map(({point, label}, i) => {
                            const x = percentToX(point)
                            const labelX = centers[j][i]
                            if (lastEnd + labelWidth < labelX) {
                                step = 0
                            } else if (point === lastPoint) {
                                // don't do anything
                            } else if (labelX > x){
                                step++
                            } else {
                                step--
                            }
                            lastEnd = centers[j][i] + halfLabelWidth
                            lastPoint = point

                            let y = rowToY(j)
                            let joinY = (step * joinAdjust + rowHeight * 2 / 3) * (aboveTrack ? 1 : -1) + y
                            return <Connector key={"key-"+j+'-'+i} onClick={() => !disabled && onChange(point, value)} className={`datapoint ${datasetNames[j]} ${point === value ? "selected" : "not-selected"}`} x={x} labelX={labelX} trackY={trackY} joinY={joinY} labelY={y} />
                        }
                )})
            }
            {value !== undefined ? <circle className="point selected" cx={selectedX} cy={trackY} onClick={() => !disabled && onChange(undefined, value)}/> : null}
        </svg>
        {datasets.map((dataset, j) => dataset.map(({point, label}, i) => {
                const x = centers[j][i]
                const aboveTrack = j < trackRow
                const style = {position: "absolute", left: x - halfLabelWidth, width: labelWidth}
                if (aboveTrack) {
                    style.top = rowToY(j)
                } else {
                    style.bottom = height - rowToY(j)
                }
                return <div
                    key={String(point)+"-"+label}
                    className={`datapoint label ${datasetNames[j]} ${point === value ? "selected" : "not-selected"}`}
                    style={style}
                    onClick={() => {
                        if (disabled) return
                        onChange(point, value)
                    }}
                >{label}</div>
            }))
        }</div>
    </div>
}