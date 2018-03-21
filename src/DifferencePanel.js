
import Panel from './Panel';

class DifferencePanel extends Panel {

    _createPanel(){
        const templateStr = `
            <div class="tools-panel tools-panel--column">
                <h3 class="tools-panel__title">Style difference</h3>
                <div class="tools-panel__difference"></div>
            </div>
        `;
        const el = document.createElement('div');
        el.innerHTML = templateStr.trim();
        return el.firstChild;
    }

    constructor(){
        super();
        this.name = 'DifferencePanel';
        this._difference = this.el.querySelector('.tools-panel__difference');

        this.readState();
    }

    compare(beforePreview, afterPreview){

        const beforeMap = new Map();
        const afterMap = new Map();
        const diffMap = new Map();

        const beforeNode = beforePreview.frame.contentWindow.document.body;
        const afterNode = afterPreview.frame.contentWindow.document.body;

        walkTree(beforeNode, beforeMap);
        walkTree(afterNode, afterMap);
        diffStyleMaps(beforeMap, afterMap, diffMap);

        this._difference.innerHTML = renderGroups(diffMap);

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

function copyComputedStyles(cssStyles){
    const m = new Map();
    let i = 0;
    const len = cssStyles.length;
    let propertyKey = null;

    for(;i < len; i++){
        propertyKey = cssStyles[i];
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

function walkTree(domNode, styleMap){
    const treewalker = document.createTreeWalker(
        domNode, window.NodeFilter.SHOW_ELEMENT);

    while(treewalker.nextNode()){
        let node = treewalker.currentNode;
        styleMap.set(
            getTagString(node),
            // Copy the styles as a way of freezing the
            // computed styles
            copyComputedStyles(window.getComputedStyle(node))
        );
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