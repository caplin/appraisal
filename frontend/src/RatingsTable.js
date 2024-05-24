import React, {useState} from "react"
import 'rc-slider/assets/index.css'
import './RatingsTable.css'
import ReactDataGrid from 'react-data-grid'
import { Toolbar, Data } from "react-data-grid-addons"
import AutoSizer from 'react-virtualized-auto-sizer'

const selectors = Data.Selectors;

const BoolFormatter = ({value}) => value === true ? "✔️" : "❌"
const DateFormatter = ({value}) => new Date(Number(value)).toLocaleString("en-GB")

const columns = [
    {key: 'id', name: "ID", width: 40},
    {key: 'dateTime', name: "Date", formatter: DateFormatter, width: 170, resizable: true},
    {key: 'ratee', name: "Ratee", filterable: true},
    {key: 'rater', name: "Rater", filterable: true},
    {key: 'shareWithRatee', name: "Shared With Ratee", formatter: BoolFormatter, resizable: true, width: 160},
    {key: 'acknowledgedByRatee', name: "Acknowledged By Ratee", formatter: BoolFormatter, resizable: true, width: 180},
    {key: 'active', name: "Active", formatter: BoolFormatter, resizable: true, filterable: true, width: 80},
    {key: 'rateesManager', name: "Manager", filterable: true}
]

const handleFilterChange = filter => filters => {
    const newFilters = { ...filters };
    if (filter.filterTerm) {
        newFilters[filter.column.key] = filter;
    } else {
        delete newFilters[filter.column.key];
    }
    return newFilters;
};

function getRows(rows, filters) {
    return selectors.getRows({ rows, filters });
}
export default function RatingsTable({ratings, onSelect, selectedRating}) {
    const [filters, setFilters] = useState({})
    const filteredRows = getRows(ratings, filters)
    const selectedIdx = filteredRows.indexOf(selectedRating)

    return  <AutoSizer style={{height: "100%", width: "100%", overflow: 'hidden'}}>
        {({height, width}) => (
            <ReactDataGrid
                columns={columns}
                rowGetter={i => filteredRows[i]}
                rowsCount={filteredRows.length}
                toolbar={<Toolbar enableFilter={true} />}
                onAddFilter={filter => setFilters(handleFilterChange(filter))}
                onClearFilters={() => setFilters({})}
                minHeight={height - 50 /*sorry for the hardcoding*/}
                rowSelection={{
                    showCheckbox: true,
                    enableShiftSelect: false,
                    onRowsSelected: (rows) => onSelect(rows[0].row),
                    onRowsDeselected: () => onSelect(undefined),
                    selectBy: {indexes: selectedRating ? [selectedIdx] : []}
                }}
            />
        )}
    </AutoSizer>
}
