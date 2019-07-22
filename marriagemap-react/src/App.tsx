import React, { Component } from 'react';
import { USStateMap, DateSlider, TickDateRange } from 'us-state-map';
//import { Button } from 'semantic-ui-react';
import 'rc-slider/assets/index.css';
import 'semantic-ui-css/semantic.min.css';
import './App.css';

interface AppState {
    curDate: TickDateRange,
    stateSelected: string | undefined,
    isCartogram: boolean,
}

const MAX_YEAR = new TickDateRange(2015, 5);
const MIN_YEAR = new TickDateRange(1990, 2);
class App extends Component<{}, AppState> {
    state: AppState = {
        curDate: MAX_YEAR,
        stateSelected: undefined,
        isCartogram: true,
    }

    onStateSelected(stateCode: string) {
        this.setState({ stateSelected: stateCode });
    }
    onStateCleared() {
        this.setState({ stateSelected: undefined });
    }

    onSliderDateChange(date: TickDateRange) {
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

    componentDidMount() {
        // TODO - load marriage data
    }
    render() {
        let monthText = ["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"][((this.state.curDate.endMonth + 1) / 3) - 1];
        return (
            <div style={{ width: 900, margin: "15px auto" }}>
                <USStateMap isCartogram={this.state.isCartogram}
                    stateColors={new Map<string, string>()}
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
            </div>
        );
    }
}

export default App;
