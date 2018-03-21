import mustache from 'mustache';
import Panel from './Panel';

class RendererPanel extends Panel {

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
                <h3 class="tools-panel__title">Mustache</h3>
                <textarea class="tools-panel__textarea"></textarea>
                <div class="tools-panel__status">Status</div>
            </div>
        `;
        const el = document.createElement('div');
        el.innerHTML = templateStr.trim();
        return el.firstChild;
    }

    constructor(){
        super();
        this.name = 'RendererPanel';
        this._textarea = this.el.querySelector('.tools-panel__textarea');
        this._html = null;

        this._bindListeners();
        this.readState();
    }

    get html(){
        return this._html;
    }

    get text(){
        return this._textarea.value;
    }

    processInput(data={}){
        this.setStatus('Rendering markup...');
        const html = mustache.render(this.text, data);
        this._html = html;
        this.setStatus('Finished rendering!');
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

export default RendererPanel;