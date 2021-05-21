/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */

let nComparators = ['LT', 'EQ', 'GT'];
let coursesKeys = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"];
let roomsKeys = ["lat", "lon", "seats", "fullname", "shortname", "number", "name", "address", "type", "furniture", "href"]
let panelPageKeys = [];

CampusExplorer.buildQuery = () => {
    let query = {};
    const activePanel = document.getElementsByClassName('tab-panel active')[0];
    const tabKind = activePanel.getAttribute("data-type"); // plain/course/room
    // getKeysThePanelUsed
    getKeysThePanelUsed(tabKind);

    let where = getWhereCondition(activePanel, tabKind);
    query['WHERE'] = where;
    // Trans: I like to get this part of info first before Options field since Options field base on this part
    let group = getGroup(activePanel, tabKind);
    let apply = getApply(activePanel, tabKind);
    // Options: put at the end
    let columns = getColumn(activePanel, tabKind);
    let order = getOrder(activePanel, tabKind);

    if (order) {
        query['OPTIONS'] = {COLUMNS: columns, ORDER: order};
    } else if (!order) {
        query['OPTIONS'] = {COLUMNS: columns};
    }

    if (group.length === 0 || apply.length === 0) {
        return query;
    } else {
        query['TRANSFORMATIONS'] = {GROUP: group, APPLY: apply};
    }

    return query; // query order doesn't matter
};

function getWhereCondition(activePanel, dsID) {
    let WHERE = {}; // Where:
    // Condition part:
    // Part 1: get the checked control - AND/OR/NOT
    const conditionsPanel = activePanel.getElementsByClassName('form-group conditions')[0].children; // Under UI Condition Filed
    const checkBoxes = conditionsPanel[1].children;
    let checkedControl = getCheckedValue(checkBoxes);

    //Part 2: conditions group (container) - that uses EQ/GT/LT/IS/AND/OR/NOT
    const container = conditionsPanel[2].children;
    let filterArray = []; // when Not/AND/OR
    for (let i = 0; i< container.length; i++) {
        let filter = {}; // FILTER ::= LOGICCOMPARISON | MCOMPARISON | SCOMPARISON | NEGATION
        let cond = {}; // ex. {' mkey ':' number '}'; {' skey ':' [*]? inputstring [*]? '}

        const isNot = container[i].getElementsByClassName('control not')[0].getElementsByTagName('input')[0].checked;
        const fields = container[i].getElementsByClassName('control fields')[0].getElementsByTagName('option');
        let selectedField = dsID + '_' + getSelectedValue(fields);
        const operators = container[i].getElementsByClassName('control operators')[0].getElementsByTagName('option');
        let selectedOperators = getSelectedValue(operators);
        // filter info
        let term = container[i].getElementsByClassName('control term')[0].getElementsByTagName("input")[0].getAttribute('value');
        if (nComparators.indexOf(selectedOperators) !== -1 && term) { // empty input will has error
            term = Number(term);
        }
        // fill in filter info
        cond[selectedField] = term;
        filter[selectedOperators] = cond;
        if (isNot) {
            filterArray.push({NOT: filter});
        }
        else {
            filterArray.push(filter);
        }
    }

    // fill in where info
    let filterArrayLen = filterArray.length;
    if (filterArrayLen === 1) {
        if(checkedControl === 'none') {
            WHERE['NOT'] = filterArray[0]; // we want object, not array
        }
        else {
            WHERE = filterArray[0]; // we want object, not array
        }
    }
    else if (filterArrayLen > 1) {
        if (checkedControl === 'none') {
            WHERE['NOT'] = {OR: filterArray};
        }
        else if (checkedControl === 'all') {
            WHERE['AND'] = filterArray;
        }
        else if (checkedControl === 'any') {
            WHERE['OR'] = filterArray;
        }
    }
    return WHERE;
}

function getColumn(activePanel, dsID) {
    let COLUMNS = [];
    const columnPanel = activePanel.getElementsByClassName('form-group columns')[0].children;
    const columns = columnPanel[1].children;
    COLUMNS = getCheckedValues_Multiple(columns, dsID);
    return COLUMNS;
}

function getOrder(activePanel, dsID) {
    let ORDER = {};
    const orderPanel = activePanel.getElementsByClassName('form-group order')[0].children;
    const orderByList = orderPanel[1].getElementsByClassName('control order fields')[0].getElementsByTagName('option');
    let orderBy = getSelectedValue_Multiple(orderByList, dsID);
    const orderDir = orderPanel[1].getElementsByClassName('control descending')[0];
    const isDescending = orderDir.getElementsByTagName('input')[0].checked;

    if (isDescending) {
        ORDER['dir'] = 'DOWN';
        ORDER['keys'] = orderBy;
    } else if (orderBy.length>1) {
        ORDER['dir'] = 'UP';
        ORDER['keys'] = orderBy;
    } else if (orderBy.length === 1) {
        return orderBy[0];
    } else if (orderBy.length === 0) {
        return null;
    }
    return ORDER;
}

function getApply(activePanel, dsID) { // trans 可有可无
    let APPLY = [];
    const applyPanel = activePanel.getElementsByClassName('form-group transformations')[0].children;
    const applyGroups = applyPanel[1].children;
    for (const a of applyGroups) {
        let apply = {};
        let applyRule = {};
        let term = a.getElementsByClassName('control term')[0].getElementsByTagName("input")[0].getAttribute('value');
        const operators = a.getElementsByClassName('control operators')[0].getElementsByTagName('option');
        let operator = getSelectedValue(operators);
        const fields = a.getElementsByClassName('control fields')[0].getElementsByTagName('option');
        let field = dsID + '_' + getSelectedValue(fields);
        applyRule[operator] = field;
        apply[term] = applyRule;
        APPLY.push(apply);
    }
    return APPLY;
}

function getGroup(activePanel, dsID) {
    let GROUP = [];
    const groupsPanel = activePanel.getElementsByClassName('form-group groups')[0].children;
    const groups = groupsPanel[1].children;
    GROUP = getCheckedValues_Multiple(groups, dsID);

    return GROUP;
}


// helper functions
function getCheckedValue(checkBoxes) {
    let checkedControl;
    for (let i = 0; i < checkBoxes.length; i++) {
        const eachControlStatus = checkBoxes[i].getElementsByTagName('input')[0];
        if (eachControlStatus.checked) {
            checkedControl = eachControlStatus.getAttribute('value');
            break;
        }
    }
    return checkedControl;
}

function getCheckedValues_Multiple(checkBoxes, dsID) {
    let checkedControl = [];
    for (let i = 0; i < checkBoxes.length; i++) {
        const eachControlStatus = checkBoxes[i].getElementsByTagName('input')[0];
        if (eachControlStatus.checked) {
            let key = eachControlStatus.getAttribute('value');
            if (panelPageKeys.indexOf(key) !== -1) {
                checkedControl.push(dsID + '_' + key);
            } else {
                checkedControl.push(key);
            }
        }
    }
    return checkedControl;
}

function getSelectedValue(fields) {
    let selected;
    for (const field of fields) {
        if (field.selected) {
            selected = field.getAttribute("value");
            break;
        }
    }
    return selected;
}

function getSelectedValue_Multiple(fields, dsID) {
    let selected = [];
    for (const field of fields) {
        if (field.selected) {
            let key = field.getAttribute("value");
            if (panelPageKeys.indexOf(key) !== -1) {
                selected.push(dsID + '_' + key);
            } else {
                selected.push(key);
            }
        }
    }
    return selected;
}

function getKeysThePanelUsed(tabKind) {
    if (tabKind === 'courses') {
        panelPageKeys = coursesKeys;
    } else if (tabKind === 'rooms') {
        panelPageKeys = roomsKeys;
    }
}

