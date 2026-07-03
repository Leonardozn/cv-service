const React = require('react')
const { Page, View, Text, Image, StyleSheet } = require('@react-pdf/renderer')

const styles = StyleSheet.create({
	page: { flexDirection: 'row', fontSize: 10, fontFamily: 'Helvetica' },
	sidebar: { width: '32%', backgroundColor: '#2d3748', color: '#ffffff', padding: 20 },
	main: { width: '68%', padding: 20 },
	photo: { width: 80, height: 80, borderRadius: 40, marginBottom: 12, alignSelf: 'center' },
	name: { fontSize: 16, fontWeight: 700, marginBottom: 4, textAlign: 'center' },
	headline: { fontSize: 10, marginBottom: 10, textAlign: 'center' },
	city: { fontSize: 9, marginBottom: 14, textAlign: 'center' },
	sidebarSectionTitle: { fontSize: 10, fontWeight: 700, marginTop: 12, marginBottom: 6, textTransform: 'uppercase' },
	sidebarLine: { fontSize: 9, marginBottom: 4 },
	mainSectionTitle: { fontSize: 11, fontWeight: 700, marginTop: 14, marginBottom: 6, textTransform: 'uppercase', color: '#2d3748' },
	paragraph: { fontSize: 9, lineHeight: 1.4 },
	item: { marginBottom: 8 },
	itemTitle: { fontSize: 10, fontWeight: 700 },
	itemSubtitle: { fontSize: 9, color: '#4a5568', marginBottom: 2 }
})

function formatDateRange(startDate, endDate, fallback) {
	const start = startDate ? String(startDate).slice(0, 10) : ''
	const end = endDate ? String(endDate).slice(0, 10) : fallback
	return [start, end].filter(Boolean).join(' - ')
}

// Renders the Curriculum with a two-column layout: a sidebar (identity, contact, skills)
// and a main column (profile summary, education, experience, certificates).
function ClassicTwoColumns({ curriculum = {} }) {
	const {
		fullName, headline, photo, city, contactLinks = [], skills = [],
		profileSummary, education = [], experience = [], certificate = []
	} = curriculum

	const sidebarChildren = []
	if (photo) sidebarChildren.push(React.createElement(Image, { key: 'photo', style: styles.photo, src: photo }))
	sidebarChildren.push(React.createElement(Text, { key: 'name', style: styles.name }, fullName))
	if (headline) sidebarChildren.push(React.createElement(Text, { key: 'headline', style: styles.headline }, headline))
	if (city) sidebarChildren.push(React.createElement(Text, { key: 'city', style: styles.city }, city))

	if (contactLinks.length > 0) {
		sidebarChildren.push(React.createElement(Text, { key: 'contact-title', style: styles.sidebarSectionTitle }, 'Contact'))
		contactLinks.forEach((link, index) => {
			sidebarChildren.push(React.createElement(Text, { key: `contact-${index}`, style: styles.sidebarLine }, `${link.label}: ${link.url}`))
		})
	}

	if (skills.length > 0) {
		sidebarChildren.push(React.createElement(Text, { key: 'skills-title', style: styles.sidebarSectionTitle }, 'Skills'))
		skills.forEach((skill, index) => {
			sidebarChildren.push(React.createElement(Text, { key: `skill-${index}`, style: styles.sidebarLine }, skill))
		})
	}

	const mainChildren = []
	if (profileSummary) {
		mainChildren.push(React.createElement(Text, { key: 'profile-title', style: styles.mainSectionTitle }, 'Profile'))
		mainChildren.push(React.createElement(Text, { key: 'profile-text', style: styles.paragraph }, profileSummary))
	}

	if (education.length > 0) {
		mainChildren.push(React.createElement(Text, { key: 'education-title', style: styles.mainSectionTitle }, 'Education'))
		education.forEach((entry, index) => {
			mainChildren.push(React.createElement(View, { key: `education-${index}`, style: styles.item },
				React.createElement(Text, { style: styles.itemTitle }, entry.title),
				React.createElement(Text, { style: styles.itemSubtitle }, `${entry.institution} · ${formatDateRange(entry.startDate, entry.endDate, 'In progress')}`)
			))
		})
	}

	if (experience.length > 0) {
		mainChildren.push(React.createElement(Text, { key: 'experience-title', style: styles.mainSectionTitle }, 'Experience'))
		experience.forEach((entry, index) => {
			mainChildren.push(React.createElement(View, { key: `experience-${index}`, style: styles.item },
				React.createElement(Text, { style: styles.itemTitle }, `${entry.position} · ${entry.company}`),
				React.createElement(Text, { style: styles.itemSubtitle }, formatDateRange(entry.startDate, entry.endDate, 'Present')),
				entry.description ? React.createElement(Text, { style: styles.paragraph }, entry.description) : null
			))
		})
	}

	if (certificate.length > 0) {
		mainChildren.push(React.createElement(Text, { key: 'certificate-title', style: styles.mainSectionTitle }, 'Certificates'))
		certificate.forEach((entry, index) => {
			mainChildren.push(React.createElement(View, { key: `certificate-${index}`, style: styles.item },
				React.createElement(Text, { style: styles.itemTitle }, entry.name),
				React.createElement(Text, { style: styles.itemSubtitle }, entry.date ? String(entry.date).slice(0, 10) : '')
			))
		})
	}

	return React.createElement(Page, { size: 'A4', style: styles.page },
		React.createElement(View, { style: styles.sidebar }, sidebarChildren),
		React.createElement(View, { style: styles.main }, mainChildren)
	)
}

module.exports = ClassicTwoColumns
