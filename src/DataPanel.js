
import Panel from './Panel';

class DataPanel extends Panel {

    _bindListeners(){
        let textValue = null;

        this._textarea.addEventListener('keyup', () => {
            if(this.text !== textValue){
                textValue = this.text;
                this.emit('change', textValue);

                this.saveState();
            }
        });
    }

    _createPanel(){
        const templateStr = `
            <div class="tools-panel tools-panel--column">
                <h3 class="tools-panel__title">Data</h3>
                <textarea class="tools-panel__textarea">{}</textarea>
            </div>
        `;
        const el = document.createElement('div');
        el.innerHTML = templateStr.trim();
        return el.firstChild;
    }

    constructor(){
        super();
        this.name = 'DataPanel';
        this._textarea = this.el.querySelector('.tools-panel__textarea');

        this._bindListeners();
        this.readState();
    }

    get json(){
        return JSON.parse(this.text);
    }

    get text(){
        return this._textarea.value;
    }

    _saveState(){
        return {
            text: this.text
        };
    }

    _readState(contents){
        this._textarea.value = contents.text;
    }

}

export default DataPanel;