
import Panel from './Panel';

class PreviewPanel extends Panel {

    _bindListeners(){}

    _createPanel(){
        const templateStr = `
            <div class="tools-panel tools-panel--column">
                <h3 class="tools-panel__title">Before preview</h3>
                <iframe class="tools-panel__iframe" src="about:blank" frameborder="0" marginheight="0" marginwidth="0" scrolling="yes"></iframe>
            </div>
        `;
        const el = document.createElement('div');
        el.innerHTML = templateStr.trim();
        return el.firstChild;
    }

    constructor(){
        super();
        this.name = 'PreviewPanel';
        this._frame = this.el.querySelector('.tools-panel__iframe');
        this._html = '';
        this._styles = '';

        this._bindListeners();
    }

    get frame(){
        return this._frame;
    }

    get html(){
        return this._html;
    }
    set html(text){
        this._html = text;
        this.render();
    }

    get styles(){
        return this._styles;
    }
    set styles(text){
        this._styles = text;
        this.render();
    }

    render(){
        const doc = this._frame.contentWindow.document;

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title></title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>${this.styles}</style>
                </head>
                <body>
                    ${this.html}
                </body>
            </html>
        `;
        doc.open('text/html', 'replace');
        doc.write(html);
        doc.close();

        this.emit('render');
    }

}

export default PreviewPanel;