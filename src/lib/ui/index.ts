// place files you want to import through the `$lib` alias in this folder.

export const setTheme = (theme: 'light' | 'dark') => {
	if (typeof window != 'undefined') {
		localStorage.setItem('theme', theme);
		document.documentElement.classList.toggle('dark', theme === 'dark');
	}
};
