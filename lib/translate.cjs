'use strict';
const { DEFAULT_OPTIONS } = require('./defaults.cjs');
const { getBatchInitData, batchTranslate } = require('./translation/batchTranslate.cjs');
const singleTranslate = require('./translation/singleTranslate.cjs');

async function runBatch(input, options) {
	const initData = await getBatchInitData(options);
	return batchTranslate(input, options, initData);
}

module.exports = function (input, options) {
	options = {...DEFAULT_OPTIONS, ...options};
	if (typeof input === 'string'  && !options.forceBatch) {
		return singleTranslate(input, options).catch(e => {
			if (options.fallbackBatch) {
				return runBatch(input, options);
			}
			throw e;
		});
	}
	return runBatch(input, options);
};