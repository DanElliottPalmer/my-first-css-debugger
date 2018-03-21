
import {debounce} from './utils';
import RendererPanel from './RendererPanel';
import DataPanel from './DataPanel';
import PreviewPanel from './PreviewPanel';
import StylePanel from './StylePanel';
import DifferencePanel from './DifferencePanel';
import TabbedPanel from './TabbedPanel';

const rPanel = new RendererPanel();
const dPanel = new DataPanel();
const tabbedBeforeStylePanel = new TabbedPanel(StylePanel);
const tabbedAfterStylePanel = new TabbedPanel(StylePanel);
const diffPanel = new DifferencePanel();
const beforePreview = new PreviewPanel();
const afterPreview = new PreviewPanel();

const domTools = document.getElementById('domTools');
const domRenderers = document.getElementById('domRenderers');

domTools.appendChild(rPanel.el);
domTools.appendChild(dPanel.el);
domTools.appendChild(tabbedBeforeStylePanel.el);
domTools.appendChild(tabbedAfterStylePanel.el);
domTools.appendChild(diffPanel.el);
domRenderers.appendChild(beforePreview.el);
domRenderers.appendChild(afterPreview.el);

rPanel.addListener('change', debounce(renderHtml, 300));
dPanel.addListener('change', debounce(renderHtml, 300));
tabbedBeforeStylePanel.addListener('change', debounce(renderHtml, 300));
tabbedAfterStylePanel.addListener('change', debounce(renderHtml, 300));
window.addEventListener('resize', debounce(() => {
    diffPanel.compare(beforePreview, afterPreview);
}, 300));
renderHtml();

function renderHtml(){
    let json = null;
    try {
        json = dPanel.json;
    } catch(err) {
        return;
    }
    rPanel.processInput(json);
    beforePreview.html = rPanel.html;
    beforePreview.styles = tabbedBeforeStylePanel.selectedPanel.text;
    afterPreview.html = rPanel.html;
    afterPreview.styles = tabbedAfterStylePanel.selectedPanel.text;

    diffPanel.compare(beforePreview, afterPreview);
}
