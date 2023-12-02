import { IGapiFile } from '../App.props'

export type SortKey = keyof IGapiFile
export type SortDirection = 'ascending' | 'descending'

export interface SortConfig {
	key: SortKey | null; // Include 'null' to handle no sorting case
	direction: SortDirection;
}
