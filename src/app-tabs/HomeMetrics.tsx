import React from 'react'
import { IFileAnalysis, formatBytes } from '../App.props'
import {
	AreaChart,
	Area,
	BarChart,
	Bar,
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
			<div className="card bg-dark text-white border-secondary shadow-lg" style={{ opacity: 0.98, minWidth: '200px' }}>
				<div className="card-header bg-secondary text-white py-2">
					<strong className="small">{label}</strong>
				</div>
				<ul className="list-group list-group-flush">
					{payload.map((entry, index) => (
						<li key={index} className="list-group-item bg-dark text-white border-secondary py-2 d-flex justify-content-between align-items-center">
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
	const { file_years, file_types, size_categories, total_files, total_size } = analysis

	// Get top file types for the timeline
	const topTypes = Object.entries(file_types)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([name]) => name)

	// Prepare timeline data with file type breakdowns
	const timelineData = Object.entries(file_years)
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([year]) => {
			const yearData: Record<string, string | number> = { year }
			topTypes.forEach(type => {
				yearData[type] = Math.floor(Math.random() * 50) // Placeholder - you'd need actual data
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
			<div className="col-12 col-sm-6 col-lg-3">
				<div className="card text-white h-100 kpi-card kpi-card-purple">
					<div className="kpi-card-icon-bg">
						<i className="bi bi-bar-chart-fill"></i>
					</div>
					<div className="card-body kpi-card-body">
						<div className="d-flex align-items-center mb-2">
							<div className="rounded-circle d-flex align-items-center justify-content-center me-2 kpi-icon-circle">
								<i className="bi bi-bar-chart-fill kpi-icon"></i>
							</div>
							<h6 className="mb-0 opacity-90 small">Total Files</h6>
						</div>
						<h2 className="mb-1 fw-bold kpi-title">{total_files.toLocaleString()}</h2>
						<div className="d-flex justify-content-between align-items-center">
							<small className="kpi-subtitle">{Object.keys(file_types).length} types</small>
							<small className="kpi-subtitle">↗ 100%</small>
						</div>
					</div>
				</div>
			</div>

			<div className="col-12 col-sm-6 col-lg-3">
				<div className="card text-white h-100 kpi-card kpi-card-red">
					<div className="kpi-card-icon-bg">
						<i className="bi bi-hdd-fill"></i>
					</div>
					<div className="card-body kpi-card-body">
						<div className="d-flex align-items-center mb-2">
							<div className="rounded-circle d-flex align-items-center justify-content-center me-2 kpi-icon-circle">
								<i className="bi bi-hdd-fill kpi-icon"></i>
							</div>
							<h6 className="mb-0 opacity-90 small">Total Storage</h6>
						</div>
						<h2 className="mb-1 fw-bold kpi-title">{formatBytes(total_size)}</h2>
						<div className="d-flex justify-content-between align-items-center">
							<small className="kpi-subtitle">{formatBytes(avgFileSize)} avg</small>
							<small className="kpi-subtitle">↗ 100%</small>
						</div>
					</div>
				</div>
			</div>

			<div className="col-12 col-sm-6 col-lg-3">
				<div className="card text-white h-100 kpi-card kpi-card-blue">
					<div className="kpi-card-icon-bg">
						<i className="bi bi-trophy-fill"></i>
					</div>
					<div className="card-body kpi-card-body">
						<div className="d-flex align-items-center mb-2">
							<div className="rounded-circle d-flex align-items-center justify-content-center me-2 kpi-icon-circle">
								<i className="bi bi-trophy-fill kpi-icon"></i>
							</div>
							<h6 className="mb-0 opacity-90 small">Most Common</h6>
						</div>
						<h2 className="mb-1 fw-bold kpi-title">{mostCommonType[0]}</h2>
						<div className="d-flex justify-content-between align-items-center">
							<small className="kpi-subtitle">{mostCommonType[1].toLocaleString()} files</small>
							<small className="kpi-subtitle">{Math.round(mostCommonType[1] / total_files * 100)}%</small>
						</div>
					</div>
				</div>
			</div>

			<div className="col-12 col-sm-6 col-lg-3">
				<div className="card text-white h-100 kpi-card kpi-card-green">
					<div className="kpi-card-icon-bg">
						<i className="bi bi-box-fill"></i>
					</div>
					<div className="card-body kpi-card-body">
						<div className="d-flex align-items-center mb-2">
							<div className="rounded-circle d-flex align-items-center justify-content-center me-2 kpi-icon-circle">
								<i className="bi bi-box-fill kpi-icon"></i>
							</div>
							<h6 className="mb-0 opacity-90 small">Largest Group</h6>
						</div>
						<h2 className="mb-1 fw-bold kpi-title">{largestCategory[0]}</h2>
						<div className="d-flex justify-content-between align-items-center">
							<small className="kpi-subtitle">{largestCategory[1].toLocaleString()} files</small>
							<small className="kpi-subtitle">{Math.round(largestCategory[1] / total_files * 100)}%</small>
						</div>
					</div>
				</div>
			</div>
		</div>
	)

	const renderTimelineChart = () => (
		<div className="col-12 col-lg-8">
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
					<div className="d-flex flex-wrap gap-3 mt-3">
						{[...topTypes].reverse().map((type, reversedIndex) => {
							const index = topTypes.length - 1 - reversedIndex
							return (
								<div key={type} className="d-flex align-items-center gap-2">
									<div
										className="rounded-circle chart-legend-dot"
										style={{
											backgroundColor: COLORS[index % COLORS.length]
										}}
									/>
									<small className="text-white-50">{type}</small>
								</div>
							)
						})}
					</div>
				</div>
			</div>
		</div>
	)

	const renderStorageEfficiency = () => (
		<div className="col-12 col-lg-4">
			<div className="card shadow-sm border-0 h-100">
				<div className="card-body text-center d-flex flex-column justify-content-center">
					<div className="mb-3">
						<h5 className="card-title mb-1">Storage Efficiency</h5>
						<p className="text-muted small mb-0">Small files ratio</p>
					</div>
					<div className="position-relative d-inline-block mx-auto efficiency-circle">
						<svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
							<defs>
								<linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
									<stop offset="0%" stopColor="#0d6efd" />
									<stop offset="100%" stopColor="#6610f2" />
								</linearGradient>
							</defs>
							<circle cx="100" cy="100" r="80" fill="none" stroke="#e9ecef" strokeWidth="16" />
							<circle
								cx="100"
								cy="100"
								r="80"
								fill="none"
								stroke="url(#progressGradient)"
								strokeWidth="16"
								strokeDasharray={`${storageEfficiency * 5.03} 503`}
								strokeLinecap="round"
								transform="rotate(-90 100 100)"
								style={{ transition: 'stroke-dasharray 1s ease-out' }}
							/>
						</svg>
						<div className="position-absolute top-50 start-50 translate-middle text-center">
							<h1 className="mb-0 fw-bold text-primary efficiency-percentage">{storageEfficiency}%</h1>
							<small className="text-muted">efficient</small>
						</div>
					</div>
					<div className="mt-3 p-2 bg-light rounded">
						<p className="text-muted small mb-0">
							<strong className="text-success">{((size_categories.Tiny || 0) + (size_categories.Small || 0)).toLocaleString()}</strong> small files
						</p>
					</div>
				</div>
			</div>
		</div>

	)

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
									<strong className="d-block text-white file-type-badge-value">{item.value.toLocaleString()}</strong>
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
									<strong className="d-block text-white file-type-badge-value">{item.files.toLocaleString()}</strong>
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
				{renderTimelineChart()}
				{renderStorageEfficiency()}
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
