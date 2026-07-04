const { CvMongodb } = require('@cv-service/db-connections')
const Schema = CvMongodb.Schema

class SkillModel {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	skillSchema

	constructor() {
		this.skillSchema = new Schema({
			name: {
				type: String,
				required: true
			},
			active: {
				type: Boolean,
				required: true
			}
		}, {
			collection: 'skills',
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
		if (!this.instance) this.instance = new SkillModel()
		return this.instance
	}

	getModel() {
		return CvMongodb.models.Skill || CvMongodb.model('Skill', this.skillSchema)
	}
}

module.exports = SkillModel