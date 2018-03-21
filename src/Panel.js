
import EventEmitter from 'eventemitter3';

let PANEL_COUNTER = 0;

class Panel extends EventEmitter {

    _createPanel(){
        return document.createElement('div');
    }

    constructor(){
        super();
        this.counter = PANEL_COUNTER++;
        this.name = 'Panel';
        this.el = this._createPanel();
        this.statusBar = this.el.querySelector('.tools-panel__status');
        this.title = this.el.querySelector('.tools-panel__title');
    }

    setStatus(message){
        this.statusBar.innerHTML = message;
    }

    setTitle(title){
        this.title.innerHTML = title;
    }

    _saveState(){
        return {};
    }
    saveState(){
        const contents = this._saveState();
        localStorage.setItem(this.name, JSON.stringify(contents));
    }

    _readState(){}
    readState(){
        const contents = JSON.parse(localStorage.getItem(this.name));
        if(contents === null) return;
        this._readState(contents);
    }

}

export default Panel;
