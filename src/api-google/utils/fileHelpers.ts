import { IMediaFile } from "../../App.props";

/**
 * Determines if the file is a video.
 */
export const isVideo = (item: IMediaFile): boolean => {
	return item.mimeType?.startsWith('video/') ?? false;
};

/**
 * Determines if the file is an image (excluding GIFs).
 */
export const isImage = (item: IMediaFile): boolean => {
	return (item.mimeType?.startsWith('image/') && !item.mimeType?.startsWith('image/gif')) ?? false;
};

/**
 * Determines if the file is a GIF.
 */
export const isGif = (item: IMediaFile): boolean => {
	return item.mimeType?.startsWith('image/gif') ?? false;
};

/**
 * Determines if the file is a media file (image, GIF, or video).
 */
export const isMedia = (item: IMediaFile): boolean => {
	return isVideo(item) || isImage(item) || isGif(item);
};

/**
 * Determines if the file is a folder.
 */
export const isFolder = (item: IMediaFile): boolean => {
	return item.mimeType === 'application/vnd.google-apps.folder';
};
