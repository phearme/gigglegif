/*jslint browser: true*/
/*global console, $, GiphyAPI*/
var app = angular.module("app", ["ngTouch", "ngAnimate"]);
app.controller("ctrl", function ctrl($scope, $window, $document, $timeout) {
	"use strict";
	$scope.searchValue = "";
	$scope.searchResults = [];
	$scope.trendingResults = [];
	$scope.randomTags = [];
	$scope.retryFrequ = 7000;
	$scope.tvPause = false;
	$scope.loadingData = false;

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
		$scope.searchValue = "";
		$scope.getRandomTags(true);
	};

	$scope.getRandomTags = function (reset) {
		$scope.loadingData = true;
		var addDataToRandomTags = function (data, err) {
				var i, maxTags = 15;
				$scope.loadingData = false;
				if (data && data.data && data.data.tags && data.data.tags.length > 0) {
					for (i = 0; i < data.data.tags.length; i += 1) {
						if ($scope.randomTags.length < maxTags && $scope.randomTags.indexOf(data.data.tags[i]) === -1) {
							$scope.randomTags.push(data.data.tags[i]);
						}
					}
					$scope.safeApply();
					if ($scope.randomTags.length < maxTags) {
						$timeout($scope.getRandomTags, 1, false);
					}
				}
			};
		if (reset) {
			$scope.randomTags = [];
		}
		GiphyAPI.random(undefined, addDataToRandomTags);
	};

	$scope.onTagClick = function (tag) {
		$scope.searchValue = tag;
		$scope.selectedScreen = {id: "search", label: "Search"};
		$scope.searchGiphy(true);
	};

	$scope.searchGiphy = function (reset) {
		$scope.loadingData = true;
		if (reset) {
			$scope.searchResults = [];
			$scope.searchOffset = 0;
		}
		if ($scope.searchValue !== "") {
			GiphyAPI.search($scope.searchValue, $scope.searchOffset, function (data, err) {
				console.log(data);
				$scope.loadingData = false;
				if (data && data.data && data.data.length > 0) {
					$scope.searchResults = $scope.searchResults.concat(data.data);
					$scope.safeApply();
				} else if (!data) {
					$timeout($scope.searchGiphy, $scope.retryFrequ, false);
				}
			});
		}
	};

	$scope.searchSubmit = function () {
		if ($scope.searchValue !== "") {
			$scope.selectedScreen = {id: "search", label: "Search"};
			$scope.searchGiphy(true);
		}
		return false;
	};

	$scope.getTrendingGiphy = function (reset) {
		$scope.loadingData = true;
		if (reset) {
			$scope.selectedScreen = {id: "top", label: "What's Hot"};
			$scope.trendingResults = [];
			$scope.trendingOffset = 0;
		}
		GiphyAPI.trending($scope.trendingOffset, function (data, err) {
			$scope.loadingData = false;
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
			if (img.url && img.images && img.images.fixed_height) {
				window.plugins.socialsharing.share("Shared with Giggle GIF", null, img.images.fixed_height.url, img.url);
			} else if (img.image_original_url && img.image_url) {
				window.plugins.socialsharing.share("Shared with Giggle GIF", null, img.image_original_url, img.image_url);
			}
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

	$scope.getRandomTags(true);
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
		var loadingElmHide;
		if (imgEl && imgEl.parentNode) {
			loadingElmHide = imgEl.parentNode.getElementsByClassName("loadingAnimHide")[0];
		}
		if (isElementInViewport(imgEl) && imgEl.src !== dataObj.images.original.url) {
			if (loadingElmHide) {
				loadingElmHide.className = "loadingAnim";
			}
			imgEl.src = dataObj.images.original.url;
		} else if (!isElementInViewport(imgEl) && imgEl.src !== dataObj.images.fixed_height_still.url) {
			imgEl.src = dataObj.images.fixed_height_still.url;
		}
	}

	return function (scope, element, attrs) {
		var img = element[0],
			gifObj = JSON.parse(attrs.animateOnVisible);
		img.onload = function () {
			if (img && img.parentNode) {
				var loadingElmVisible = img.parentNode.getElementsByClassName("loadingAnim")[0];
				if (loadingElmVisible) {
					loadingElmVisible.className = "loadingAnimHide";
				}
			}
			if (img.className !== "imgGif") {
				img.className = "imgGif";
			}
			setSrcIfVisible(img, gifObj);
		};
		window.addEventListener("scroll", function () {
			setSrcIfVisible(img, gifObj);
		});
		img.src = gifObj.images.fixed_height_still.url;
	};
});

document.addEventListener("deviceready", function () {
	"use strict";
	angular.bootstrap(document, ["app"]);
}, false);

//document.dispatchEvent(new CustomEvent("deviceready"));