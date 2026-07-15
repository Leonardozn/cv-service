const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')

// envVariables.js reads process.env once at require time - point API_UPLOAD_PATH at an isolated
// temp directory before anything transitively requires it, so this test is cwd-independent and
// never touches the real api-uploads directory.
const UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-service-resolve-photo-'))
process.env.API_UPLOAD_PATH = process.env.API_UPLOAD_PATH || UPLOAD_DIR

const ResolveCurriculumPhoto = require('../../../../src/services/commands/resolveCurriculumPhoto')

test('ResolveCurriculumPhoto — reads the stored photo file into a Buffer', async () => {
	fs.writeFileSync(path.join(UPLOAD_DIR, 'me.png'), Buffer.from([1, 2, 3, 4]))
	const command = ResolveCurriculumPhoto.getInstance()

	const result = await command.execute({ photo: 'me.png' })

	assert.equal(Buffer.isBuffer(result), true)
	assert.deepEqual(result, Buffer.from([1, 2, 3, 4]))
})

test('ResolveCurriculumPhoto — returns undefined when the Curriculum has no photo', async () => {
	const command = ResolveCurriculumPhoto.getInstance()

	const result = await command.execute({ photo: undefined })

	assert.equal(result, undefined)
})

test('ResolveCurriculumPhoto — returns undefined when the stored file is missing on disk', async () => {
	const command = ResolveCurriculumPhoto.getInstance()

	const result = await command.execute({ photo: 'does-not-exist.png' })

	assert.equal(result, undefined)
})
