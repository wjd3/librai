import {
	RegExpMatcher,
	TextCensor,
	englishDataset,
	englishRecommendedTransformers,
	type CensorContext
} from 'obscenity'

// Create singleton instances
const matcher = new RegExpMatcher({
	...englishDataset.build(),
	...englishRecommendedTransformers
})

const asteriskStrategy = (ctx: CensorContext) => '*'.repeat(ctx.matchLength)
const censor = new TextCensor().setStrategy(asteriskStrategy)

export function censorText(text: string): string {
	const matches = matcher.getAllMatches(text)
	if (matches.length === 0) return text
	return censor.applyTo(text, matches)
}
