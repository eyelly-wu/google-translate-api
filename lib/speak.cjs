'use strict';
const { DEFAULT_OPTIONS, TRANSLATE_PATH } = require('./defaults.cjs');
const { getCode } = require('./languages.cjs');

module.exports = function (input, options) {
	options = {...DEFAULT_OPTIONS, ...options};
	// jQ1olc - is the specific id for spoken requests
	const rpcids = 'jQ1olc';
	const queryParams = new URLSearchParams({
		'rpcids': rpcids,
		'source-path': '/',
		'f.sid': '',
		'bl': '',
		'hl': 'en-US',
		'soc-app': 1,
		'soc-platform': 1,
		'soc-device': 1,
		'_reqid': Math.floor(1000 + (Math.random() * 9000)),
		'rt': 'c'
	});
	const url = TRANSLATE_PATH + options.tld + '/_/TranslateWebserverUi/data/batchexecute?' + queryParams.toString();

	const requestOptions = {...options.requestOptions, ...DEFAULT_OPTIONS.requestOptions};
	requestOptions.method = 'POST';
	requestOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
	const sourceArray = Array.isArray(input) ? input : (typeof input === 'object' ? Object.values(input) : [input]);
	const freq = [];
	for (let i = 0; i < sourceArray.length; i++) {
		const text = sourceArray[i].text ?? sourceArray[i];

		const forceTo = sourceArray[i].forceTo ?? options.forceTo;
		const to = sourceArray[i].to ?? options.to;
		const toIso = forceTo ? to : getCode(to);
		if (toIso === null) {
			return new Promise(() => {
				throw new Error(`To language ${to} unsupported, bypass this with setting forceTo to true if you're certain the iso is correct`, {cause: {options: {to}}});
			});
		}

		// i (converted to base 36 to minimize request length) is used as a unique indentifier to order responses
		const freqPart = [rpcids, JSON.stringify([text, toIso, true]), null, i.toString(36)];
		freq.push(freqPart);
	}

	requestOptions.body = 'f.req=' + encodeURIComponent(JSON.stringify([freq])) + '&';

	return options.requestFunction(url, requestOptions).then( async res => {
		if (!res.ok) {
			throw new Error(res.statusText, {cause: {options, url, response: res}});
		}
		res = await res.text();
		res = res.slice(6);

		let finalResult = Array.isArray(input) ? [] : (typeof input === 'object' ? {} : undefined);

		for (let chunk of res.split('\n')) {
			if (chunk[0] !== '[' || chunk[3] === 'e') {
				continue;
			}
			chunk = JSON.parse(chunk);
			for (let translation of chunk) {
				if (translation[0] !== 'wrb.fr') {
					continue;
				}
				const id = parseInt(translation[translation.length - 1], 36);
				const result = JSON.parse(translation[2])[0];

				if (Array.isArray(input)) {
					finalResult[id] = result;
				} else if (typeof input === 'object') {
					finalResult[Object.keys(input)[id]] = result;
				} else {
					finalResult = result;
				}
			}
		}
		return finalResult;
	});
};