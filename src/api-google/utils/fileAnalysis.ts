import { FileSizeThresholds, IMediaFile } from '../../App.props';

export interface IFileAnalysis {
	total_files: number;
	total_size: number;
	file_types: Record<string, number>;
	file_years: Record<string, number>;
	file_types_by_year: Record<string, Record<string, number>>;
	common_names: Record<string, number>;
	size_categories: Record<string, number>;
}

export const getFileAnalysis = (gapiFiles: IMediaFile[]): IFileAnalysis => {
	const topNames = 50
	const analysis = {
		total_files: 0,
		total_size: 0,
		file_types: {} as Record<string, number>,
		file_years: {} as Record<string, number>,
		file_types_by_year: {} as Record<string, Record<string, number>>,
		common_names: {} as Record<string, number>,
		size_categories: {
			Tiny: 0,
			Small: 0,
			Medium: 0,
			Large: 0,
			Huge: 0
		} as Record<string, number>
	}

	gapiFiles.forEach((file) => {
		// Increment the total file count
		analysis.total_files += 1

		// A: Bucket FILES by SIZE-CATEGORY
		if (file.size) {
			const fileSize = parseInt(file.size)
			analysis.total_size += fileSize

			// Categorize the file size
			if (fileSize <= FileSizeThresholds.Tiny) {
				analysis.size_categories.Tiny += 1
			} else if (fileSize <= FileSizeThresholds.Small) {
				analysis.size_categories.Small += 1
			} else if (fileSize <= FileSizeThresholds.Medium) {
				analysis.size_categories.Medium += 1
			} else if (fileSize <= FileSizeThresholds.Large) {
				analysis.size_categories.Large += 1
			} else {
				analysis.size_categories.Huge += 1
			}
		}

		// B: Bucket FILES by YEAR
		const year = file.modifiedByMeTime ? new Date(file.modifiedByMeTime).getFullYear().toString() : 'Unknown'
		analysis.file_years[year] = (analysis.file_years[year] || 0) + 1

		// C: Bucket FILES by MIME-TYPE
		const mimeType = file.mimeType?.split('/').pop()
		if (mimeType) {
			analysis.file_types[mimeType] = (analysis.file_types[mimeType] || 0) + 1

			// Track file types by year
			if (!analysis.file_types_by_year[year]) {
				analysis.file_types_by_year[year] = {}
			}
			analysis.file_types_by_year[year][mimeType] = (analysis.file_types_by_year[year][mimeType] || 0) + 1
		}

		// D: Bucket FILES by COMMON-NAME
		if (file.name) {
			const commonNameMatch = file.name.match(/^([a-zA-Z]+)(?:-|_|[0-9])/)
			const commonName = commonNameMatch ? commonNameMatch[0] : file.name.length >= 5 ? file.name.substring(0, 5) : '(misc)'
			analysis.common_names[commonName] = (analysis.common_names[commonName] || 0) + 1
		}
	})

	// Filter common names to keep only the top NN
	analysis.common_names = Object.fromEntries(Object.entries(analysis.common_names).sort(([, a], [, b]) => b - a).slice(0, topNames))

	// done
	return analysis
};
