import React, { Component } from 'react';
import { USStateMap, DateSlider, TickDateRange } from 'us-state-map';
import { loadMarriageData, MarriageDate, AllMarriageData, PendingMarriageStatusInfo, StateMarriageStatusUpdate, MarriageStatus } from './DataHandling';
//import { Button } from 'semantic-ui-react';
import 'rc-slider/assets/index.css';
import 'semantic-ui-css/semantic.min.css';
import './App.css';
import { JSXElement } from '@babel/types';

interface AppState {
    marriageData: AllMarriageData,
    curDate: TickDateRange,
    stateSelected: string | undefined,
    isCartogram: boolean,
}

const MAX_YEAR = new TickDateRange(2015, 5);
const MIN_YEAR = new TickDateRange(1990, 2);


let mapDescriptions = new Map<MarriageStatus, string>(Object.entries({
    "Mar": "Marriage is legal",
    "CU": "Civil unions are legal",
    "CULite": "Civil unions that have some rights included in marriage are legal",
    "None": "No applicable law or unclear",
    "NoMar": "Marriage forbidden by statute",
    "NoCU": "Marriage or civil unions forbidden by statute",
    "NoMarConst": "Marriage forbidden by state constitution",
    "NoCUConst": "Marriage or civil unions forbidden by state constitution"
}) as Array<[MarriageStatus, string]>);
let mapColors = new Map<MarriageStatus, string>(Object.entries({
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
class App extends Component<{}, AppState> {
    state: AppState = {
        marriageData: new Map<string, Array<StateMarriageStatusUpdate>>(),
        curDate: MAX_YEAR,
        stateSelected: undefined,
        isCartogram: true,
    }

    onStateSelected(stateCode: string) {
        //TODO
        this.setState({ stateSelected: stateCode });
    }
    onStateCleared() {
        //TODO
        this.setState({ stateSelected: undefined });
    }

    onSliderDateChange(date: TickDateRange) {
        // TODO - clear state?
        this.setState({ curDate: date });
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
        // TODO - load marriage data
        let marriageData = await loadMarriageData();
        this.setState({ marriageData: marriageData });
    }
    render() {
        const monthText = ["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"][((this.state.curDate.endMonth + 1) / 3) - 1];
        //TODO - calculate this better
        const stateColors = new Map<string, string>();
        for (const [stateCode, allStateData] of this.state.marriageData) {
            //TODO - what to do for first one?
            let status: MarriageStatus = "None";
            for (let curUpdate of allStateData) {
                if (this.dateIsGreater(curUpdate.date, this.state.curDate)) {
                    break;
                }
                status = curUpdate.status;
            }
            stateColors.set(stateCode, mapColors.get(status) as string);
        }
        //TODO
                //<img src="images/legend.png" style={{ position: "absolute", left: 1000, top: 400 }} />
                //<div style={{ top: -189 }}>Date: {monthText} {this.state.curDate.endYear}</div>
                //<div>Date: {monthText} {this.state.curDate.endYear}</div>
        return (
            <div style={{ width: 900, margin: "15px auto" }}>
                <USStateMap isCartogram={this.state.isCartogram}
                    stateColors={stateColors}
                    stateTitles={new Map<string, string>()}
                    stateSelectedCallback={stateCode => this.onStateSelected(stateCode)}
                    stateClearedCallback={() => this.onStateCleared()}
                    width={900}
                    height={500}
                    onError={error => this.onMapError(error)} />
                <div>Date: {monthText} {this.state.curDate.endYear}</div>
                <DateSlider
                    ticksPerYear={4}
                    startTickDateRange={MIN_YEAR}
                    endTickDateRange={MAX_YEAR}
                    currentTickDateRange={this.state.curDate}
                    onTickDateRangeChange={date => this.onSliderDateChange(date)}
                />
                <StateDescriptions
                    stateSelected={this.state.stateSelected}
                    curDate={this.state.curDate}
                    marriageData={this.state.marriageData}
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
}

interface StateDescriptionsProps {
    stateSelected: string | undefined,
    marriageData: AllMarriageData,
    curDate: TickDateRange,
}

class StateDescriptions extends Component<StateDescriptionsProps, {}> {
    render() {
        if (this.props.stateSelected) {
            const updates = this.props.marriageData.get(this.props.stateSelected) as StateMarriageStatusUpdate[];
            const entryArray = updates.map((update, index) => {
                // TODO add link to set current date
                // TODO - refactor the date to string
                let description = "<a href=\"#\">" + new Date(update.date.year, update.date.month - 1).toLocaleDateString(undefined, { month: "long", year: "numeric" }) + "</a>";
                // TODO - use black or white for text
                description += ": <span style=\"background-color: " + mapColors.get(update.status) + "\">" + mapDescriptions.get(update.status) + "</span> - " + update.description;
                return <li key={index} dangerouslySetInnerHTML={{ __html: description }}></li>
            });
            return <ul>{entryArray}</ul>;
        }
        else {
            // TODO
            return <div />;
        }
    }
}

export default App;