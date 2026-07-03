const Repository = require('../repositories')
const Contract = require('../contracts')
const CertificateInterfaces = require('../interfaces/certificate')
const CertificateContract = require('../contracts/certificate')
const HandleResponseHandler = require('../handlers/handleResponse')
const { BadRequestError } = require('../handlers/handleErrors')
const FileManagerHandler = require('../handlers/fileManager')
const path = require('path')
const crypto = require('crypto')
const envVariables = require('../handlers/envVariables')

class CertificateService {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	handleResponseHandler

	/**
	 * @private
	 */
	certificateInterface

	/**
	 * @private
	 */
	certificateContract

	/**
	 * @private
	 */
	repository

	/**
	 * @private
	 */
	contract

	constructor() {
		this.handleResponseHandler = HandleResponseHandler.getInstance()
		this.responseBody = this.handleResponseHandler.getResponseBody()

		this.certificateInterface = CertificateInterfaces.getInstance()
		this.certificateContract = CertificateContract.getInstance()
		this.repository = Repository.getInstance()
		this.contract = Contract.getInstance()

		this.fileManagerHandler = FileManagerHandler.getInstance()
		this.storageProvider = this.fileManagerHandler.getProvider()
	}

	static getInstance() {
		if (!this.instance) this.instance = new CertificateService()
		return this.instance
	}

	async add(config = {}) {
		const { body, files = [], options = {} } = config
		const payload = Array.isArray(body) ? [...body] : { ...body }
		
		// 1. Initial creation
		const unflattenedBody = Array.isArray(payload) ? payload.map(p => this._unflatten(p)) : this._unflatten(payload)
		const data = Array.isArray(unflattenedBody)
			? unflattenedBody.map(el => this.certificateInterface.getCreateInterface().parse(el))
			: this.certificateInterface.getCreateInterface().parse(unflattenedBody)
		
		let certificate = await this.repository.add('certificate', { data, options })

		// 2. Handle files if present
		if (files && files.length) {
			const certificateId = Array.isArray(certificate) ? certificate[0]._id : certificate._id
			const destinationPath = envVariables.API_UPLOAD_PATH || path.join(process.cwd(), 'api-uploads')
			const updates = {}
			const savedFiles = []

			try {
				for (const file of files) {
					const fieldPath = file.fieldname.replace(/\[(\w+)\]/g, '.$1')
					const originalName = file.originalname.replace(/\s+/g, '_')
					const newFilename = `certificate-${crypto.randomUUID()}-${originalName}`
					
					const savedFileUrl = await this.storageProvider.saveFile(file, newFilename)
					savedFiles.push(savedFileUrl)

					// Accumulate into array if multiple files share the same fieldname
					if (fieldPath in updates) {
						updates[fieldPath] = Array.isArray(updates[fieldPath])
							? [...updates[fieldPath], savedFileUrl]
							: [updates[fieldPath], savedFileUrl]
					} else {
						updates[fieldPath] = savedFileUrl
					}
				}

				if (Object.keys(updates).length > 0) {
					certificate = await this.repository.update('certificate', { id: certificateId, data: updates, options })
				}
			} catch (err) {
				for (const url of savedFiles) {
					await this.storageProvider.deleteFile(url, destinationPath).catch(() => {})
				}
				throw err
			}
		}

		return this.applayContract(certificate)
	}
	
	async findOne(config = {}) {
		const { id } = config
		let virtuals = {}
		let relations = {}
		const query = this.certificateInterface.getQueryInterface().parse({ _id: id, ...config.query?.query })
		if (config.query?.virtuals) virtuals = this.certificateInterface.getVirtualsInterface().parse(config.query.virtuals)
		if (config.query?.relations) relations = this.certificateInterface.getRelationsInterface().parse(config.query.relations)
		const options = config.options || {}

		const result = await this.repository.list('certificate', { query, virtuals, relations, options })
		const certificate = result.records[0]
		if (!certificate) throw new BadRequestError('Certificate not found.')
		
		return this.applayContract(certificate)
	}
	
	async list(config = {}) {
		let query = {}
		let virtuals = {}
		let relations = {}
		if (config.query?.query) query = this.certificateInterface.getQueryInterface().parse(config.query.query)
		if (config.query?.virtuals) virtuals = this.certificateInterface.getVirtualsInterface().parse(config.query.virtuals)
		if (config.query?.relations) relations = this.certificateInterface.getRelationsInterface().parse(config.query.relations)
		const size = config.query?.size ? Number(config.query.size) : null
		const page = config.query?.page ? Number(config.query.page) : null
		const sort = config.query?.sort || {}
		const options = config.options || {}

		const certificate_list = await this.repository.list('certificate', { query, virtuals, relations, size, page, sort, options })
		certificate_list.records = this.applayContract(certificate_list.records)
		return certificate_list
	}
	
	async update(config = {}) {
		const { body, id, files = [], options = {} } = config
		const data = this._unflatten(body)
		const existingCertificate = await this.findOne({ id })
		const destinationPath = envVariables.API_UPLOAD_PATH || path.join(process.cwd(), 'api-uploads')

		// 1. Initial update with JSON data
		const payload = this.certificateInterface.getUpdateInterface().parse(data)
		let certificate = await this.repository.update('certificate', { id, data: payload, options })
		
		const existingObj = existingCertificate.toObject ? existingCertificate.toObject() : existingCertificate;

		// 2. Handle files if present
		if (files && files.length) {
			const updates = {}
			const savedFiles = []

			try {
				for (const file of files) {
					const fieldPath = file.fieldname.replace(/\[(\w+)\]/g, '.$1')
					const originalName = file.originalname.replace(/\s+/g, '_')
					const newFilename = `certificate-${crypto.randomUUID()}-${originalName}`
					
					const savedFileUrl = await this.storageProvider.saveFile(file, newFilename)
					savedFiles.push(savedFileUrl)

					// Accumulate: string for first file, array only when multiple files share the same fieldname
					if (fieldPath in updates) {
						updates[fieldPath] = Array.isArray(updates[fieldPath])
							? [...updates[fieldPath], savedFileUrl]
							: [updates[fieldPath], savedFileUrl]
					} else {
						updates[fieldPath] = savedFileUrl
					}

					// Also update local 'data' so cleanup has the new values
					this._setValueByPath(data, `payload.${fieldPath}`, updates[fieldPath])
				}

				if (Object.keys(updates).length > 0) {
					certificate = await await this.repository.update('certificate', { id, data: updates, options })
				}
			} catch (err) {
				for (const url of savedFiles) {
					await this.storageProvider.deleteFile(url, destinationPath).catch(() => {})
				}
				throw err
			}
		}

		// 3. Proactive cleanup: Map paths from both objects to ensure we catch removed fields
		const mappedPathsData = this._getFilePaths(data)
		const mappedPathsOld = this._getFilePaths(existingObj)
		const allPaths = [...new Set([...mappedPathsData, ...mappedPathsOld])]

		if (allPaths.length > 0) {
			for (const filePath of allPaths) {
				const newValue = this._getValueByPath(data, filePath)
				const oldValue = this._getValueByPath(existingObj, filePath)
				if (oldValue && oldValue !== newValue) {
					if (Array.isArray(oldValue)) {
						const newValues = Array.isArray(newValue) ? newValue : []
						for (const url of oldValue) {
							if (url && typeof url === 'string' && !newValues.includes(url)) {
								await this.storageProvider.deleteFile(url, destinationPath)
							}
						}
					} else if (typeof oldValue === 'string') {
						await this.storageProvider.deleteFile(oldValue, destinationPath)
					}
				}
			}
		}

		return this.applayContract(certificate)
	}

	async replace(config = {}) {
		const { body, id, files = [], options = {} } = config
		const data = this._unflatten(body)
		const existingCertificate = await this.findOne({ id })
		const destinationPath = envVariables.API_UPLOAD_PATH || path.join(process.cwd(), 'api-uploads')
		
		// 1. Initial replace with JSON data
		const payload = this.certificateInterface.getUpdateInterface().parse(data)
		let certificate = await await this.repository.replace('certificate', { id, data: payload, options })

		const existingObj = existingCertificate.toObject ? existingCertificate.toObject() : existingCertificate;

		// 2. Handle files if present
		if (files && files.length) {
			const updates = {}
			const savedFiles = []

			try {
				for (const file of files) {
					const fieldPath = file.fieldname.replace(/\[(\w+)\]/g, '.$1')
					const originalName = file.originalname.replace(/\s+/g, '_')
					const newFilename = `certificate-${crypto.randomUUID()}-${originalName}`
					
					const savedFileUrl = await this.storageProvider.saveFile(file, newFilename)
					savedFiles.push(savedFileUrl)

					// Accumulate: string for first file, array only when multiple files share the same fieldname
					if (fieldPath in updates) {
						updates[fieldPath] = Array.isArray(updates[fieldPath])
							? [...updates[fieldPath], savedFileUrl]
							: [updates[fieldPath], savedFileUrl]
					} else {
						updates[fieldPath] = savedFileUrl
					}

					// Also update local 'data' so cleanup has the new values
					this._setValueByPath(data, `payload.${fieldPath}`, updates[fieldPath])
				}

				if (Object.keys(updates).length > 0) {
					certificate = await this.repository.update('certificate', { id, data: updates, options })
				}
			} catch (err) {
				for (const url of savedFiles) {
					await this.storageProvider.deleteFile(url, destinationPath).catch(() => {})
				}
				throw err
			}
		}

		// 3. Proactive cleanup: Map paths from both objects to ensure we catch removed fields
		const mappedPathsData = this._getFilePaths(data)
		const mappedPathsOld = this._getFilePaths(existingObj)
		const allPaths = [...new Set([...mappedPathsData, ...mappedPathsOld])]

		if (allPaths.length > 0) {
			for (const filePath of allPaths) {
				const newValue = this._getValueByPath(data, filePath)
				const oldValue = this._getValueByPath(existingObj, filePath)
				if (oldValue && oldValue !== newValue) {
					if (Array.isArray(oldValue)) {
						const newValues = Array.isArray(newValue) ? newValue : []
						for (const url of oldValue) {
							if (url && typeof url === 'string' && !newValues.includes(url)) {
								await this.storageProvider.deleteFile(url, destinationPath)
							}
						}
					} else if (typeof oldValue === 'string') {
						await this.storageProvider.deleteFile(oldValue, destinationPath)
					}
				}
			}
		}

		return this.applayContract(certificate)
	}
	
	async remove(config = {}) {
		const { id, options = {} } = config
		const existingCertificate = await this.findOne({ id })

		const existingObj = existingCertificate.toObject ? existingCertificate.toObject() : existingCertificate
		const destinationPath = envVariables.API_UPLOAD_PATH || path.join(process.cwd(), 'api-uploads')
		const mappedPaths = this._getFilePaths(existingObj)
		
		const repositoryResponse = await await this.repository.remove('certificate', { id, options })
		
		if (mappedPaths.length > 0) {
			for (const filePath of mappedPaths) {
				const imageUrl = this._getValueByPath(existingObj, filePath)
				
				if (imageUrl) {
					if (Array.isArray(imageUrl)) {
						for (const url of imageUrl) {
							if (url && typeof url === 'string') {
								await this.storageProvider.deleteFile(url, destinationPath)
							}
						}
					} else if (typeof imageUrl === 'string') {
						await this.storageProvider.deleteFile(imageUrl, destinationPath)
					}
				}
			}
		}

		return repositoryResponse
	}

	applayContract(payload) {
		const contract = this.certificateContract.getContract()

		if (Array.isArray(payload)) {
			return payload.map(item => this.contract.applyContract(contract, this._normalizeContractPayload(item)))
		}

		if (payload && typeof payload === 'object') {
			return this.contract.applyContract(contract, this._normalizeContractPayload(payload))
		}

		return payload
	}

	_normalizeContractPayload(payload) {
		if (payload && typeof payload.toObject === 'function') return payload.toObject()
		return payload
	}

	_getFilePaths(payload) {
		const fileFieldsEnv = envVariables.API_FILE_FIELDS;
		if (!fileFieldsEnv) return []
		const targetKeys = fileFieldsEnv.split(',').map(f => f.trim())
		const mappedPaths = []

		const traverse = (obj, currentPath) => {
			if (!obj || typeof obj !== 'object') return
			
			for (const key in obj) {
				const path = currentPath ? `${currentPath}.${key}` : key
				if (targetKeys.includes(key)) {
					mappedPaths.push(`payload.${path}`)
				}
				
				if (Array.isArray(obj[key])) {
					obj[key].forEach((item, index) => {
						traverse(item, `${path}.${index}`)
					})
				} else if (typeof obj[key] === 'object' && obj[key] !== null) {
					traverse(obj[key], path)
				}
			}
		}

		traverse(payload, '')
		return mappedPaths
	}

	_getValueByPath(obj, mappedPath) {
		const parts = mappedPath.split('.').slice(1)
		return parts.reduce((acc, p) => acc?.[p], obj)
	}

	_setValueByPath(obj, mappedPath, value) {
		const parts = mappedPath.split('.').slice(1)
		let current = obj
		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i]
			const nextPart = parts[i + 1]
			current[part] = current[part] || (isNaN(nextPart) ? {} : [])
			current = current[part]
		}
		current[parts[parts.length - 1]] = value
	}

	_unflatten(obj) {
		const result = {}

		for (const key in obj) {
			const parts = key.replace(/\]/g, '').split(/[\[\.]/)
			let current = result;
			for (let i = 0; i < parts.length; i++) {
				const part = parts[i]

				if (i === parts.length - 1) {
					current[part] = obj[key]
				} else {
					current[part] = current[part] || (isNaN(parts[i + 1]) ? {} : [])
					current = current[part]
				}
			}
		}
		
		return result
	}
}

module.exports = CertificateService