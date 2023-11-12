// FIXES import { ItemProps } from 'react-photoswipe-gallery'
export interface FixedItemProps {
	/**
	 * Url of original image
	 */
	original: string;
	/**
	 * Url of thumbnail
	 */
	thumbnail: string;
	/**
	 * Width of original image
	 */
	width: string | number;
	/**
	 * Height of original image
	 */
	height: string | number;
	/**
	 * Alternate text for original image
	 */
	alt?: string;
	/**
	 * Text for caption
	 */
	caption?: string;
	/**
	 * Custom slide content
	 */
	content?: JSX.Element;
	/**
	 * Item ID, for hash navigation
	 */
	id?: string | number;
	/**
	 * Thumbnail is cropped
	 */
	cropped?: boolean;
}
