var GiphyAPI = {
	api_key: "dc6zaTOxFJmzC",
	default_url: "http://api.giphy.com/v1/gifs/",
	page_size: 5,
	genericAjax: function (url, cb) {
		"use strict";
		$.ajax({
			url: url,
			cache: false
		}).done(function (data) {
			if (cb) { cb(data); }
		}).fail(function (xhr, status, err) {
			if (cb) { cb(false, err); }
		});
	},
	search: function (text, offset, callback) {
		"use strict";
		var offsetCalc = offset * this.page_size,
			url = this.default_url + "search?q=" + encodeURIComponent(text) + "&limit=" + this.page_size + "&offset=" + offsetCalc + "&api_key=" + this.api_key;
		this.genericAjax(url, callback);
	},
	random: function (tag, callback) {
		"use strict";
		var url = this.default_url + "random?api_key=" + this.api_key;
		if (tag) {
			url += "&tag=" + encodeURIComponent(tag);
		}
		this.genericAjax(url, callback);
	},
	trending: function (offset, callback) {
		"use strict";
		var offsetCalc = offset * this.page_size,
			url = this.default_url + "trending?limit=" + this.page_size + "&offset=" + offsetCalc + "&api_key=" + this.api_key;
		this.genericAjax(url, callback);
	}
};