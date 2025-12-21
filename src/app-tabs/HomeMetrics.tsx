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
import '../css/HomeMetrics.css'

interface HomeMetricsProps {
	analysis: IFileAnalysis
}

// Bootstrap color palette
const COLORS = ['#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#dc3545', '#fd7e14', '#ffc107', '#198754', '#20c997', '#0dcaf0']

// Custom tooltip style
interface TooltipProps {
	active?: boolean
	payload?: Array<{ name: string; value: number; color: string }>
	label?: string
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
	if (active && payload && payload.length) {
		return (
			<div className="card text-white border-secondary shadow-lg" style={{ opacity: 0.98, minWidth: '200px', backgroundColor: '#1a1d23' }}>
				<div className="card-header text-white py-2" style={{ backgroundColor: '#2d3139' }}>
					<strong className="small">{label}</strong>
				</div>
				<ul className="list-group list-group-flush">
					{payload.map((entry, index) => (
						<li key={index} className="list-group-item text-white border-secondary py-2 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#1a1d23' }}>
							<span className="small">{entry.name}</span>
							<span className="badge rounded-pill" style={{ backgroundColor: entry.color, color: '#fff' }}>
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
		<div className="row g-3 mb-4">
			<div className="col-12 col-sm-6 col-lg-3" data-description="Total Files">
				<div className="card text-white h-100 kpi-card kpi-card-purple">
					<div className="kpi-card-icon-bg">
						<i className="bi bi-images"></i>
					</div>
					<div className="card-body kpi-card-body">
						<div className="d-flex align-items-center mb-2">
							<div className="rounded-circle d-flex align-items-center justify-content-center me-2 kpi-icon-circle">
								<i className="bi bi-images kpi-icon"></i>
							</div>
							<h6 className="mb-0 opacity-90 small">Total Files Loaded</h6>
						</div>
						<h2 className="mb-1 fw-bold kpi-title">{total_files.toLocaleString()}</h2>
						<div className="d-flex justify-content-between align-items-center">
							<small className="kpi-subtitle">{Object.keys(file_types).length} types</small>
							<small className="kpi-subtitle">↗ 100%</small>
						</div>
					</div>
				</div>
			</div>
			<div className="col-12 col-sm-6 col-lg-3" data-description="Largest file size category">
				<div className="card text-white h-100 kpi-card kpi-card-green">
					<div className="kpi-card-icon-bg">
						<i className="bi bi-box-fill"></i>
					</div>
					<div className="card-body kpi-card-body">
						<div className="d-flex align-items-center mb-2">
							<div className="rounded-circle d-flex align-items-center justify-content-center me-2 kpi-icon-circle">
								<i className="bi bi-box-fill kpi-icon"></i>
							</div>
							<h6 className="mb-0 opacity-90 small">Largest Size Group</h6>
						</div>
						<h2 className="mb-1 fw-bold kpi-title">{largestCategory[0]}</h2>
						<div className="d-flex justify-content-between align-items-center">
							<small className="kpi-subtitle">{largestCategory[1].toLocaleString()} files</small>
							<small className="kpi-subtitle">{Math.round(largestCategory[1] / total_files * 100)}%</small>
						</div>
					</div>
				</div>
			</div>
			<div className="col-12 col-sm-6 col-lg-3" data-description="Most Common File Type">
				<div className="card text-white h-100 kpi-card kpi-card-blue">
					<div className="kpi-card-icon-bg">
						<i className="bi bi-trophy-fill"></i>
					</div>
					<div className="card-body kpi-card-body">
						<div className="d-flex align-items-center mb-2">
							<div className="rounded-circle d-flex align-items-center justify-content-center me-2 kpi-icon-circle">
								<i className="bi bi-trophy-fill kpi-icon"></i>
							</div>
							<h6 className="mb-0 opacity-90 small">Most Common Type</h6>
						</div>
						<h2 className="mb-1 fw-bold kpi-title">{mostCommonType[0]}</h2>
						<div className="d-flex justify-content-between align-items-center">
							<small className="kpi-subtitle">{mostCommonType[1].toLocaleString()} files</small>
							<small className="kpi-subtitle">{Math.round(mostCommonType[1] / total_files * 100)}%</small>
						</div>
					</div>
				</div>
			</div>
			<div className="col-12 col-sm-6 col-lg-3" data-description="Total Storage">
				<div className="card text-white h-100 kpi-card kpi-card-red">
					<div className="kpi-card-icon-bg">
						<i className="bi bi-hdd-fill"></i>
					</div>
					<div className="card-body kpi-card-body">
						<div className="d-flex align-items-center mb-2">
							<div className="rounded-circle d-flex align-items-center justify-content-center me-2 kpi-icon-circle">
								<i className="bi bi-hdd-fill kpi-icon"></i>
							</div>
							<h6 className="mb-0 opacity-90 small">Total Storage Used</h6>
						</div>
						<h2 className="mb-1 fw-bold kpi-title">{formatBytes(total_size)}</h2>
						<div className="d-flex justify-content-between align-items-center">
							<small className="kpi-subtitle">{formatBytes(avgFileSize)} avg</small>
							<small className="kpi-subtitle">↗ 100%</small>
						</div>
					</div>
				</div>
			</div>
		</div>
	)

	const renderTimelineChart = () => (
		<div className="card shadow-sm border-0 h-100 chart-card-dark">
			<div className="card-body text-white">
				<div className="mb-3">
					<h5 className="card-title mb-1">Files Over Time by Type</h5>
					<p className="text-white-50 small mb-0">Distribution across top file types</p>
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
				<div className="d-flex flex-wrap gap-3 mt-3 justify-content-center">
					{[...topTypes].reverse().map((type, reversedIndex) => {
						const index = topTypes.length - 1 - reversedIndex
						return (
							<div key={type} className="d-flex align-items-center gap-2">
								<div
									className="rounded-circle chart-legend-dot"
									style={{
										backgroundColor: COLORS[index % COLORS.length],
										width: '14px',
										height: '14px'
									}}
								/>
								<small className="text-white-50">{type}</small>
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
			<div className="col-6">
				<div className="card shadow-sm border-0 h-100 chart-card-dark">
					<div className="card-body text-center p-3">
						<h6 className="text-white mb-2" style={{ fontSize: '0.85rem' }}>{title}</h6>
						<div className="position-relative" style={{ height: '120px' }}>
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
							<div className="position-absolute top-50 start-50 translate-middle text-center">
								<h4 className="mb-0 fw-bold text-white" style={{ fontSize: '1.5rem' }}>{percentage}%</h4>
							</div>
						</div>
						<p className="text-white-50 small mb-0 mt-2">{subtitle}</p>
					</div>
				</div>
			</div>
		)

		return (
			<div className="row g-3">
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
		<div className="col-12 col-lg-6">
			<div className="card shadow-sm border-0 h-100 chart-card-dark">
				<div className="card-body text-white">
					<div className="mb-3">
						<h5 className="card-title mb-1">File Type Distribution</h5>
						<p className="text-white-50 small mb-0">Top file types</p>
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
					<div className="row g-3 justify-content-center">
						{fileTypeData.slice(0, 6).map((item, index) => (
							<div key={index} className="col-auto">
								<div className="file-type-badge" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
									<small className="text-white d-block fw-semibold file-type-badge-label">{item.name}</small>
									<h5 className="fw-light mb-0 file-type-badge-value">{item.value.toLocaleString()}</h5>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)

	const renderSizeCategoriesChart = () => (
		<div className="col-12 col-lg-6">
			<div className="card shadow-sm border-0 h-100 chart-card-dark">
				<div className="card-body text-white">
					<div className="mb-3">
						<h5 className="card-title mb-1">Size Categories</h5>
						<p className="text-white-50 small mb-0">Files by size range</p>
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
					<div className="row g-3 justify-content-center">
						{sizeCategoryData.map((item, index) => (
							<div key={index} className="col-auto">
								<div className="file-type-badge" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
									<small className="text-white d-block fw-semibold file-type-badge-label">{item.name}</small>
									<h5 className="fw-light mb-0 file-type-badge-value">{item.files.toLocaleString()}</h5>
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
			<div className="row g-4 mb-4">
				<div className="col-12 col-lg-8">
					{renderTimelineChart()}
				</div>
				<div className="col-12 col-lg-4">
					{renderMetricsPieCharts()}
				</div>
			</div>

			{/* Bottom Charts */}
			<div className="row g-4">
				{renderFileTypeChart()}
				{renderSizeCategoriesChart()}
			</div>
		</div>
	)
}

export default HomeMetrics
