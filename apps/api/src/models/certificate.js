const { CvMongodb } = require('@cv-service/db-connections')
const Schema = CvMongodb.Schema

class CertificateModel {
	/**
	 * @private
	 * @static
	 */
	instance

	/**
	 * @private
	 */
	certificateSchema

	constructor() {
		this.certificateSchema = new Schema({
			curriculum: {
				type: Schema.Types.ObjectId,
				ref: 'curriculums',
				required: true
			},
			name: {
				type: String,
				required: true
			},
			date: {
				type: Date,
				required: true
			}
		}, {
			collection: 'certificates',
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
		if (!this.instance) this.instance = new CertificateModel()
		return this.instance
	}

	getModel() {
		return CvMongodb.models.Certificate || CvMongodb.model('Certificate', this.certificateSchema)
	}
}

module.exports = CertificateModel