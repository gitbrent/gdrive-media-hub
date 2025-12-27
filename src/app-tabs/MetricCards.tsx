/**
 * MetricCards Component - Reusable KPI cards using daisyUI's stat component
 * Used in HomeMetrics, FileBrowser, and other analysis views
 */

import React from 'react'
import { IFileAnalysis, formatBytes } from '../App.props'

interface MetricCardsProps {
	analysis: IFileAnalysis
}

const MetricCards: React.FC<MetricCardsProps> = ({ analysis }) => {
	const { file_types, size_categories, total_files, total_size } = analysis

	// Calculate metrics
	const avgFileSize = total_files > 0 ? total_size / total_files : 0
	const largestCategory: [string, number] = Object.entries(size_categories).length > 0
		? Object.entries(size_categories).reduce((a, b) => a[1] > b[1] ? a : b)
		: ['N/A', 0]
	const mostCommonType: [string, number] = Object.entries(file_types).length > 0
		? Object.entries(file_types).reduce((a, b) => a[1] > b[1] ? a : b)
		: ['N/A', 0]

	return (
		<div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
			{/* Total Files - Emerald */}
			<div className="stat bg-linear-to-br from-emerald-400 to-emerald-700 text-white rounded-2xl">
				<div className="stat-figure opacity-30 text-5xl">
					<i className="bi bi-images"></i>
				</div>
				<div className="stat-title text-green-200">Total Files Loaded</div>
				<div className="stat-value">{total_files.toLocaleString()}</div>
				<div className="stat-desc text-emerald-300">{Object.keys(file_types).length} types</div>
			</div>

			{/* Most Common Type - Indigo */}
			<div className="stat bg-linear-to-br from-indigo-400 to-indigo-700 text-white rounded-2xl">
				<div className="stat-figure opacity-30 text-5xl">
					<i className="bi bi-trophy-fill"></i>
				</div>
				<div className="stat-title text-indigo-100">Most Common Type</div>
				<div className="stat-value">{mostCommonType[0]}</div>
				<div className="stat-desc text-indigo-300">{mostCommonType[1].toLocaleString()} files · {Math.round(mostCommonType[1] / total_files * 100)}%</div>
			</div>

			{/* Largest Size Group - Violet */}
			<div className="stat bg-linear-to-br from-violet-400 to-violet-700 text-white rounded-2xl">
				<div className="stat-figure opacity-30 text-5xl">
					<i className="bi bi-box-fill"></i>
				</div>
				<div className="stat-title text-violet-100">Largest Size Group</div>
				<div className="stat-value">{largestCategory[0]}</div>
				<div className="stat-desc text-violet-300">{largestCategory[1].toLocaleString()} files · {Math.round(largestCategory[1] / total_files * 100)}%</div>
			</div>

			{/* Total Storage - Rose */}
			<div className="stat bg-linear-to-br from-rose-400 to-rose-700 text-white rounded-2xl">
				<div className="stat-figure opacity-30 text-5xl">
					<i className="bi bi-floppy"></i>
				</div>
				<div className="stat-title text-rose-100">Total Storage Used</div>
				<div className="stat-value text-2xl">{formatBytes(total_size)}</div>
				<div className="stat-desc text-rose-300">{formatBytes(avgFileSize)} avg file size</div>
			</div>
		</div>
	)
}

export default MetricCards
