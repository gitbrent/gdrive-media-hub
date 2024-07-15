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
		return (
			<section className="bg-black">
				<h3>Image Grid Options</h3>
				<div className="row mt-4">
					<div className="col" data-desc="sort-by">
						<div className="card">
							<div className="card-header">
								<h5 className="card-title">Sort By</h5>
							</div>
							<div className='card-body py-4 px-3'>
								<div className="btn-group w-100" role="group">
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
					</div>
					<div className="col" data-desc="sort-dir">
						<div className="card">
							<div className='card-header'>
								<h5 className="card-title">Sort Direction</h5>
							</div>
							<div className='card-body py-4 px-3'>
								<div className="btn-group w-100" role="group">
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
					</div>
					<div className='col' data-desc="show-cap">
						<div className="card">
							<div className='card-header'>
								<h5 className="card-title">Show Caption</h5>
							</div>
							<div className='card-body py-4 px-3'>
								<div className="btn-group w-100" role="group">
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
				</div>
			</section>
		)
	}

	function renderOptionsSlideShow(): JSX.Element {
		return (
			<section className="mt-4">
				<h3>Slide Show Options</h3>
				<div className="row row-cols-3 mt-4">
					<div className="col">
						<div className="card">
							<div className="card-header">
								<h5 className="card-title">Sort By</h5>
							</div>
							<div className="card-body bg-black py-4 px-3">
								TODO:
							</div>
						</div>
					</div>
				</div>
			</section>
		)
	}

	return (
		<section className="p-4">
			{renderOptionsImageGrid()}
			{renderOptionsSlideShow()}
		</section>
	)
}

export default Settings
