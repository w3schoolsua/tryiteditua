(function () {
    const editorInput = document.getElementById('editorInput');
    const editorHighlight = document.getElementById('editorHighlight');
    const resultFrame = document.getElementById('resultFrame');
    const runButton = document.getElementById('runButton');
    const resetButton = document.getElementById('resetButton');
    const copyButton = document.getElementById('copyButton');
    const tabs = document.querySelectorAll('.tab');
    const divider = document.getElementById('dragDivider');

    if (!editorInput || !editorHighlight || !resultFrame) return;

    const STORAGE_KEYS = {
        html: 'tryit-code-html',
        css: 'tryit-code-css',
        js: 'tryit-code-js'
    };

    const defaultSnippets = {
        html: [
            '<!DOCTYPE html>',
            '<html lang="uk">',
            '<head>',
            '  <meta charset="UTF-8">',
            '  <title>Приклад</title>',
            '</head>',
            '<body>',
            '  <h1>Привіт, світ!</h1>',
            '</body>',
            '</html>'
        ].join('\n'),
        css: [
            'body {',
            '  font-family: system-ui, sans-serif;',
            '  background: #f3f4f6;',
            '  color: #111827;',
            '}',
            '',
            'h1 {',
            '  color: #16a34a;',
            '}'
        ].join('\n'),
        js: [
            'document.body.style.fontFamily = "system-ui, sans-serif";',
            'const h1 = document.createElement("h1");',
            'h1.textContent = "JavaScript працює!";',
            'document.body.appendChild(h1);'
        ].join('\n')
    };

    let currentLang = 'html';
    let autoRunTimer = null;

    function loadCode(lang) {
        return localStorage.getItem(STORAGE_KEYS[lang]) || defaultSnippets[lang];
    }

    function saveCode(lang, code) {
        localStorage.setItem(STORAGE_KEYS[lang], code);
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function highlightHTML(code) {
        let html = escapeHtml(code);

        html = html.replace(/(&lt;!--[\s\S]*?--&gt;)/g,
            '<span class="token-comment">$1</span>'
        );

        html = html.replace(
            /(&lt;\/?)([a-zA-Z0-9\-]+)([^&]*?)(\/?&gt;)/g,
            (match, open, tag, attrs, close) => {
                let result =
                    '<span class="token-punctuation">' + open + '</span>' +
                    '<span class="token-tag">' + tag + '</span>';

                if (attrs && attrs.trim().length > 0) {
                    result += attrs.replace(
                        /([a-zA-Z\-:]+)(\s*=\s*)(".*?"|'.*?'|[^\s"'>]+)/g,
                        (m, name, eq, value) =>
                            ' <span class="token-attr-name">' + name + '</span>' +
                            '<span class="token-operator">' + eq + '</span>' +
                            '<span class="token-attr-value">' + value + '</span>'
                    );
                }

                result += '<span class="token-punctuation">' + close + '</span>';
                return result;
            }
        );

        return html;
    }

    function highlightCSS(code) {
        let html = escapeHtml(code);

        html = html.replace(/(\/\*[\s\S]*?\*\/)/g,
            '<span class="token-comment">$1</span>'
        );

        html = html.replace(
            /([a-zA-Z\-]+)(\s*:\s*)([^;]+)(;?)/g,
            (m, prop, colon, value, semi) =>
                '<span class="token-attr-name">' + prop + '</span>' +
                '<span class="token-operator">' + colon + '</span>' +
                '<span class="token-attr-value">' + value + '</span>' +
                '<span class="token-punctuation">' + semi + '</span>'
        );

        return html;
    }

    function highlightJS(code) {
        let html = escapeHtml(code);

        html = html.replace(/(\/\/.*$)/gm,
            '<span class="token-comment">$1</span>'
        );

        html = html.replace(/(\/\*[\s\S]*?\*\/)/g,
            '<span class="token-comment">$1</span>'
        );

        html = html.replace(/(".*?"|'.*?'|`.*?`)/g,
            '<span class="token-string">$1</span>'
        );

        html = html.replace(/\b(\d+(\.\d+)?)\b/g,
            '<span class="token-number">$1</span>'
        );

        html = html.replace(
            /\b(const|let|var|function|return|if|else|for|while|break|continue|new|class|extends|super|this|import|from|export|default)\b/g,
            '<span class="token-keyword">$1</span>'
        );

        html = html.replace(/([=+\-*/<>!]=?|&&|\|\|)/g,
            '<span class="token-operator">$1</span>'
        );

        return html;
    }

    function updateHighlight() {
        const code = editorInput.value;
        let highlighted = '';

        if (currentLang === 'html') highlighted = highlightHTML(code);
        else if (currentLang === 'css') highlighted = highlightCSS(code);
        else if (currentLang === 'js') highlighted = highlightJS(code);
        else highlighted = escapeHtml(code);

        editorHighlight.innerHTML =
            highlighted + (code.endsWith('\n') ? '\n' : '');
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
        doc.write(
            '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
            '<style>' + css + '</style>' +
            '</head><body>' +
            html +
            '<script>' + js + '<\/script>' +
            '</body></html>'
        );
        doc.close();
    }

    function setTab(lang) {
        currentLang = lang;

        tabs.forEach(t =>
            t.classList.toggle('active', t.dataset.lang === lang)
        );

        editorInput.value = loadCode(lang);
        updateHighlight();
        syncScroll();
        runCode();
    }

    // Події вводу
    editorInput.addEventListener('input', () => {
        const code = editorInput.value;
        saveCode(currentLang, code);
        updateHighlight();

        clearTimeout(autoRunTimer);
        autoRunTimer = setTimeout(runCode, 400);
    });

    editorInput.addEventListener('scroll', syncScroll);

    // Вкладки
    tabs.forEach(tab =>
        tab.addEventListener('click', () => setTab(tab.dataset.lang))
    );

    // Кнопка "Запустити"
    if (runButton) {
        runButton.addEventListener('click', runCode);
    }

    // Кнопка "Скинути код"
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            const def = defaultSnippets[currentLang];
            editorInput.value = def;
            saveCode(currentLang, def);
            updateHighlight();
            syncScroll();
            runCode();
        });
    }

    // Кнопка "Копіювати код"
    if (copyButton) {
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(editorInput.value).then(() => {
                const prev = copyButton.textContent;
                copyButton.textContent = '✔️';
                setTimeout(() => {
                    copyButton.textContent = prev;
                }, 800);
            });
        });
    }

    // Drag‑resize
    if (divider) {
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
                const percent = Math.min(80, Math.max(20, (left / total) * 100));
                document.querySelector('.editor-panel').style.flex = `0 0 ${percent}%`;
            } else if (document.body.classList.contains('layout-vertical')) {
                const total = window.innerHeight;
                const top = e.clientY;
                const percent = Math.min(80, Math.max(20, (top / total) * 100));
                document.querySelector('.editor-panel').style.flex = `0 0 ${percent}%`;
            }
        });
    }

    // Старт
    setTab('html');
})();