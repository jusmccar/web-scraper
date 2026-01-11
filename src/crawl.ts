export function normalizeURL(urlString: string): string {
	const url = new URL(urlString);
	const host = url.hostname;
	let path = url.pathname;

	if (path.endsWith("/")) {
		path = path.slice(0, -1);
	}

	return `${host}${path}`;
}