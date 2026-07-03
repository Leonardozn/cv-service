const { CvMongodb } = require('@cv-service/db-connections')
const Schema = CvMongodb.Schema

class ExperienceModel {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	experienceSchema

	constructor() {
		this.experienceSchema = new Schema({
			curriculum: {
				type: Schema.Types.ObjectId,
				ref: 'curriculums',
				required: true
			},
			position: {
				type: String,
				required: true
			},
			company: {
				type: String,
				required: true
			},
			location: {
				type: String
			},
			startDate: {
				type: Date,
				required: true
			},
			endDate: {
				type: Date
			},
			description: {
				type: String,
				required: true
			}
		}, {
			collection: 'experiences',
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
		if (!this.instance) this.instance = new ExperienceModel()
		return this.instance
	}

	getModel() {
		return CvMongodb.models.Experience || CvMongodb.model('Experience', this.experienceSchema)
	}
}

module.exports = ExperienceModel