export const get = async (url, params) => {
	const res = await fetch(url + '?' + new URLSearchParams(params));
	const { data } = await res.json();
	return data;
};

export const post = async (url, params) => {
	const res = await fetch(url, {
		body: JSON.stringify(params),
		method: 'POST',
		headers: {
			'Content-type': 'application/json; charset=UTF-8',
		},
	});
	const { data } = await res.json();
	return data;
};

export const patch = async (url, params) => {
	const res = await fetch(url, {
		method: 'PATCH',
		body: JSON.stringify(params),
		headers: {
			'Content-type': 'application/json; charset=UTF-8',
		},
	});
	const { data } = await res.json();
	return data;
};

export const remove = async (url) => {
	const res = await fetch(url, {
		method: 'DELETE',
		headers: {
			'Content-type': 'application/json; charset=UTF-8',
		},
	});

	const { data } = await res.json();
	return data;
};
