'use strict';

import Panel from './Panel';

class TabbedPanel extends Panel {

    _saveState(){
        return {
            panels: this.panels.map((group) => {
                return {
                    name: group.name,
                    panel: group.panel._saveState()
                }
            })
        };
    }
    _readState(contents){
        contents.panels.forEach((group) => {
            const pnl = new this._panelType();
            pnl._readState(group.panel);
            this.addPanel(group.name, pnl);
        });
    }

    _createPanel(){
        const templateStr = `
            <div class="tools-panel tools-panel--column">
                <ul class="tools-panel__tabs">
                    <li class="tools-panel__tab-button"><button>+</button></li>
                </ul>
                <div class="tools-panel__views"></div>
            </div>
        `;
        const el = document.createElement('div');
        el.innerHTML = templateStr.trim();
        return el.firstChild;
    }

    _addTab(name){
        const templateStr = `
            <li class="tools-panel__tab" contenteditable>${name} <button class="tools-panel__tab__btn">(close)</button></li>
        `;
        const el = document.createElement('ul');
        el.innerHTML = templateStr.trim();
        this._tabList.appendChild(el.firstChild);
    }

    _removeTab(index){
        // add 1 because first item is always the add new tab button
        const tab = this._tabList.children[index + 1];
        tab.parentNode.removeChild(tab);
    }

    _addView(pnl){
        const templateStr = `
            <div class="tools-panel__view is-hidden"></div>
        `;
        const el = document.createElement('div');
        el.innerHTML = templateStr.trim();
        el.firstChild.appendChild(pnl.el);
        this._tabViews.appendChild(el.firstChild);
    }

    _removeView(index){
        const tabView = this._tabViews.children[index];
        tabView.parentNode.removeChild(tabView);
    }

    _getTabIndex(tabEl){
        const items = Array.prototype.slice.apply(
            this._tabList.querySelectorAll('.tools-panel__tab'));
        return items.indexOf(tabEl);
    }

    _bindListeners(){
        const tabButton = this.el.querySelector(
            '.tools-panel__tab-button button');
        tabButton.addEventListener('click', (e) => {
            const pnl = new this._panelType();
            this.addPanel('Panel', pnl);
        });

        this._tabList.addEventListener('click', (e) => {
            if (e.target && e.target.matches(".tools-panel__tab")) {
                this.selectedIndex = this._getTabIndex(e.target);
            }
            if (e.target && e.target.matches(".tools-panel__tab__btn")) {
                const tabIndex = this._getTabIndex(e.target.parentNode);
                this.removePanel(tabIndex);
            }
        });
        this._tabList.addEventListener('input', (e) => {
            if (e.target && e.target.matches(".tools-panel__tab")) {
                const i = this._getTabIndex(e.target);
                this.panels[i].name = e.target.innerText;
                this.panels[i].panel.setTitle(e.target.innerText);
                this.saveState();
            }
        });
        this.addListener('change', () => this.saveState() );
    }

    _getTabViewByIndex(index){
        const tab = this._tabList.querySelectorAll(
            `.tools-panel__tab`)[index];
        const view = this._tabViews.querySelectorAll(
            `.tools-panel__view`)[index];
        return [tab, view];
    }

    get selectedIndex(){
        return this._selectedIndex;
    }
    set selectedIndex(index){
        if(index === this._selectedIndex ) return;

        if(this._selectedIndex > -1){
            let [tab, view] = this._getTabViewByIndex(this._selectedIndex);
            tab.classList.remove('is-active');
            view.classList.add('is-hidden');
        }

        if(index > -1){
            let [tab, view] = this._getTabViewByIndex(index);
            tab.classList.add('is-active');
            view.classList.remove('is-hidden');
        }

        const oldIndex = this._selectedIndex;
        this._selectedIndex = index;

        this.emit('change', this._selectedIndex, oldIndex);
    }

    get selectedPanel(){
        if(this.panels[this.selectedIndex]){
            return this.panels[this.selectedIndex].panel;
        }
        return undefined;
    }

    constructor(panelType){
        super();

        this.name = `TabbedPanel-${this.counter}`;
        this.panels = [];

        this._panelType = panelType;
        this._tabList = this.el.querySelector('.tools-panel__tabs');
        this._tabViews = this.el.querySelector('.tools-panel__views');
        this._selectedIndex = -1;

        this._bindListeners();
        this.readState();
    }

    addPanel(name, panel){
        panel.setTitle(name);
        this.panels.push({name, panel});
        this._addTab(name);
        this._addView(panel);
        this.selectedIndex = this.panels.length - 1;

        // Bubble up the change events
        panel.addListener('change', e => this.emit('change'));

        this.saveState();
    }

    removePanel(index){
        this.selectedIndex = -1;
        this._removeTab(index);
        this._removeView(index);

        this.panels.splice(index, 1);
        // TODO: remove listened on panel

        this.saveState();
    }

}

export default TabbedPanel;
