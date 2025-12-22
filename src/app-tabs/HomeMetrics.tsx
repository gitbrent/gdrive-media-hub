import React from 'react'
import { IFileAnalysis, formatBytes } from '../App.props'
import {
	AreaChart,
	Area,
	BarChart,
	Bar,
	PieChart,
	Pie,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Cell,
} from 'recharts'

interface HomeMetricsProps {
	analysis: IFileAnalysis
}

// ============================================================================
// KPI Card Component
// ============================================================================
interface KPIProps {
	title: string
	value: string | number
	icon: string
	subtitle?: string
	secondaryText?: string
	variant: 'purple' | 'green' | 'blue' | 'red'
}

const variantClasses: Record<KPIProps['variant'], string> = {
	purple: 'bg-gradient-to-br from-purple-600 to-purple-800',
	green: 'bg-gradient-to-br from-green-600 to-green-800',
	blue: 'bg-gradient-to-br from-blue-600 to-blue-800',
	red: 'bg-gradient-to-br from-red-600 to-red-800',
}

const KPI: React.FC<KPIProps> = ({ title, value, icon, subtitle, secondaryText, variant }) => (
	<div className="card bg-base-200 border-0 h-full rounded-2xl">
		<div className={`card-body relative overflow-hidden ${variantClasses[variant]} text-white py-2 px-4 rounded-2xl`}>
			{/* Background Icon */}
			<div className="absolute -top-1 -right-4 opacity-15 text-8xl">
				<i className={`bi ${icon}`}></i>
			</div>
			{/* Content */}
			<div className="relative z-10">
				<div className="flex items-center gap-3 mb-2">
					<div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
						<i className={`bi ${icon} text-lg`}></i>
					</div>
					<h6 className="text-sm opacity-90 mb-0">{title}</h6>
				</div>
				<h2 className="text-3xl font-bold mb-2">{value}</h2>
				{(subtitle || secondaryText) && (
					<div className="flex justify-between items-center text-xs opacity-60">
						{subtitle && <span className='text-gray-300'>{subtitle}</span>}
						{secondaryText && <span className='text-gray-300'>{secondaryText}</span>}
					</div>
				)}
			</div>
		</div>
	</div>
)

// Standardized Data Viz Palette (Tailwind 400 series for Dark Mode)
const COLORS = [
	'#60a5fa', // Blue
	'#a78bfa', // Violet
	'#f472b6', // Pink
	'#fb923c', // Orange
	'#2dd4bf', // Teal
	'#facc15', // Yellow
	'#f87171', // Red
	'#818cf8', // Indigo
	'#34d399', // Emerald
	'#22d3ee', // Cyan
]

// Custom tooltip style
interface TooltipProps {
	active?: boolean
	payload?: Array<{ name: string; value: number; color: string }>
	label?: string
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
	if (active && payload && payload.length) {
		return (
			<div className="rounded-lg border border-blue-800/30 shadow-lg" style={{ opacity: 0.98, minWidth: '200px', backgroundColor: '#1e293b' }}>
				<div className="px-3 py-2 border-b border-blue-800/30" style={{ backgroundColor: '#334155' }}>
					<strong className="text-sm text-white">{label}</strong>
				</div>
				<ul className="divide-y divide-blue-800/20">
					{payload.map((entry, index) => (
						<li key={index} className="px-3 py-2 text-white flex justify-between items-center" style={{ backgroundColor: '#1e293b' }}>
							<span className="text-sm">{entry.name}</span>
							<span className="badge badge-sm ml-2" style={{ backgroundColor: entry.color, color: '#fff' }}>
								{entry.value}
							</span>
						</li>
					))}
				</ul>
			</div>
		)
	}
	return null
}

const HomeMetrics: React.FC<HomeMetricsProps> = ({ analysis }) => {
	const { file_years, file_types, file_types_by_year, size_categories, total_files, total_size } = analysis

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
	const avgFileSize = total_files > 0 ? total_size / total_files : 0

	const largestCategory: [string, number] = Object.entries(size_categories).length > 0
		? Object.entries(size_categories).reduce((a, b) => a[1] > b[1] ? a : b)
		: ['N/A', 0]

	const mostCommonType: [string, number] = Object.entries(file_types).length > 0
		? Object.entries(file_types).reduce((a, b) => a[1] > b[1] ? a : b)
		: ['N/A', 0]

	// Storage efficiency metric (smaller files are more efficient)
	const storageEfficiency = total_files > 0
		? Math.min(100, Math.round(((size_categories.Tiny || 0) + (size_categories.Small || 0)) / total_files * 100))
		: 0

	// ============================================================================

	const renderKpiCards = () => (
		<div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2 lg:grid-cols-4">
			<KPI
				title="Total Files Loaded"
				value={total_files.toLocaleString()}
				icon="bi-images"
				subtitle={`${Object.keys(file_types).length} types`}
				variant="purple"
			/>
			<KPI
				title="Largest Size Group"
				value={largestCategory[0]}
				icon="bi-box-fill"
				subtitle={`${largestCategory[1].toLocaleString()} files`}
				secondaryText={`${Math.round(largestCategory[1] / total_files * 100)}%`}
				variant="green"
			/>
			<KPI
				title="Most Common Type"
				value={mostCommonType[0]}
				icon="bi-trophy-fill"
				subtitle={`${mostCommonType[1].toLocaleString()} files`}
				secondaryText={`${Math.round(mostCommonType[1] / total_files * 100)}%`}
				variant="blue"
			/>
			<KPI
				title="Total Storage Used"
				value={formatBytes(total_size)}
				icon="bi-floppy"
				subtitle={`${formatBytes(avgFileSize)} avg`}
				variant="red"
			/>
		</div>
	)


	const renderTimelineChart = () => (
		<div className="card bg-linear-to-br from-blue-900/50 to-blue-950/50 border border-blue-800/30 shadow-lg">
			<div className="card-body text-white">
				<div className="mb-3">
					<h5 className="card-title mb-1">Files Over Time by Type</h5>
					<p className="text-gray-400 text-sm mb-0">Distribution across top file types</p>
				</div>
				<ResponsiveContainer width="100%" height={280}>
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
						<Tooltip content={<CustomTooltip />} />
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
				</ResponsiveContainer>
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

		const renderMiniPieChart = (data: Array<{ name: string; value: number; color: string }>, title: string, percentage: number, subtitle: string) => (
			<div className="col-span-1">
				<div className="card bg-linear-to-br from-blue-900/50 to-blue-950/50 border border-blue-800/30 shadow-lg h-full">
					<div className="card-body text-center p-3">
						<h6 className="text-white mb-2" style={{ fontSize: '0.85rem' }}>{title}</h6>
						<div className="relative" style={{ height: '120px' }}>
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
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
							</ResponsiveContainer>
							<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
								<h4 className="mb-0 font-bold text-white" style={{ fontSize: '1.5rem' }}>{percentage}%</h4>
							</div>
						</div>
						<p className="text-gray-400 text-sm mb-0 mt-2">{subtitle}</p>
					</div>
				</div>
			</div>
		)

		return (
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

	const renderFileTypeChart = () => (
		<div className="col-span-1 lg:col-span-1">
			<div className="card bg-linear-to-br from-blue-900/50 to-blue-950/50 border border-blue-800/30 shadow-lg h-full">
				<div className="card-body text-white">
					<div className="mb-3">
						<h5 className="card-title mb-1">File Type Distribution</h5>
						<p className="text-gray-400 text-sm mb-0">Top file types</p>
					</div>
					<ResponsiveContainer width="100%" height={220}>
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
							<Tooltip content={<CustomTooltip />} />
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
					</ResponsiveContainer>
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

	const renderSizeCategoriesChart = () => (
		<div className="col-span-1 lg:col-span-1">
			<div className="card bg-linear-to-br from-blue-900/50 to-blue-950/50 border border-blue-800/30 shadow-lg h-full">
				<div className="card-body text-white">
					<div className="mb-3">
						<h5 className="card-title mb-1">Size Categories</h5>
						<p className="text-gray-400 text-sm mb-0">Files by size range</p>
					</div>
					<ResponsiveContainer width="100%" height={220}>
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
							<Tooltip content={<CustomTooltip />} />
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
					</ResponsiveContainer>
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

	// ============================================================================

	return (
		<div className="mb-4">
			{renderKpiCards()}

			{/* Charts Grid */}
			<div className="grid grid-cols-1 gap-4 mb-4 lg:grid-cols-3">
				<div className="lg:col-span-2">
					{renderTimelineChart()}
				</div>
				<div className="lg:col-span-1">
					{renderMetricsPieCharts()}
				</div>
			</div>

			{/* Bottom Charts */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				{renderFileTypeChart()}
				{renderSizeCategoriesChart()}
			</div>
		</div>
	)
}

export default HomeMetrics
