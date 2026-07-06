'use strict'

const zlib = require('node:zlib')

// react-pdf writes glyph runs as hex strings inside Tj/TJ operators within FlateDecode content
// streams. Good enough to assert on rendered CV text (e.g. dates, headline) without a full PDF
// parser - not a general-purpose PDF reader.
function decodePdfText(buffer) {
	const raw = buffer.toString('latin1')
	const streamPattern = /stream\r?\n([\s\S]*?)endstream/g
	let text = ''
	let streamMatch

	while ((streamMatch = streamPattern.exec(raw))) {
		let inflated
		try {
			inflated = zlib.inflateSync(Buffer.from(streamMatch[1], 'latin1')).toString('latin1')
		} catch {
			continue
		}

		const hexPattern = /<([0-9a-fA-F]+)>/g
		let hexMatch
		while ((hexMatch = hexPattern.exec(inflated))) {
			text += Buffer.from(hexMatch[1], 'hex').toString('latin1')
		}
	}

	// A long unbroken run (e.g. "city/state/country" with no spaces) can get automatically
	// hyphenated by react-pdf's line-wrapping when it doesn't fit the given width, inserting a
	// '-' directly between two letters - that's a layout artifact, not real content. Only strip
	// letter-letter hyphens (not digit-digit, e.g. a formatted date range like "2016-01-15", which
	// is real content and must survive untouched).
	return text.replace(/([A-Za-zÀ-ÿ])-([A-Za-zÀ-ÿ])/g, '$1$2')
}

module.exports = { decodePdfText }
