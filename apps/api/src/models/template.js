const { CvMongodb } = require('@cv-service/db-connections')
const Schema = CvMongodb.Schema

class TemplateModel {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	templateSchema

	constructor() {
		this.templateSchema = new Schema({
			name: {
				type: String,
				required: true
			},
			key: {
				type: String,
				required: true
			},
			description: {
				type: String
			},
			active: {
				type: Boolean,
				required: true
			}
		}, {
			collection: 'templates',
			timestamps: true,
			toJSON: {
				transform: function (doc, ret) {
					delete ret.__v
					return ret
				}
			},
			toObject: {
				transform: function (doc, ret) {
					delete ret.__v
					return ret
				}
			}
		})
	}

	static getInstance() {
		if (!this.instance) this.instance = new TemplateModel()
		return this.instance
	}

	getModel() {
		return CvMongodb.models.Template || CvMongodb.model('Template', this.templateSchema)
	}
}

module.exports = TemplateModel