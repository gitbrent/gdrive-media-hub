import React from 'react'
import { OPT_SORTBY, OPT_SORTDIR } from '../App.props'

interface Props {
	optSortBy: OPT_SORTBY
	optSortDir: OPT_SORTDIR
	optIsShowCap: boolean
	setOptSortBy: (opt: OPT_SORTBY) => void
	setOptSortDir: (opt: OPT_SORTDIR) => void
	setOptIsShowCap: (opt: boolean) => void
}

const Settings: React.FC<Props> = ({ optSortBy, optSortDir, optIsShowCap, setOptSortBy, setOptSortDir, setOptIsShowCap }) => {
	function renderOptionsImageGrid(): JSX.Element {
		return (<section>
			<h5>Image Grid Options</h5>
			<div className='row'>
				<div className='col' data-desc="sort-by">
					<div className="bg-secondary p-4 my-4">
						<h3>Sort By</h3>
						<div className="btn-group" role="group">
							<button
								className={`btn ${optSortBy === OPT_SORTBY.modDate ? 'btn-primary' : 'btn-secondary'}`}
								onClick={() => setOptSortBy(OPT_SORTBY.modDate)}
							>
								{OPT_SORTBY.modDate}
							</button>
							<button
								className={`btn ${optSortBy === OPT_SORTBY.filName ? 'btn-primary' : 'btn-secondary'}`}
								onClick={() => setOptSortBy(OPT_SORTBY.filName)}
							>
								{OPT_SORTBY.filName}
							</button>
						</div>
					</div>
				</div>
				<div className='col' data-desc="sort-dir">
					<div className="bg-secondary p-4 my-4">
						<h3>Sort Direction</h3>
						<div className="btn-group" role="group">
							<button
								className={`btn ${optSortDir === OPT_SORTDIR.asce ? 'btn-primary' : 'btn-secondary'}`}
								onClick={() => setOptSortDir(OPT_SORTDIR.asce)}
							>
								{OPT_SORTDIR.asce}
							</button>
							<button
								className={`btn ${optSortDir === OPT_SORTDIR.desc ? 'btn-primary' : 'btn-secondary'}`}
								onClick={() => setOptSortDir(OPT_SORTDIR.desc)}
							>
								{OPT_SORTDIR.desc}
							</button>
						</div>
					</div>
				</div>
				<div className='col' data-desc="show-cap">
					<div className="bg-secondary p-4 my-4">
						<h3>Show Caption</h3>
						<div className="btn-group" role="group">
							<button className={`btn ${optIsShowCap === true ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setOptIsShowCap(false)}>
								Yes
							</button>
							<button className={`btn ${optIsShowCap === false ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setOptIsShowCap(false)} >
								No
							</button>
						</div>
					</div>
				</div>
			</div>
		</section>)
	}

	function renderOptionsSlideShow(): JSX.Element {
		return (<section>
			<h5 className='mt-4'>Slide Show Options</h5>
			<div className='row'>
				<div className='col'>
					<div className="bg-secondary p-4 my-4">
						<h3>Sort By</h3>
						TODO:
					</div>
				</div>
			</div>
		</section>)
	}

	return (
		<>
			<nav className="navbar sticky-top bg-dark">
				<div className="container-fluid">
					<div className="row align-items-center">
						<div className='col-auto d-none d-lg-block'>
							<a className="navbar-brand text-white"><i className="bi-sliders me-2" />Settings</a>
						</div>
					</div>
				</div>
			</nav>
			<section className='p-4'>
				{renderOptionsImageGrid()}
				{renderOptionsSlideShow()}
			</section>
		</>
	)
}

export default Settings
