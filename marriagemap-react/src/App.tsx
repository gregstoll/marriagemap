import React, { Component } from 'react';
import { USStateMap, DateSlider, TickDateRange, ColorGradient } from 'us-state-map';
import { loadMarriageData, MarriageDate, AllMarriageData, StateMarriageStatusUpdate, MarriageStatus, MarriageStatusEnum } from './DataHandling';

import 'rc-slider/assets/index.css';
import 'semantic-ui-css/semantic.min.css';
import './App.css';
import { DateSliderSpeedEnum } from 'us-state-map/dist/DateSlider';
import { GradientDirection } from 'us-state-map/dist/USStateMap';

let parseColor = require('parse-color');

interface AppState {
    marriageData: AllMarriageData,
    curDate: TickDateRange,
    stateSelected: string | undefined,
    isCartogram: boolean,
    rainbowColor: boolean
}

const MAX_YEAR = new TickDateRange(2015, 5);
const MIN_YEAR = new TickDateRange(1990, 2);
const TICKS_PER_YEAR = 4;
const BUCKET_SIZE = 12 / TICKS_PER_YEAR;
const ONE_BASED_MONTH_TO_BUCKET = [-1];
for (let i = 1; i <= 12; ++i) {
    const bucket = Math.floor((i - 1) / BUCKET_SIZE);
    ONE_BASED_MONTH_TO_BUCKET.push(bucket);
}


const mapDescriptions = new Map<MarriageStatus, string>(Object.entries({
    "Mar": "Marriage is legal",
    "CU": "Civil unions are legal",
    "CULite": "Civil unions that have some rights included in marriage are legal",
    "None": "No applicable law or unclear",
    "NoMar": "Marriage forbidden by statute",
    "NoCU": "Marriage or civil unions forbidden by statute",
    "NoMarConst": "Marriage forbidden by state constitution",
    "NoCUConst": "Marriage or civil unions forbidden by state constitution"
}) as Array<[MarriageStatus, string]>);
const mapColors = new Map<MarriageStatus, string>(Object.entries({
    //"Mar": "rgb(26, 152, 80)",
    "Mar": "rgb(20, 118, 255)",
    //"CU": "rgb(102, 189, 99)",
    "CU": "rgb(26, 152, 80)",
    "CULite": "rgb(166, 217, 106)",
    //"None": "rgb(255, 255, 191)",
    "None": "rgb(222, 222, 222)",
    "NoMar": "rgb(254, 224, 139)",
    "NoCU": "rgb(253, 174, 97)",
    "NoMarConst": "rgb(244, 109, 67)",
    "NoCUConst": "rgb(215, 48, 39)"
}) as Array<[MarriageStatus, string]>);
const stateNames = new Map<string, string>(Object.entries(
    {
        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DC': 'District of Columbia', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
    }) as Array<[string, string]>);

class App extends Component<{}, AppState> {
    state: AppState;
    constructor(props: {}) {
        super(props);
        this.state = {
            marriageData: new Map<string, Array<StateMarriageStatusUpdate>>(),
            curDate: MAX_YEAR,
            stateSelected: undefined,
            isCartogram: true,
            rainbowColor: true
        }
        // TODO - respond when hash changes (like back button)
        if (window.location.hash) {
            const hashVals = window.location.hash.substr(1).split('&').map(x => x.split('='));
            //let newState : Partial<AppState> = {};
            for (const keyAndValue of hashVals) {
                if (keyAndValue.length === 2) {
                    const key = keyAndValue[0];
                    const value = keyAndValue[1];
                    switch (key) {
                        case "year":
                            const yearParts = value.split('-').map(s => parseInt(s, 10));
                            if (yearParts.length === 2) {
                                this.state.curDate = new TickDateRange(yearParts[0], yearParts[1]);
                            }
                            break;
                        case "state":
                            this.state.stateSelected = value;
                            break;
                        case "cartogram":
                            this.state.isCartogram = value !== "0";
                            break;
                    }
                }
            }
        }
    }

    onStateSelected(stateCode: string) {
        this.setState({ stateSelected: stateCode });
    }
    onStateCleared() {
        this.setState({ stateSelected: undefined });
    }

    onSliderDateChange(date: TickDateRange) {
        this.setState({ curDate: date, stateSelected: undefined });
    }

    onMapError(error: any) {
        alert("Error: " + this._errorStringFromError(error));
    }
    _errorStringFromError(error: any) {
        // JS exceptions have this
        if (error.hasOwnProperty("message")) {
            return error.message;
        }
        return error;
    }

    async componentDidMount() {
        let marriageData = await loadMarriageData();
        this.setState({ marriageData: marriageData });
    }
    updateLocationHash() {
        let hashParts = [];
        // don't set year, I guess
        if (this.state.stateSelected !== undefined) {
            hashParts.push(`state=${this.state.stateSelected}`);
        }
        if (!this.state.isCartogram) {
            hashParts.push("cartogram=0");
        }
        window.location.hash = hashParts.join('&');
    }
    render() {
        this.updateLocationHash();
        const monthText = ["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"][((this.state.curDate.endMonth + 1) / 3) - 1];
        const stateColors = new Map<string, string | ColorGradient>();
        const stateTitles = new Map<string, string>();
        for (const [stateCode, allStateData] of this.state.marriageData) {
            let status: MarriageStatus = "None";
            let courtOverturnedBan = false;
            for (let curUpdate of allStateData) {
                if (this.dateIsGreater(curUpdate.date, this.state.curDate)) {
                    break;
                }
                status = curUpdate.status;
                if (curUpdate.pendingInfo !== undefined) {
                    if (curUpdate.pendingInfo.courtOverturnedBan !== undefined) {
                        courtOverturnedBan = curUpdate.pendingInfo.courtOverturnedBan as boolean;
                    }
                    if (curUpdate.pendingInfo.clear === true) {
                        courtOverturnedBan = false;
                    }
                }
            }
            const color = mapColors.get(status) as string;
            if (courtOverturnedBan && this.state.rainbowColor) {
                // use a rainbow gradient for state-overturned bans
                const gradient = new ColorGradient(color, mapColors.get("Mar") as string, GradientDirection.Right, 0.4);
                stateColors.set(stateCode, gradient);
            }
            else {
                stateColors.set(stateCode, color);
            }
            stateTitles.set(stateCode, mapDescriptions.get(status) as string);
        }
        /* Use "position: relative" here so MarriageMapLegend (which has position: "absolute")
           will use this div as its "closest positioned ancestor" */
        return (
            <div style={{ width: 900, margin: "15px auto", position: "relative" }}>
                <USStateMap isCartogram={this.state.isCartogram}
                    stateColors={stateColors}
                    stateTitles={stateTitles}
                    stateSelectedCallback={stateCode => this.onStateSelected(stateCode)}
                    stateClearedCallback={() => this.onStateCleared()}
                    width={900}
                    height={500}
                    onError={error => this.onMapError(error)} />
                <MarriageMapLegend isCartogram={this.state.isCartogram} />
                <div>Date: {monthText} {this.state.curDate.endYear}</div>
                {/* Use empty cssProps so the slider grows to the size of its container */}
                <DateSlider
                    ticksPerYear={TICKS_PER_YEAR}
                    startTickDateRange={MIN_YEAR}
                    endTickDateRange={MAX_YEAR}
                    currentTickDateRange={this.state.curDate}
                    onTickDateRangeChange={date => this.onSliderDateChange(date)}
                    initialSpeed={DateSliderSpeedEnum.Fast}
                    cssProps={{}}
                />
                <div><label>Cartogram:&nbsp;
                    <input type="checkbox" checked={this.state.isCartogram} onChange={event => this.setState({ isCartogram: event.currentTarget.checked })}/></label>
                </div>
                <div><label>Rainbow color for court-overturned bans:&nbsp;
                    <input type="checkbox" checked={this.state.rainbowColor} onChange={event => this.setState({ rainbowColor: event.currentTarget.checked })}/></label>
                </div>
                <StateDescriptions
                    stateSelected={this.state.stateSelected}
                    curDate={this.state.curDate}
                    marriageData={this.state.marriageData}
                    setSelectedState={stateCode => this.setState({ stateSelected: stateCode })}
                    setCurDate={curDate => this.onSliderDateChange(this.marriageDateToTickDateRange(curDate))}
                    />
            </div>
        );
    }
    colorFromStateUpdate(stateUpdate: StateMarriageStatusUpdate): string {
        return mapColors.get(stateUpdate.status) as string;
    }
    dateIsGreater(marriageDate: MarriageDate, curDate: TickDateRange): boolean {
        if (marriageDate.year > curDate.endYear) {
            return true;
        }
        if (marriageDate.year < curDate.endYear) {
            return false;
        }
        // marriageDate is 1 indexed, curDate is 0 indexed
        return (marriageDate.month > curDate.endMonth + 1);
    }
    marriageDateToTickDateRange(marriageDate: MarriageDate): TickDateRange {
        // month is 1-based
        const curMonthBucket = ONE_BASED_MONTH_TO_BUCKET[marriageDate.month - 1];
        return new TickDateRange(marriageDate.year, (curMonthBucket + 1) * BUCKET_SIZE - 1);
    }
}

interface StateDescriptionsProps {
    stateSelected: string | undefined,
    marriageData: AllMarriageData,
    curDate: TickDateRange,
    setSelectedState: (stateCode: string) => void,
    setCurDate: (curDate: MarriageDate) => void
}

class StateDescriptions extends Component<StateDescriptionsProps, {}> {
    render() {
        if (this.props.marriageData.size === 0) {
            // still loading data...
            return <div />;
        }
        if (this.props.stateSelected) {
            const updates = this.props.marriageData.get(this.props.stateSelected) as StateMarriageStatusUpdate[];
            const entryArray = updates.map((update, index) => {
                return this.getDescriptionFromUpdate(update, updates[index-1], index);
            });
            return <div><h1>{stateNames.get(this.props.stateSelected) as string}</h1><ul>{entryArray}</ul></div>;
        }
        else {
            const stateCodes : string[] = Array.from(this.props.marriageData.keys()).sort();
            // ugh, 0-indexed to 1-indexed
            const curMarriageDate = { year: this.props.curDate.endYear, month: this.props.curDate.endMonth + 1 };
            const entryArray : Array<JSX.Element> = [];
            let count = 0;
            for (const stateCode of stateCodes) {
                const updates = this.props.marriageData.get(stateCode) as StateMarriageStatusUpdate[];
                let lastUpdate: StateMarriageStatusUpdate | undefined = undefined;
                //TODO - could do some kind of binary search here, I guess
                for (const update of updates) {
                    if (this.inBucket(update.date, curMarriageDate)) {
                        entryArray.push(this.getDescriptionFromUpdate(update, lastUpdate, count));
                        count++;
                    }
                    lastUpdate = update;
                }
            }
            return <ul>{entryArray}</ul>;
        }
    }
    getDescriptionFromUpdate(update: StateMarriageStatusUpdate, previousUpdate: StateMarriageStatusUpdate | undefined, index: number): JSX.Element {
        let prefix = null;
        if (this.props.stateSelected) {
            prefix = <button className="link-button" onClick={() => this.props.setCurDate(update.date)}>{ this.dateToString(update.date) }</ button>;
        }
        else {
            prefix = <span><button className="link-button" onClick={() => this.props.setSelectedState(update.stateCode)}> {stateNames.get(update.stateCode)}</button>: {this.dateToString(update.date)}</span>;
        }
        const backgroundColor = mapColors.get(update.status) as string;
        const foregroundColor = this.getLabelColor(backgroundColor);
        const isImportant = previousUpdate !== undefined && update.status !== previousUpdate.status;
        const className = isImportant ? "importantEntry" : "";
        return <li key={index} className={className}>
            {prefix}: <span style={{ backgroundColor: backgroundColor, color: foregroundColor }}>{mapDescriptions.get(update.status)}</span>
            &nbsp;-&nbsp;<span dangerouslySetInnerHTML={{ __html: update.description }}/>
            </li>;
    }
    getLabelColor(backgroundColor: string): string {
        let backgroundParsedColor = parseColor(backgroundColor);
        // Used to use HSL, but I think this is more accurate
        let rgb: number[] = backgroundParsedColor.rgb;
        if (rgb === null || rgb === undefined) {
            return "#000";
        }
        let grayscale = 0.2989 * rgb[0] + 0.5870 * rgb[1] + 0.1140 * rgb[2];
        if (grayscale > 0.5 * 255) {
            return "#000";
        } else {
            return "#fff";
        }
    }
    dateToString(date: MarriageDate): string {
        return (new Date(date.year, date.month - 1)).toLocaleDateString(undefined, { month: "long", year: "numeric" });
    }
    inBucket(candidateDate: MarriageDate, curDate: MarriageDate): boolean {
        if (candidateDate.year !== curDate.year) {
            return false;
        }
        // month is 1-based
        const candidateMonthBucket = ONE_BASED_MONTH_TO_BUCKET[candidateDate.month];
        const curMonthBucket = ONE_BASED_MONTH_TO_BUCKET[curDate.month];
        return candidateMonthBucket === curMonthBucket;
    }
}

interface MarriageMapLegendProps {
    isCartogram: boolean,
}
class MarriageMapLegend extends Component<MarriageMapLegendProps, {}> {
    render() {
        // https://stackoverflow.com/questions/21293063/how-to-programmatically-enumerate-an-enum-type
        const marriageStatusNames = Object.keys(MarriageStatusEnum)
            .filter(k => typeof MarriageStatusEnum[k as any] === "number") as MarriageStatus[];
        const colorBoxes = marriageStatusNames.map((value, index) => {
            return <rect key={"colorBox" + index} y={(10 + 4) * (index)} height={10} width={10} fill={mapColors.get(value) as string} />;
        });
        let svgStyle: React.CSSProperties = { position: "absolute" };
        if (this.props.isCartogram) {
            svgStyle = { ...svgStyle, left: 670, top: 360 };
        }
        else {
            svgStyle = { ...svgStyle, left: 720, top: 380 };
        }
        return <svg style={svgStyle}>
            {colorBoxes}
            <image x={15} href="images/legend.png" width="189" height="109" />
            </svg>;
    }
}

export default App;
