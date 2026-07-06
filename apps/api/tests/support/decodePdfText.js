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

	return text
}

module.exports = { decodePdfText }
