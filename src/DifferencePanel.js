
import {debounce} from './utils';
import Panel from './Panel';

class DifferencePanel extends Panel {

    _createPanel(){
        const templateStr = `
            <div class="tools-panel tools-panel--column">
                <h3 class="tools-panel__title">Style difference</h3>
                <div class="tools-panel__settings">
                    <label class="tools-panel__setting">Ignore keys: <input type="text" class="js-txtIgnore" /></label>
                    <label class="tools-panel__setting">Hide :before <input type="checkbox" class="js-chkBefore" /></label>
                    <label class="tools-panel__setting">Hide :after <input type="checkbox" class="js-chkAfter" /></label>
                </div>
                <div class="tools-panel__difference"></div>
            </div>
        `;
        const el = document.createElement('div');
        el.innerHTML = templateStr.trim();
        return el.firstChild;
    }

    _processIgnoreKeys(value){
        this._ignoreKeys = new Set(value.split(', ').map(a => a.trim()));
    }

    _bindListeners(){
        this._ignore.addEventListener('input', debounce((e) => {
            this._processIgnoreKeys(e.target.value);
            this.saveState();

            if(this._lastCompared[0] !== null && this._lastCompared[1] !== null){
                this.compare(this._lastCompared[0], this._lastCompared[1]);
            }
        }, 300));

        this._chkBefore.addEventListener('change', (e) => {
            this.saveState();
            if(this._lastCompared[0] !== null && this._lastCompared[1] !== null){
                this.compare(this._lastCompared[0], this._lastCompared[1]);
            }
        });
        this._chkAfter.addEventListener('change', (e) => {
            this.saveState();
            if(this._lastCompared[0] !== null && this._lastCompared[1] !== null){
                this.compare(this._lastCompared[0], this._lastCompared[1]);
            }
        });
    }

    _saveState(){
        return {
            ignoreKeys: this._ignore.value,
            ignoreBefore: this._chkBefore.checked,
            ignoreAfter: this._chkAfter.checked
        };
    }

    _readState(contents){
        this._ignore.value = contents.ignoreKeys;
        this._chkBefore.checked = contents.ignoreBefore;
        this._chkAfter.checked = contents.ignoreAfter;
        this._processIgnoreKeys(contents.ignoreKeys);
    }

    constructor(){
        super();
        this.name = 'DifferencePanel';
        this._difference = this.el.querySelector('.tools-panel__difference');
        this._ignore = this.el.querySelector('.js-txtIgnore');
        this._chkBefore = this.el.querySelector('.js-chkBefore');
        this._chkAfter = this.el.querySelector('.js-chkAfter');

        this._ignoreKeys = new Set();
        this._lastCompared = [null, null];

        this._bindListeners();
        this.readState();
    }

    compare(beforePreview, afterPreview){

        const beforeMap = new Map();
        const afterMap = new Map();
        const diffMap = new Map();

        const beforeNode = beforePreview.frame.contentWindow.document.body;
        const afterNode = afterPreview.frame.contentWindow.document.body;

        walkTree(
            beforeNode, beforeMap, this._ignoreKeys, this._chkBefore.checked,
            this._chkAfter.checked);
        walkTree(
            afterNode, afterMap, this._ignoreKeys, this._chkBefore.checked,
            this._chkAfter.checked);
        diffStyleMaps(beforeMap, afterMap, diffMap);

        this._difference.innerHTML = renderGroups(diffMap);
        this._lastCompared[0] = beforePreview;
        this._lastCompared[1] = afterPreview;

    }

}



function diffStyles(before, after){
    const diff = {};

    for(let key of before.keys()){
        if(before.get(key) !== after.get(key)){
            diff[key] = [
                before.get(key),
                after.get(key)
            ];
        }
    }

    return diff;
}


function diffStyleMaps(beforeMap, afterMap, diffMap){
    let diff = null;
    for(let mapKey of beforeMap.keys()){
        diff = diffStyles(
            beforeMap.get(mapKey), afterMap.get(mapKey));
        if(Object.keys(diff).length > 0){
            diffMap.set(mapKey, diff);
        }
    }
}

function copyComputedStyles(cssStyles, ignoreKeys){
    const m = new Map();
    let i = 0;
    const len = cssStyles.length;
    let propertyKey = null;

    for(;i < len; i++){
        propertyKey = cssStyles[i];
        if(ignoreKeys.has(propertyKey)) continue;
        m.set(
            propertyKey,
            cssStyles.getPropertyValue(propertyKey)
        );
    }
    return m;
}

function getTagString(node){
    let cls = '';
    if(node.classList.length > 0){
        cls = `.${node.classList.toString().trim().split(' ').join('.')}`;
    }

    let id = '';
    if(node.hasAttribute('id')){
        id = `#${node.id}`;
    }

    return `${node.tagName.toLowerCase()}${id}${cls}`;
}


function walkTree(domNode, styleMap, ignoreKeys, ignoreBefore=false,
                  ignoreAfter=false){
    const treewalker = document.createTreeWalker(
        domNode, window.NodeFilter.SHOW_ELEMENT);

    while(treewalker.nextNode()){
        let node = treewalker.currentNode;
        if(node.nodeType !== 1) continue;

        styleMap.set(
            getTagString(node),
            // Copy the styles as a way of freezing the
            // computed styles
            copyComputedStyles(window.getComputedStyle(node), ignoreKeys)
        );

        if(!ignoreBefore){
            // :before
            styleMap.set(
                `${getTagString(node)}:before`,
                copyComputedStyles(window.getComputedStyle(node, ':before'), ignoreKeys)
            );
        }

        if(!ignoreAfter){
            // :after
            styleMap.set(
                `${getTagString(node)}:after`,
                copyComputedStyles(window.getComputedStyle(node, ':after'), ignoreKeys)
            );
        }

    }
}

function renderGroup(diffKey, diffValues){
    var tableRows = '';
    for(let [cssName, cssChanges] of Object.entries(diffValues)){
        tableRows = `
            ${tableRows}
            <tr>
                <td>${cssName}</td>
                <td class="diff-group__before">${cssChanges[0]}</td>
                <td class="diff-group__after">${cssChanges[1]}</td>
            </tr>
        `;
    }

    return `
    <div class="diff-group">
        <h4 class="diff-group__title">${diffKey}</h4>
        <table class="diff-group__table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Before</th>
                    <th>After</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    </div>
    `;
}

function renderGroups(diffMap){
    let groupHTML = '';
    for(let [key, value] of diffMap.entries()){
        groupHTML = `${groupHTML}\n${renderGroup(key, value)}`;
    }
    return groupHTML;
}





export default DifferencePanel;