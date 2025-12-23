import React from 'react'
import { IFileAnalysis } from '../App.props'
import MetricCards from './MetricCards'
import {
	AreaChart,
	BarChart,
	DonutChart,
} from '@tremor/react'

interface HomeMetricsProps {
	analysis: IFileAnalysis
}

// Tremor chart colors using Tailwind theme colors
const chartColors = [
	'blue-400',    // chart-1
	'violet-400',  // chart-2
	'pink-400',    // chart-3
	'orange-400',  // chart-4
	'teal-400',    // chart-5
	'yellow-400',  // chart-6
	'red-400',     // chart-7
	'indigo-400',  // chart-8
	'emerald-400', // chart-9
	'cyan-400',    // chart-10
]

const HomeMetrics: React.FC<HomeMetricsProps> = ({ analysis }) => {
	const { file_years, file_types, file_types_by_year, size_categories, total_files } = analysis

	// Get top file types for the timeline
	const topTypes = Object.entries(file_types)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([name]) => name)

	// Prepare timeline data with actual file type breakdowns
	const timelineData = Object.entries(file_years)
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([year]) => {
			const yearData: Record<string, string | number> = { year }
			topTypes.forEach(type => {
				yearData[type] = file_types_by_year[year]?.[type] || 0
			})
			return yearData
		})

	const fileTypeData = Object.entries(file_types)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 8)
		.map(([name, value]) => ({
			name,
			value,
		}))

	const sizeCategoryData = Object.entries(size_categories).map(([name, value]) => ({
		name,
		files: value,
	}))

	// Calculate metrics
	const mostCommonType: [string, number] = Object.entries(file_types).length > 0
		? Object.entries(file_types).reduce((a, b) => a[1] > b[1] ? a : b)
		: ['N/A', 0]

	// Storage efficiency metric (smaller files are more efficient)
	const storageEfficiency = total_files > 0
		? Math.min(100, Math.round(((size_categories.Tiny || 0) + (size_categories.Small || 0)) / total_files * 100))
		: 0

	// ============================================================================

	const renderTimelineChart = () => (
		<div className="card bg-linear-to-br from-blue-900/50 to-blue-950/50 border border-blue-800/30 shadow-lg">
			<div className="card-body text-white">
				<div className="mb-3">
					<h5 className="card-title mb-1">Files Over Time by Type</h5>
					<p className="text-gray-400 text-sm mb-0">Distribution across top file types</p>
				</div>
				<AreaChart
					className="h-72"
					data={timelineData}
					index="year"
					categories={topTypes}
					colors={chartColors.slice(0, topTypes.length)}
					showLegend={true}
					showGridLines={true}
					showAnimation={true}
				/>
			</div>
		</div>
	)

	const renderMetricsPieCharts = () => {
		// Metric 1: Storage Efficiency
		const smallFiles = (size_categories.Tiny || 0) + (size_categories.Small || 0)
		const storageEfficiencyData = [
			{ name: 'Small Files', value: smallFiles },
			{ name: 'Large Files', value: total_files - smallFiles }
		]

		// Metric 2: File Type Diversity
		const topTypeCount = mostCommonType[1]
		const diversityData = [
			{ name: mostCommonType[0], value: topTypeCount },
			{ name: 'Other Types', value: total_files - topTypeCount }
		]

		// Metric 3: Size Distribution
		const largeFiles = (size_categories.Large || 0) + (size_categories.Huge || 0)
		const mediumSmallFiles = total_files - largeFiles
		const sizeDistData = [
			{ name: 'Large Files', value: largeFiles },
			{ name: 'Small/Medium', value: mediumSmallFiles }
		]

		// Metric 4: Recent Activity
		const years = Object.keys(file_years).sort()
		const recentYear = years.length > 0 ? years[years.length - 1] : '2025'
		const prevYear = years.length > 1 ? years[years.length - 2] : '2024'
		const recentFiles = (file_years[recentYear] || 0) + (file_years[prevYear] || 0)
		const olderFiles = total_files - recentFiles
		const recentActivityData = [
			{ name: 'Recent (2y)', value: recentFiles },
			{ name: 'Older', value: olderFiles }
		]

		const renderMiniDonutChart = (data: Array<{ name: string; value: number }>, title: string, percentage: number, subtitle: string, colorIndex: number) => (
			<div className="col-span-1">
				<div className="card bg-linear-to-br from-blue-900/50 to-blue-950/50 border border-blue-800/30 shadow-lg h-full">
					<div className="card-body text-center p-3">
						<h6 className="text-white mb-2 text-sm">{title}</h6>
						<div className="relative" style={{ height: '120px' }}>
							<DonutChart
								data={data}
								category="value"
								index="name"
								colors={[chartColors[colorIndex], 'slate-700']}
								showLabel={false}
								showAnimation={true}
								className="h-full"
							/>
							<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
								<h4 className="mb-0 font-bold text-white text-2xl">{percentage}%</h4>
							</div>
						</div>
						<p className="text-gray-400 text-sm mb-0 mt-2">{subtitle}</p>
					</div>
				</div>
			</div>
		)

		return (
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
				{renderMiniDonutChart(
					storageEfficiencyData,
					'Storage Efficiency',
					storageEfficiency,
					`${smallFiles.toLocaleString()} small files`,
					0
				)}
				{renderMiniDonutChart(
					diversityData,
					'Type Dominance',
					Math.round(topTypeCount / total_files * 100),
					`${mostCommonType[0]} leads`,
					1
				)}
				{renderMiniDonutChart(
					sizeDistData,
					'Large Files',
					Math.round(largeFiles / total_files * 100),
					`${largeFiles.toLocaleString()} large files`,
					4
				)}
				{renderMiniDonutChart(
					recentActivityData,
					'Recent Activity',
					Math.round(recentFiles / total_files * 100),
					`Last 2 years`,
					8
				)}
			</div>
		)
	}

	const renderFileTypeChart = () => (
		<div className="col-span-1 lg:col-span-1">
			<div className="card bg-linear-to-br from-blue-900/50 to-blue-950/50 border border-blue-800/30 shadow-lg h-full">
				<div className="card-body text-white">
					<div className="mb-3">
						<h5 className="card-title mb-1">File Type Distribution</h5>
						<p className="text-gray-400 text-sm mb-0">Top file types</p>
					</div>
					<BarChart
						className="h-64"
						data={fileTypeData.slice(0, 6)}
						index="name"
						categories={['value']}
						colors={chartColors.slice(0, 6)}
						showLegend={false}
						showGridLines={true}
						showAnimation={true}
					/>
					<div className="flex flex-wrap gap-3 justify-center mt-3">
						{fileTypeData.slice(0, 6).map((item, index) => {
							const bgColorClasses = [
								'bg-blue-400/25',
								'bg-violet-400/25',
								'bg-pink-400/25',
								'bg-orange-400/25',
								'bg-teal-400/25',
								'bg-yellow-400/25',
							]
							return (
								<div key={index} className="shrink-0">
									<div className={`text-center px-3 py-2 rounded ${bgColorClasses[index]}`}>
										<small className="text-white block font-semibold text-xs">{item.name}</small>
										<h5 className="font-light mb-0 text-white">{item.value.toLocaleString()}</h5>
									</div>
								</div>
							)
						})}
					</div>
				</div>
			</div>
		</div>
	)

	const renderSizeCategoriesChart = () => (
		<div className="col-span-1 lg:col-span-1">
			<div className="card bg-linear-to-br from-blue-900/50 to-blue-950/50 border border-blue-800/30 shadow-lg h-full">
				<div className="card-body text-white">
					<div className="mb-3">
						<h5 className="card-title mb-1">Size Categories</h5>
						<p className="text-gray-400 text-sm mb-0">Files by size range</p>
					</div>
					<BarChart
						className="h-64"
						data={sizeCategoryData}
						index="name"
						categories={['files']}
						colors={chartColors}
						showLegend={false}
						showGridLines={true}
						showAnimation={true}
					/>
					<div className="flex flex-wrap gap-3 justify-center mt-3">
						{sizeCategoryData.map((item, index) => {
							const bgColorClasses = [
								'bg-blue-400/25',
								'bg-violet-400/25',
								'bg-pink-400/25',
								'bg-orange-400/25',
								'bg-teal-400/25',
								'bg-yellow-400/25',
								'bg-red-400/25',
								'bg-indigo-400/25',
								'bg-emerald-400/25',
								'bg-cyan-400/25',
							]
							return (
								<div key={index} className="shrink-0">
									<div className={`text-center px-3 py-2 rounded ${bgColorClasses[index]}`}>
										<small className="text-white block font-semibold text-xs">{item.name}</small>
										<h5 className="font-light mb-0 text-white">{item.files.toLocaleString()}</h5>
									</div>
								</div>
							)
						})}
					</div>
				</div>
			</div>
		</div>
	)

	// ============================================================================

	return (
		<div>
			<MetricCards analysis={analysis} />

			{/* Charts Grid */}
			<div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-3">
				<div className="lg:col-span-2">
					{renderTimelineChart()}
				</div>
				<div className="lg:col-span-1">
					{renderMetricsPieCharts()}
				</div>
			</div>

			{/* Bottom Charts */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{renderFileTypeChart()}
				{renderSizeCategoriesChart()}
			</div>
		</div>
	)
}

export default HomeMetrics
