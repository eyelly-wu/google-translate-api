'use strict';
const { DEFAULT_OPTIONS } = require('./defaults.cjs');
const { getBatchInitData, batchTranslate } = require('./translation/batchTranslate.cjs');
const singleTranslate = require('./translation/singleTranslate.cjs');

module.exports = class {
	options;
	initData;
	constructor(options) {
		this.options = {...DEFAULT_OPTIONS, ...options};
	}

	async #runBatch(input, options) {
		if (typeof this.initData === 'undefined') {
			this.initData = await getBatchInitData(options);
		}
		return batchTranslate(input, options, this.initData);
	}

	translate(input, options) {
		options = {...this.options, ...options};
		if (typeof input === 'string'  && !options.forceBatch) {
			return singleTranslate(input, options).catch(e => {
				if (options.fallbackBatch) {
					return this.#runBatch(input, options);
				}
				throw e;
			});
		}
		return this.#runBatch(input, options);
	}
};