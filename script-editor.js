(function () {
    const editorInput = document.getElementById('editorInput');
    const editorHighlight = document.getElementById('editorHighlight');
    const resultFrame = document.getElementById('resultFrame');
    const runButton = document.getElementById('runButton');
    const tabs = document.querySelectorAll('.tab');

    if (!editorInput || !editorHighlight || !resultFrame) return;

    const STORAGE_KEYS = {
        html: 'tryit-code-html',
        css: 'tryit-code-css',
        js: 'tryit-code-js'
    };

    const defaultSnippets = {
        html: "<h1>Привіт, світ!</h1>",
        css: "h1 { color: red; }",
        js: "console.log('JS працює');"
    };

    let currentLang = 'html';
    let autoRunTimer = null;

    function loadCode(lang) {
        return localStorage.getItem(STORAGE_KEYS[lang]) || defaultSnippets[lang];
    }

    function saveCode(lang, code) {
        localStorage.setItem(STORAGE_KEYS[lang], code);
    }

    function setTab(lang) {
        currentLang = lang;

        tabs.forEach(t =>
            t.classList.toggle('active', t.dataset.lang === lang)
        );

        editorInput.value = loadCode(lang);
        updateHighlight();
        runCode();
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function highlightHTML(code) {
        let html = escapeHtml(code);
        html = html.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="token-comment">$1</span>');
        html = html.replace(/(&lt;\/?)([a-zA-Z0-9\-]+)([^&]*?)(\/?&gt;)/g,
            (m, open, tag, attrs, close) => {
                let out = `<span class="token-punctuation">${open}</span>`;
                out += `<span class="token-tag">${tag}</span>`;
                if (attrs.trim()) {
                    out += attrs.replace(/([a-zA-Z\-:]+)(=)("[^"]*"|'[^']*')/g,
                        (m, name, eq, val) =>
                            ` <span class="token-attr-name">${name}</span>` +
                            `<span class="token-operator">${eq}</span>` +
                            `<span class="token-attr-value">${val}</span>`
                    );
                }
                out += `<span class="token-punctuation">${close}</span>`;
                return out;
            }
        );
        return html;
    }

    function highlightCSS(code) {
        let html = escapeHtml(code);
        html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token-comment">$1</span>');
        html = html.replace(/([a-zA-Z\-]+)(:)([^;]+)(;?)/g,
            (m, prop, colon, val, semi) =>
                `<span class="token-attr-name">${prop}</span>` +
                `<span class="token-operator">${colon}</span>` +
                `<span class="token-attr-value">${val}</span>` +
                `<span class="token-punctuation">${semi}</span>`
        );
        return html;
    }

    function highlightJS(code) {
        let html = escapeHtml(code);
        html = html.replace(/(\/\/.*$)/gm, '<span class="token-comment">$1</span>');
        html = html.replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="token-string">$1</span>');
        html = html.replace(/\b(\d+)\b/g, '<span class="token-number">$1</span>');
        html = html.replace(/\b(const|let|var|function|return|if|else|for|while|class|new|this)\b/g,
            '<span class="token-keyword">$1</span>');
        return html;
    }

    function updateHighlight() {
        const code = editorInput.value;
        let highlighted = '';

        if (currentLang === 'html') highlighted = highlightHTML(code);
        if (currentLang === 'css') highlighted = highlightCSS(code);
        if (currentLang === 'js') highlighted = highlightJS(code);

        editorHighlight.innerHTML = highlighted + (code.endsWith('\n') ? '\n' : '');
    }

    function syncScroll() {
        editorHighlight.scrollTop = editorInput.scrollTop;
        editorHighlight.scrollLeft = editorInput.scrollLeft;
    }

    function runCode() {
        const doc = resultFrame.contentDocument;
        const html = loadCode('html');
        const css = loadCode('css');
        const js = loadCode('js');

        doc.open();
        doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        ${html}
        <script>${js}<\/script>
      </body>
      </html>
    `);
        doc.close();
    }

    editorInput.addEventListener('input', () => {
        const code = editorInput.value;
        saveCode(currentLang, code);
        updateHighlight();

        clearTimeout(autoRunTimer);
        autoRunTimer = setTimeout(runCode, 300);
    });

    editorInput.addEventListener('scroll', syncScroll);

    tabs.forEach(tab =>
        tab.addEventListener('click', () => setTab(tab.dataset.lang))
    );

    runButton.addEventListener('click', runCode);

    setTab('html');
})();

/* Кнопка Копіювати код */
const copyButton = document.getElementById('copyButton');

copyButton.addEventListener('click', () => {
    navigator.clipboard.writeText(editorInput.value);
    copyButton.textContent = "✔️";
    setTimeout(() => copyButton.textContent = "📋", 800);
});

/* Кнопка Скинути код */
const resetButton = document.getElementById('resetButton');

resetButton.addEventListener('click', () => {
    editorInput.value = defaultSnippets[currentLang];
    saveCode(currentLang, editorInput.value);
    updateHighlight();
    runCode();
});

/* Drag‑resize панелей */
const divider = document.getElementById('dragDivider');
let isDragging = false;

divider.addEventListener('mousedown', () => {
    isDragging = true;
    document.body.style.userSelect = 'none';
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.userSelect = '';
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    if (document.body.classList.contains('layout-horizontal')) {
        const total = window.innerWidth;
        const left = e.clientX;
        const percent = (left / total) * 100;
        document.querySelector('.editor-panel').style.flex = `0 0 ${percent}%`;
    }

    if (document.body.classList.contains('layout-vertical')) {
        const total = window.innerHeight;
        const top = e.clientY;
        const percent = (top / total) * 100;
        document.querySelector('.editor-panel').style.flex = `0 0 ${percent}%`;
    }
});