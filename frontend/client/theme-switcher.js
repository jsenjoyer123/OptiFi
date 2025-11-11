// Theme Switcher - темная/светлая тема
(function () {
  function applyTheme(theme) {
    if (!theme) {
      theme = localStorage.getItem('theme') || 'light';
    }

    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    updateThemeIcon();
  }

  function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    return newTheme;
  }

  function updateThemeIcon() {
    const icon = document.getElementById('themeIcon');
    if (icon) {
      const theme = localStorage.getItem('theme') || 'light';
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  // Экспортируем в глобальную область для inline-скриптов
  window.applyTheme = applyTheme;
  window.toggleTheme = toggleTheme;

  // Применяем тему при загрузке
  applyTheme();
})();
