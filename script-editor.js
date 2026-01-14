(function () {
    const editorInput = document.getElementById('editorInput');
    const editorHighlight = document.getElementById('editorHighlight');
    const lineNumbers = document.getElementById('lineNumbers');
    const resultFrame = document.getElementById('resultFrame');
    const runButton = document.getElementById('runButton');
    const resetButton = document.getElementById('resetButton');
    const copyButton = document.getElementById('copyButton');
    const formatButton = document.getElementById('formatButton');
    const tabs = document.querySelectorAll('.tab');
    const divider = document.getElementById('dragDivider');
    const autocompleteBox = document.getElementById('autocomplete');

    if (!editorInput || !editorHighlight || !lineNumbers || !resultFrame) return;

    const STORAGE_KEYS = {
        html: 'tryit-code-html',
        css: 'tryit-code-css',
        js: 'tryit-code-js'
    };

    const AUTOCOMPLETE_DATA = {
        html: [
            { key: "div", snippet: "<div>|</div>" },
            { key: "span", snippet: "<span>|</span>" },
            { key: "p", snippet: "<p>|</p>" },
            { key: "h1", snippet: "<h1>|</h1>" },
            { key: "h2", snippet: "<h2>|</h2>" },
            { key: "ul", snippet: "<ul>\n  <li>|</li>\n</ul>" },
            { key: "li", snippet: "<li>|</li>" },
            { key: "button", snippet: "<button>|</button>" },
            { key: "input", snippet: "<input>|" }
        ],

        css: [
            { key: "display", snippet: "display: ;" },
            { key: "margin", snippet: "margin: ;" },
            { key: "padding", snippet: "padding: ;" },
            { key: "color", snippet: "color: ;" },
            { key: "background", snippet: "background: ;" }
        ],

        js: [
            { key: "function", snippet: "function name() {\n  \n}" },
            { key: "for", snippet: "for (let i = 0; i < ; i++) {\n  \n}" },
            { key: "if", snippet: "if () {\n  \n}" },
            { key: "log", snippet: "console.log();" }
        ]
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

    // -------------------------
    // BEAUTIFIER — форматування
    // -------------------------

    function beautifyHTML(code) {
        let formatted = '';
        let indent = 0;
        const tab = '  ';

        code = code.replace(/>\s+</g, '><');

        code.split(/(?=<)/g).forEach(line => {
            if (line.match(/^<\/\w/)) indent--;
            formatted += tab.repeat(indent) + line.trim() + '\n';
            if (line.match(/^<\w[^>]*[^\/]>$/)) indent++;
        });

        return formatted.trim();
    }

    function beautifyCSS(code) {
        let formatted = '';
        let indent = 0;
        const tab = '  ';

        code.split('\n').forEach(line => {
            line = line.trim();
            if (line.endsWith('}')) indent--;
            formatted += tab.repeat(indent) + line + '\n';
            if (line.endsWith('{')) indent++;
        });

        return formatted.trim();
    }

    function beautifyJS(code) {
        return code
            .replace(/;\s*/g, ';\n')
            .replace(/{\s*/g, '{\n')
            .replace(/}\s*/g, '}\n')
            .replace(/\n{2,}/g, '\n')
            .trim();
    }

    // -------------------------
    // Допоміжні функції
    // -------------------------

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

    // -------------------------
    // Підсвітка + нумерація
    // -------------------------

    function updateHighlight() {
        const code = editorInput.value;

        let highlighted = '';

        if (currentLang === 'html') highlighted = highlightHTML(code);
        else if (currentLang === 'css') highlighted = highlightCSS(code);
        else if (currentLang === 'js') highlighted = highlightJS(code);
        else highlighted = escapeHtml(code);

        const lines = highlighted.split('\n');

        editorHighlight.innerHTML = lines
            .map(line => `<div class="hl-line">${line || '&nbsp;'}</div>`)
            .join('');
    }

    function updateLineNumbers() {
        const lines = editorInput.value.split('\n').length;

        let out = '';
        for (let i = 1; i <= lines; i++) {
            out += `<div class="line-number" data-line="${i}">${i}</div>`;
        }

        lineNumbers.innerHTML = out;
    }

    function highlightActiveLine() {
        const pos = editorInput.selectionStart;
        const textBefore = editorInput.value.substring(0, pos);
        const lineIndex = textBefore.split('\n').length - 1;

        const lines = editorHighlight.querySelectorAll('.hl-line');
        lines.forEach(l => l.classList.remove('active-line'));
        if (lines[lineIndex]) {
            lines[lineIndex].classList.add('active-line');
        }

        const nums = lineNumbers.querySelectorAll('.line-number');
        nums.forEach(n => n.classList.remove('active-line-number'));
        const activeNum = lineNumbers.querySelector(`.line-number[data-line="${lineIndex + 1}"]`);
        if (activeNum) activeNum.classList.add('active-line-number');
    }

    function syncScroll() {
        editorHighlight.scrollTop = editorInput.scrollTop;
        editorHighlight.scrollLeft = editorInput.scrollLeft;
        lineNumbers.scrollTop = editorInput.scrollTop;
    }

    editorInput.addEventListener('scroll', syncScroll);

    // -------------------------
    // AUTOCOMPLETE
    // -------------------------

    function getCurrentWord() {
        const pos = editorInput.selectionStart;
        const text = editorInput.value.substring(0, pos);
        const match = text.match(/[\w-]+$/);
        return match ? match[0] : "";
    }

    function showAutocomplete() {
        if (!autocompleteBox) return;

        const word = getCurrentWord();
        if (!word) {
            autocompleteBox.classList.add("hidden");
            return;
        }

        const list = (AUTOCOMPLETE_DATA[currentLang] || [])
            .filter(item => item.key.startsWith(word))   // ← ВАЖЛИВО
            .slice(0, 20);

        if (list.length === 0) {
            autocompleteBox.classList.add("hidden");
            return;
        }

        autocompleteBox.innerHTML = list
            .map((item, i) =>
                `<div data-value="${item.snippet}" data-key="${item.key}" class="${i === 0 ? 'selected' : ''}">
         ${item.key}
       </div>`
            )
            .join("");

        const rect = editorInput.getBoundingClientRect();
        autocompleteBox.style.left = rect.left + 10 + "px";
        autocompleteBox.style.top = rect.top + 40 + "px";

        autocompleteBox.classList.remove("hidden");
    }

    function insertAutocomplete(snippet) {
        const pos = editorInput.selectionStart;
        const text = editorInput.value;
        const word = getCurrentWord();

        const start = pos - word.length;

        // Вставляємо сніппет
        const before = text.substring(0, start);
        const after = text.substring(pos);

        // Знаходимо позицію курсора
        const cursorIndex = snippet.indexOf("|");
        const cleanSnippet = snippet.replace("|", "");

        editorInput.value = before + cleanSnippet + after;

        // Ставимо курсор у потрібне місце
        const newPos = start + cursorIndex;
        editorInput.selectionStart = editorInput.selectionEnd = newPos;

        // Оновлюємо все
        updateHighlight();
        updateLineNumbers();
        highlightActiveLine();

        autocompleteBox.classList.add("hidden");
    }

    // -------------------------
    // Виконання коду
    // -------------------------

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
        updateLineNumbers();
        highlightActiveLine();
        syncScroll();
        runCode();
    }

    // -------------------------
    // Події вводу
    // -------------------------

    editorInput.addEventListener('input', () => {
        const code = editorInput.value;
        saveCode(currentLang, code);
        updateHighlight();
        updateLineNumbers();
        highlightActiveLine();

        clearTimeout(autoRunTimer);
        autoRunTimer = setTimeout(runCode, 400);

        showAutocomplete();
    });

    editorInput.addEventListener('click', () => {
        highlightActiveLine();
        showAutocomplete();
    });

    editorInput.addEventListener('keyup', (e) => {
        if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
            showAutocomplete();
        }
    });

    editorInput.addEventListener("keydown", (e) => {
        if (autocompleteBox.classList.contains("hidden")) return;

        const items = [...autocompleteBox.querySelectorAll("div")];
        if (items.length === 0) return;

        let index = items.findIndex(i => i.classList.contains("selected"));
        if (index === -1) index = 0;

        // Навігація ↑ ↓
        if (e.key === "ArrowDown") {
            e.preventDefault();
            items[index].classList.remove("selected");
            index = (index + 1) % items.length;
            items[index].classList.add("selected");
            return;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            items[index].classList.remove("selected");
            index = (index - 1 + items.length) % items.length;
            items[index].classList.add("selected");
            return;
        }

        // ВСТАВКА ПІДКАЗКИ ПО ENTER / TAB
        if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault(); // блокуємо textarea
            const value = items[index].dataset.value;
            insertAutocomplete(value);
            return;
        }

        // ESC — закрити
        if (e.key === "Escape") {
            autocompleteBox.classList.add("hidden");
            return;
        }
    });

    if (autocompleteBox) {
        autocompleteBox.addEventListener("click", (e) => {
            if (e.target.dataset.value) {
                insertAutocomplete(e.target.dataset.value);
            }
        });
    }

    tabs.forEach(tab =>
        tab.addEventListener('click', () => setTab(tab.dataset.lang))
    );

    // -------------------------
    // Кнопки
    // -------------------------

    if (runButton) {
        runButton.addEventListener('click', runCode);
    }

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            const def = defaultSnippets[currentLang];
            editorInput.value = def;
            saveCode(currentLang, def);
            updateHighlight();
            updateLineNumbers();
            highlightActiveLine();
            syncScroll();
            runCode();
        });
    }

    if (formatButton) {
        formatButton.addEventListener('click', () => {
            let code = editorInput.value;

            if (currentLang === 'html') code = beautifyHTML(code);
            if (currentLang === 'css') code = beautifyCSS(code);
            if (currentLang === 'js') code = beautifyJS(code);

            editorInput.value = code;
            saveCode(currentLang, code);
            updateHighlight();
            updateLineNumbers();
            highlightActiveLine();
            syncScroll();
        });
    }

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

    // -------------------------
    // Drag‑resize
    // -------------------------

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

    // -------------------------
    // Старт
    // -------------------------

    setTab('html');
})();