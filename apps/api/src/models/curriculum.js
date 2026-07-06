const { CvMongodb } = require('@cv-service/db-connections')
const Schema = CvMongodb.Schema

const CurriculumContactLinksItemSchema = new Schema({
	label: {
		type: String,
		required: true
	},
	url: {
		type: String,
		required: true
	}
}, {
	_id: false
})

class CurriculumModel {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	curriculumSchema

	constructor() {
		this.curriculumSchema = new Schema({
			user: {
				type: String,
				unique: true,
				required: true
			},
			fullName: {
				type: String,
				required: true
			},
			headline: {
				type: [String],
				required: true
			},
			city: {
				type: String,
				required: true
			},
			photo: {
				type: String
			},
			profileSummary: {
				type: String,
				required: true
			},
			skills: {
				type: [String]
			},
			contactLinks: {
				type: [CurriculumContactLinksItemSchema]
			}
		}, {
			collection: 'curriculums',
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
		if (!this.instance) this.instance = new CurriculumModel()
		return this.instance
	}

	getModel() {
		return CvMongodb.models.Curriculum || CvMongodb.model('Curriculum', this.curriculumSchema)
	}
}

module.exports = CurriculumModel