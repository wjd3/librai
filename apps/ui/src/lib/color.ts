import themesCssString from '../styles/theme.css?raw'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../tailwind.config'
import { themes } from './constants/theme'

const fullTailwindConfig = resolveConfig(tailwindConfig)

export const getThemeColorValues = (themeVariable: string) => {
	const theme = process.env.PUBLIC_THEME || themes[0]

	const lightModeRegex = new RegExp(
		`:root\\[data-theme='${theme}'\\][^{]*{[^}]*--${themeVariable}:\\s*([^;\\n]+)`
	)
	const darkModeRegex = new RegExp(
		`:root\\[data-theme='${theme}'\\]\\[data-mode='dark'\\][^}]*--${themeVariable}:\\s*([^;\\n]+)`
	)

	const lightModeMatch = lightModeRegex.exec(themesCssString)
	const darkModeMatch = darkModeRegex.exec(themesCssString)

	const lightThemeVariableValue = lightModeMatch
		? lightModeMatch[1].trim().replace("theme('colors.", '').replace("')", '').split('.')
		: null
	const darkThemeVariableValue = darkModeMatch
		? darkModeMatch[1].trim().replace("theme('colors.", '').replace("')", '').split('.')
		: null

	const lightThemeTailwindColor = lightThemeVariableValue?.[0]
	const lightThemeShade = lightThemeVariableValue?.[1]

	const darkThemeTailwindColor = darkThemeVariableValue?.[0]
	const darkThemeShade = darkThemeVariableValue?.[1]

	const lightThemeColorHexCode =
		fullTailwindConfig.theme.colors[
			lightThemeTailwindColor as keyof typeof fullTailwindConfig.theme.colors
		][lightThemeShade as keyof (typeof fullTailwindConfig.theme.colors)['blue']]
	const darkThemeColorHexCode =
		fullTailwindConfig.theme.colors[
			darkThemeTailwindColor as keyof typeof fullTailwindConfig.theme.colors
		][darkThemeShade as keyof (typeof fullTailwindConfig.theme.colors)['blue']]

	return {
		light: lightThemeColorHexCode ? lightThemeColorHexCode : null,
		dark: darkThemeColorHexCode ? darkThemeColorHexCode : null
	}
}
