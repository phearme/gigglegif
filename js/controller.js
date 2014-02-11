/*jslint browser:true*/
/*global $, GiphyAPI*/
var app = angular.module("app", ["ngTouch", "ngAnimate"]);
app.controller("ctrl", function ctrl($scope, $window, $document, $timeout) {
	"use strict";
	$scope.searchResults = [];
	$scope.trendingResults = [];
	$scope.retryFrequ = 7000;
	$scope.tvPause = false;

	$scope.safeApply = function (fn) {
		var phase = this.$root.$$phase;
		if (phase && (phase.toString() === "$apply" || phase.toString() === "$digest")) {
			if (typeof fn === "function") { fn(); }
		} else {
			this.$apply(fn);
		}
	};

	$scope.goBack = function () {
		$scope.selectedScreen = undefined;
		$scope.showUpArrow = false;
	};

	$scope.searchGiphy = function (reset) {
		if (reset) {
			$scope.searchResults = [];
			$scope.searchOffset = 0;
		}
		if ($scope.searchValue !== "") {
			GiphyAPI.search($scope.searchValue, $scope.searchOffset, function (data, err) {
				console.log(data);
				if (data && data.data && data.data.length > 0) {
					$scope.searchResults = $scope.searchResults.concat(data.data);
					$scope.safeApply();
				} else if (!data) {
					$timeout($scope.searchGiphy, $scope.retryFrequ, false);
				}
			});
		}
	};

	$scope.getTrendingGiphy = function (reset) {
		if (reset) {
			$scope.selectedScreen = {id: "top", label: "What's Hot"};
			$scope.trendingResults = [];
			$scope.trendingOffset = 0;
		}
		GiphyAPI.trending($scope.trendingOffset, function (data, err) {
			console.log(data);
			if (data && data.data && data.data.length > 0) {
				$scope.trendingResults = $scope.trendingResults.concat(data.data);
				$scope.safeApply();
			} else if (!data) {
				$timeout($scope.getTrendingGiphy, $scope.retryFrequ, false);
			}
		});
	};

	$scope.startTV = function (reset) {
		if (reset) {
			$scope.selectedScreen = {id: "tv", label: "Giggle GIF TV"};
			$scope.tvGif = undefined;
			$scope.tvPause = false;
		}
		GiphyAPI.random(undefined, function (data, err) {
			console.log(data);
			if (data && data.data && !$scope.tvPause) {
				$scope.tvGif = data.data;
				$scope.safeApply();
			}
			if ($scope.selectedScreen && $scope.selectedScreen.id === "tv") {
				$timeout($scope.startTV, $scope.retryFrequ, false);
			}
		});
	};

	$scope.hideImgMenuLayers = function (img) {
		var i;
		if (img) {
			img.showMenuLayer = false;
		} else {
			for (i in $scope.trendingResults) {
				if ($scope.trendingResults.hasOwnProperty(i)) {
					$scope.trendingResults[i].showMenuLayer = false;
				}
			}
			for (i in $scope.searchResults) {
				if ($scope.searchResults.hasOwnProperty(i)) {
					$scope.searchResults[i].showMenuLayer = false;
				}
			}
		}
	};

	$window.addEventListener("scroll", function () {
		if ($scope.selectedScreen) {
			$scope.hideImgMenuLayers();
			if ($($window).scrollTop() === 0) {
				$scope.showUpArrow = false;
			} else if ($($window).scrollTop() > 100) {
				$scope.showUpArrow = true;
			}
			if ($($window).scrollTop() >= $document.height() - $($window).height() - 80) {
				switch ($scope.selectedScreen.id) {
				case "search":
					$scope.searchOffset += 1;
					$scope.searchGiphy();
					break;
				case "top":
					$scope.trendingOffset += 1;
					$scope.getTrendingGiphy();
					break;
				}
			}
			$scope.safeApply();
		}
	});

	$scope.linkto = function (link) {
		window.open(link, "_system");
	};

	$scope.shareApp = function () {
		if (window.plugins && window.plugins.socialsharing) {
			window.plugins.socialsharing.share(null, null, null, "https://play.google.com/store/apps/details?id=com.phonegap.gigglegif");
		}
	};

	$scope.shareImg = function (img) {
		if (window.plugins && window.plugins.socialsharing) {
			window.plugins.socialsharing.share("Shared with Giggle GIF", null, img.images.fixed_height.url, img.url);
		}
		$scope.hideImgMenuLayers(img);
	};

	document.addEventListener("backbutton", function () {
		$scope.safeApply(function () { $scope.goBack(); });
	}, false);

	document.addEventListener("menubutton", function () {
		$scope.safeApply(function () { $scope.goBack(); });
	});

	document.addEventListener("searchbutton", function () {
		$scope.safeApply(function () { $scope.selectedScreen = {id: "search", label: "Search"}; });
	});

});
app.directive("scrollUpOnClick", function () {
	"use strict";
	return function (scope, $elm) {
		$elm.on("click", function () {
			$("body").animate({scrollTop: 0});
		});
	};
});
app.directive("animateOnVisible", function () {
	"use strict";
	function isElementInViewport(el) {
		var rect = el.getBoundingClientRect();
		return (
			rect.top >= 0 &&
			rect.left >= 0 &&
			rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
			rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
		);
	}

	function setSrcIfVisible(imgEl, dataObj) {
		//console.log("setSrcIfVisible", isElementInViewport(imgEl), dataObj, typeof dataObj);
		if (isElementInViewport(imgEl) && imgEl.src !== dataObj.images.original.url) {
			imgEl.src = dataObj.images.original.url;
		} else if (!isElementInViewport(imgEl) && imgEl.src !== dataObj.images.fixed_width_still.url) {
			imgEl.src = dataObj.images.fixed_width_still.url;
		}
	}

	return function (scope, element, attrs) {
		var img = element[0],
			gifObj = JSON.parse(attrs.animateOnVisible);
		img.onload = function () {
			setSrcIfVisible(img, gifObj);
		};
		window.addEventListener("scroll", function () {
			setSrcIfVisible(img, gifObj);
		});
		img.src = gifObj.images.fixed_width_still.url;
	};
});

document.addEventListener("deviceready", function () {
	"use strict";

	angular.bootstrap(document, ["app"]);

}, false);
