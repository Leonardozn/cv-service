const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const MockRepository = require('../../../support/mock-repository-preload')
const TemplateService = require('../../../../src/services/template')
const ResolveTemplate = require('../../../../src/services/commands/resolveTemplate')

beforeEach(() => {
	MockRepository.reset()
})

function seedTemplate(id, overrides = {}) {
	const repo = MockRepository.getInstance()
	const now = new Date().toISOString()
	repo._collection('template').set(id, {
		_id: id,
		name: 'Classic two columns',
		key: 'classic-two-columns',
		description: 'Two-column layout',
		active: true,
		createdAt: now,
		updatedAt: now,
		...overrides
	})
}

test('ResolveTemplate — resolves the requested Template by id', async () => {
	seedTemplate('64b0c0ffee1234567890abc1', { key: 'classic-two-columns' })
	seedTemplate('64b0c0ffee1234567890abc2', { key: 'other-design', active: false })
	const command = ResolveTemplate.getInstance()

	const result = await command.execute({ templateService: TemplateService.getInstance(), templateId: '64b0c0ffee1234567890abc2' })

	assert.equal(result.key, 'other-design')
})

test('ResolveTemplate — falls back to the active default Template when none is requested', async () => {
	seedTemplate('t1', { key: 'classic-two-columns', active: true })
	const command = ResolveTemplate.getInstance()

	const result = await command.execute({ templateService: TemplateService.getInstance(), templateId: undefined })

	assert.equal(result.key, 'classic-two-columns')
})

test('ResolveTemplate — throws when no Template is active and none was requested', async () => {
	seedTemplate('t1', { key: 'classic-two-columns', active: false })
	const command = ResolveTemplate.getInstance()

	await assert.rejects(
		() => command.execute({ templateService: TemplateService.getInstance(), templateId: undefined }),
		{ message: 'No active Template is configured.' }
	)
})

test('ResolveTemplate — throws when the requested Template id does not exist', async () => {
	const command = ResolveTemplate.getInstance()

	await assert.rejects(
		() => command.execute({ templateService: TemplateService.getInstance(), templateId: '64b0c0ffee1234567890abcd' })
	)
})
