
// Code:
// Mar - same-sex marriage allowed
// CU - same-sex civil unions allowed
// CULite - some same-sex rights
// None - none/unclear
// NoMar - no same-sex marriage by statute
// NoCU - no same-sex civil unions by statute
// NoMarConst - no same-sex marriage in constitution
// NoCUConst - no same-sex civil unions in constitution
// References:
// http://marriagelaw.cua.edu/law/states/AL.cfm
// http://www.domawatch.org/stateissues/alaska/index.html
// http://ballotpedia.org/wiki/index.php/Marriage-related_ballot_measures_and_initiatives
export type MarriageStatus = "Mar" | "CU" | "CULite" | "None" | "NoMar" | "NoCU" | "NoMarConst" | "NoCUConst";

export interface MarriageDate {
    year: number,
    month: number // 1-indexed
};

export interface PendingMarriageStatusInfo {
    clear: boolean,
    courtOverturnedBan: boolean,
    description: string | null
}

export interface StateMarriageStatusUpdate {
    date: MarriageDate,
    status: MarriageStatus,
    description: string,
    pendingInfo?: PendingMarriageStatusInfo
}

export type AllMarriageData = Map<string, Array<StateMarriageStatusUpdate>>;

export async function loadMarriageData(): Promise<AllMarriageData> {
    //TODO?
    let response = await fetch("data/marriagedata.js");
    let json = await response.json();
    return parseAllMarriageData(json); 
}
function parseAllMarriageData(json: any): AllMarriageData {
    let allMarriageData = new Map<string, Array<StateMarriageStatusUpdate>>();
    for (let stateCode of Object.keys(json)) {
        allMarriageData.set(stateCode, parseSingleStateData(json[stateCode]));
    }
    return allMarriageData;
}
function parseSingleStateData(json: any): Array<StateMarriageStatusUpdate> {
    let data : Array<StateMarriageStatusUpdate> = [];
    for (let i = 0; i < json.length; ++i) {
        data.push(parseStateMarriageStatusUpdate(json[i]));
    }
    return data;
}
function parseStateMarriageStatusUpdate(json: any): StateMarriageStatusUpdate {
    //TODO - parse pendingInfo
    return { date: parseMarriageDate(json[0]), status: json[1], description: json[2] };
}
function parseMarriageDate(s: string): MarriageDate {
    let parts = s.split('-');
    return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) };
}