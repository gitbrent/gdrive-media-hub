import { useEffect } from 'react'

const useCalcMaxGridItems = (setPagingSize: (size: number) => void) => {
	const calculatePageSize = () => {
		// A:
		const galleryContainer = document.getElementById('gallery-container')
		const figureElement = galleryContainer ? galleryContainer.querySelector('figure') : null
		const figureStyles = figureElement ? window.getComputedStyle(figureElement) : null
		const figureMargin = figureStyles ? parseFloat(figureStyles.marginTop) : 8
		const itemSize = figureElement ? figureElement.offsetHeight + figureMargin * 2 : 216 // 200 + 8 + 8
		// B:
		let navbarHeight = 0
		const navbars = document.querySelectorAll('.navbar')
		navbars.forEach((navbar) => (navbarHeight += navbar.clientHeight))
		// C:
		const containerWidth = galleryContainer ? galleryContainer.offsetWidth : window.innerWidth
		const containerHeight = window.innerHeight - navbarHeight
		// D:
		const itemsPerRow = Math.floor(containerWidth / itemSize)
		const rowsPerPage = Math.round(containerHeight / itemSize)
		// E:
		const newPagingSize = itemsPerRow * rowsPerPage
		// LAST
		setPagingSize(newPagingSize)
	}

	useEffect(() => {
		window.addEventListener('resize', calculatePageSize)
		calculatePageSize() // Initial calculation

		return () => window.removeEventListener('resize', calculatePageSize)
	}, [])
}

export default useCalcMaxGridItems
