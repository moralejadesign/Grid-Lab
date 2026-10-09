import { loadFont } from '@remotion/google-fonts/HankenGrotesk'
import { loadFont as loadSpaceMono } from '@remotion/google-fonts/SpaceMono'

// Hanken Grotesk is the default grotesk for type in scenes. Remotion waits for it before rendering.
export const { fontFamily: hanken } = loadFont('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin', 'latin-ext'] })

// Space Mono Bold sets the template labels (product name, credit, website).
export const { fontFamily: spaceMono } = loadSpaceMono('normal', { weights: ['700'], subsets: ['latin', 'latin-ext'] })
