(function () {
    const body = document.body;
    const themeButton = document.getElementById('themeButton');
    const orientationButton = document.getElementById('orientationButton');
    const homeButton = document.getElementById('homeButton');
    const yearSpan = document.getElementById('currentYear');

    // Поточний рік
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear().toString();
    }

    // Ключі localStorage
    const THEME_KEY = 'tryit-theme';
    const ORIENTATION_KEY = 'tryit-orientation';

    // Застосування теми
    function applyTheme(theme) {
        body.classList.remove('theme-light', 'theme-dark');
        body.classList.add(theme);

        if (themeButton) {
            themeButton.querySelector('.icon').textContent =
                theme === 'theme-dark' ? '☾' : '☀';
        }
    }

    // Застосування орієнтації
    function applyOrientation(orientation) {
        body.classList.remove('layout-horizontal', 'layout-vertical');
        body.classList.add(orientation);
    }

    // Завантаження збережених налаштувань
    const savedTheme = localStorage.getItem(THEME_KEY);
    const savedOrientation = localStorage.getItem(ORIENTATION_KEY);

    applyTheme(savedTheme === 'theme-dark' ? 'theme-dark' : 'theme-light');
    applyOrientation(savedOrientation === 'layout-vertical'
        ? 'layout-vertical'
        : 'layout-horizontal'
    );

    // Перемикач теми
    if (themeButton) {
        themeButton.addEventListener('click', () => {
            const next = body.classList.contains('theme-dark')
                ? 'theme-light'
                : 'theme-dark';

            applyTheme(next);
            localStorage.setItem(THEME_KEY, next);
        });
    }

    // Перемикач орієнтації
    if (orientationButton) {
        orientationButton.addEventListener('click', () => {
            const next = body.classList.contains('layout-vertical')
                ? 'layout-horizontal'
                : 'layout-vertical';

            applyOrientation(next);
            localStorage.setItem(ORIENTATION_KEY, next);
        });
    }

    // Кнопка "Додому"
    if (homeButton) {
        homeButton.addEventListener('click', () => {
            window.location.href = 'https://w3schoolsua.github.io/';
        });
    }
})();