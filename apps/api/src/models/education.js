const { CvMongodb } = require('@cv-service/db-connections')
const Schema = CvMongodb.Schema

class EducationModel {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	educationSchema

	constructor() {
		this.educationSchema = new Schema({
			curriculum: {
				type: Schema.Types.ObjectId,
				ref: 'curriculums',
				required: true
			},
			title: {
				type: String,
				required: true
			},
			institution: {
				type: String,
				required: true
			},
			startDate: {
				type: Date,
				required: true
			},
			endDate: {
				type: Date
			}
		}, {
			collection: 'educations',
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
		if (!this.instance) this.instance = new EducationModel()
		return this.instance
	}

	getModel() {
		return CvMongodb.models.Education || CvMongodb.model('Education', this.educationSchema)
	}
}

module.exports = EducationModel