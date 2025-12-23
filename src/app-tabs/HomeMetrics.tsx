import React from 'react'
import { IFileAnalysis } from '../App.props'
import MetricCards from './MetricCards'
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	XAxis,
	YAxis,
} from 'recharts'
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartConfig,
} from '../components/ui/chart'

interface HomeMetricsProps {
	analysis: IFileAnalysis
}

// Standardized Data Viz Palette
const COLORS = [
	'#3b82f6', // Blue
	'#8b5cf6', // Violet
	'#ec4899', // Pink
	'#f97316', // Orange
	'#14b8a6', // Teal
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

	const renderTimelineChart = () => {
		// Create chart config for timeline
		const timelineChartConfig: ChartConfig = {}
		topTypes.forEach((type, index) => {
			timelineChartConfig[type] = {
				label: type,
				color: COLORS[index % COLORS.length],
			}
		})

		return (
			<div className="card bg-linear-to-br from-blue-900/50 to-blue-950/50 border border-blue-800/30 shadow-lg">
				<div className="card-body text-white">
					<div className="mb-3">
						<h5 className="card-title mb-1">Files Over Time by Type</h5>
						<p className="text-gray-400 text-sm mb-0">Distribution across top file types</p>
					</div>
					<ChartContainer config={timelineChartConfig} className="h-70">
						<AreaChart data={timelineData}>
							<defs>
								{topTypes.map((type, index) => (
									<linearGradient key={type} id={`color${type}`} x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8} />
										<stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.2} />
									</linearGradient>
								))}
							</defs>
							<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
							<XAxis
								dataKey="year"
								stroke="rgba(255,255,255,0.5)"
								style={{ fontSize: '0.75rem' }}
							/>
							<YAxis
								stroke="rgba(255,255,255,0.5)"
								style={{ fontSize: '0.75rem' }}
							/>
							<ChartTooltip content={<ChartTooltipContent />} />
							{topTypes.map((type, index) => (
								<Area
									key={type}
									type="monotone"
									dataKey={type}
									stackId="1"
									stroke={COLORS[index % COLORS.length]}
									strokeWidth={2}
									fillOpacity={1}
									fill={`url(#color${type})`}
									animationDuration={1000 + index * 200}
								/>
							))}
						</AreaChart>
					</ChartContainer>
					<div className="flex flex-wrap gap-3 mt-3 justify-center">
						{[...topTypes].reverse().map((type, reversedIndex) => {
							const index = topTypes.length - 1 - reversedIndex
							return (
								<div key={type} className="flex items-center gap-2">
									<div
										className="rounded-full"
										style={{
											backgroundColor: COLORS[index % COLORS.length],
											width: '14px',
											height: '14px'
										}}
									/>
									<small className="text-gray-400">{type}</small>
								</div>
							)
						})}
					</div>
				</div>
			</div>
		)
	}

	const renderMetricsPieCharts = () => {
		// Metric 1: Storage Efficiency
		const smallFiles = (size_categories.Tiny || 0) + (size_categories.Small || 0)
		const storageEfficiencyData = [
			{ name: 'Small Files', value: smallFiles, color: COLORS[0] },
			{ name: 'Large Files', value: total_files - smallFiles, color: 'rgba(255,255,255,0.1)' }
		]

		// Metric 2: File Type Diversity
		const topTypeCount = mostCommonType[1]
		const diversityData = [
			{ name: mostCommonType[0], value: topTypeCount, color: COLORS[1] },
			{ name: 'Other Types', value: total_files - topTypeCount, color: 'rgba(255,255,255,0.1)' }
		]

		// Metric 3: Size Distribution
		const largeFiles = (size_categories.Large || 0) + (size_categories.Huge || 0)
		const mediumSmallFiles = total_files - largeFiles
		const sizeDistData = [
			{ name: 'Large Files', value: largeFiles, color: COLORS[4] },
			{ name: 'Small/Medium', value: mediumSmallFiles, color: 'rgba(255,255,255,0.1)' }
		]

		// Metric 4: Recent Activity
		const years = Object.keys(file_years).sort()
		const recentYear = years.length > 0 ? years[years.length - 1] : '2025'
		const prevYear = years.length > 1 ? years[years.length - 2] : '2024'
		const recentFiles = (file_years[recentYear] || 0) + (file_years[prevYear] || 0)
		const olderFiles = total_files - recentFiles
		const recentActivityData = [
			{ name: 'Recent (2y)', value: recentFiles, color: COLORS[8] },
			{ name: 'Older', value: olderFiles, color: 'rgba(255,255,255,0.1)' }
		]

		const renderMiniPieChart = (data: Array<{ name: string; value: number; color: string }>, title: string, percentage: number, subtitle: string) => {
			const pieChartConfig: ChartConfig = {}
			data.forEach((item) => {
				pieChartConfig[item.name] = {
					label: item.name,
					color: item.color,
				}
			})

			return (
				<div className="col-span-1">
					<div className="card bg-linear-to-br from-blue-900/50 to-blue-950/50 border border-blue-800/30 shadow-lg h-full">
						<div className="card-body text-center p-3">
							<h6 className="text-white mb-2" style={{ fontSize: '0.85rem' }}>{title}</h6>
							<div className="relative" style={{ height: '120px' }}>
								<ChartContainer config={pieChartConfig} className="h-full">
									<PieChart>
										<ChartTooltip content={<ChartTooltipContent hideLabel />} />
										<Pie
											data={data}
											cx="50%"
											cy="50%"
											innerRadius={30}
											outerRadius={50}
											paddingAngle={2}
											dataKey="value"
											animationDuration={800}
										>
											{data.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.color} />
											))}
										</Pie>
									</PieChart>
								</ChartContainer>
								<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
									<h4 className="mb-0 font-bold text-white" style={{ fontSize: '1.5rem' }}>{percentage}%</h4>
								</div>
							</div>
							<p className="text-gray-400 text-sm mb-0 mt-2">{subtitle}</p>
						</div>
					</div>
				</div>
			)
		}

		return (
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
				{renderMiniPieChart(
					storageEfficiencyData,
					'Storage Efficiency',
					storageEfficiency,
					`${smallFiles.toLocaleString()} small files`
				)}
				{renderMiniPieChart(
					diversityData,
					'Type Dominance',
					Math.round(topTypeCount / total_files * 100),
					`${mostCommonType[0]} leads`
				)}
				{renderMiniPieChart(
					sizeDistData,
					'Large Files',
					Math.round(largeFiles / total_files * 100),
					`${largeFiles.toLocaleString()} large files`
				)}
				{renderMiniPieChart(
					recentActivityData,
					'Recent Activity',
					Math.round(recentFiles / total_files * 100),
					`Last 2 years`
				)}
			</div>
		)
	}

	const renderFileTypeChart = () => {
		const fileTypeChartConfig: ChartConfig = {}
		fileTypeData.slice(0, 6).forEach((item, index) => {
			fileTypeChartConfig[item.name] = {
				label: item.name,
				color: COLORS[index % COLORS.length],
			}
		})

		return (
			<div className="col-span-1 lg:col-span-1">
				<div className="card bg-linear-to-br from-blue-900/50 to-blue-950/50 border border-blue-800/30 shadow-lg h-full">
					<div className="card-body text-white">
						<div className="mb-3">
							<h5 className="card-title mb-1">File Type Distribution</h5>
							<p className="text-gray-400 text-sm mb-0">Top file types</p>
						</div>
						<ChartContainer config={fileTypeChartConfig} className="h-55">
							<BarChart data={fileTypeData.slice(0, 6).map((item, index) => ({
								name: item.name,
								value: item.value,
								fill: COLORS[index % COLORS.length]
							}))}>
								<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
								<XAxis
									dataKey="name"
									stroke="rgba(255,255,255,0.5)"
									style={{ fontSize: '0.75rem' }}
								/>
								<YAxis
									stroke="rgba(255,255,255,0.5)"
									style={{ fontSize: '0.75rem' }}
								/>
								<ChartTooltip content={<ChartTooltipContent />} />
								<Bar
									dataKey="value"
									radius={[4, 4, 0, 0]}
									animationDuration={1000}
								>
									{fileTypeData.slice(0, 6).map((_item, index) => (
										<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
									))}
								</Bar>
							</BarChart>
						</ChartContainer>
						<div className="flex flex-wrap gap-3 justify-center">
							{fileTypeData.slice(0, 6).map((item, index) => (
								<div key={index} className="shrink-0">
									<div className="text-center px-3 py-2 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] + '40' }}>
										<small className="text-white block font-semibold text-xs">{item.name}</small>
										<h5 className="font-light mb-0 text-white">{item.value.toLocaleString()}</h5>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		)
	}

	const renderSizeCategoriesChart = () => {
		const sizeChartConfig: ChartConfig = {}
		sizeCategoryData.forEach((item, index) => {
			sizeChartConfig[item.name] = {
				label: item.name,
				color: COLORS[index % COLORS.length],
			}
		})

		return (
			<div className="col-span-1 lg:col-span-1">
				<div className="card bg-linear-to-br from-blue-900/50 to-blue-950/50 border border-blue-800/30 shadow-lg h-full">
					<div className="card-body text-white">
						<div className="mb-3">
							<h5 className="card-title mb-1">Size Categories</h5>
							<p className="text-gray-400 text-sm mb-0">Files by size range</p>
						</div>
						<ChartContainer config={sizeChartConfig} className="h-55">
							<BarChart data={sizeCategoryData.map((item, index) => ({
								name: item.name,
								value: item.files,
								fill: COLORS[index % COLORS.length]
							}))}>
								<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
								<XAxis
									dataKey="name"
									stroke="rgba(255,255,255,0.5)"
									style={{ fontSize: '0.75rem' }}
								/>
								<YAxis
									stroke="rgba(255,255,255,0.5)"
									style={{ fontSize: '0.75rem' }}
								/>
								<ChartTooltip content={<ChartTooltipContent />} />
								<Bar
									dataKey="value"
									radius={[4, 4, 0, 0]}
									animationDuration={1000}
								>
									{sizeCategoryData.map((_item, index) => (
										<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
									))}
								</Bar>
							</BarChart>
						</ChartContainer>
						<div className="flex flex-wrap gap-3 justify-center">
							{sizeCategoryData.map((item, index) => (
								<div key={index} className="shrink-0">
									<div className="text-center px-3 py-2 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] + '40' }}>
										<small className="text-white block font-semibold text-xs">{item.name}</small>
										<h5 className="font-light mb-0 text-white">{item.files.toLocaleString()}</h5>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		)
	}

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
