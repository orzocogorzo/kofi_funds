jQuery(document).ready(function ($) {
	var main = $("#fundCounter");
	var model = new Object();
	main.hide();
	main.show();
	fetchFunds()
		.then(parseFunds)
		.then(renderFundCounter)
		.catch(function (err) {
			console.error(err);
			main.remove();
		});

	function fetchFunds () {
		return new Promise(function (res, rej) {
			var ajax = new XMLHttpRequest()
			ajax.open("GET", "/wp-json/kofi_funds/v1/get_funds", true);
			ajax.onreadystatechange = function () {
				if (this.readyState === 4) {
					if (this.status === 200) {
						res(this.response);
					} else {
						console.error("Error while loading the funds.");
						rej();
					}
				}
			}
			ajax.send()
		});
	}

	function parseFunds (funds) {
		var data = JSON.parse(funds);
		data.total = data.reduce(function (acum, d, i) {
			return acum + Number(d.amount);
		}, 0);
		data.goal = 40000;
		data.rate = data.total / data.goal;
		return data.sort(function (d1, d2) {
			return Date.parse(d1.timestamp) >= Date.parse(d2.timestamp) ?
				-1 : 1;
		});
	}

	function renderFundCounter (funds) {
		console.log("RENDER");
		if (funds && !model.data) {
			model.data = funds;
		} else if (!funds && model.data) {
			funds = model.data;
		} else {
			model.data = funds;
		}
		main.html("<div class=\"fund-counter__header\"><h2>Campanya antirepre</h2></div>"
			+ "<div class=\"fund-counter__body\">"
				+ "<div id=\"fundCounterGraph\" class=\"fund-counter__graph\"></div>"
			+ "</div>"
			+ "<div class=\"fund-counter__footer\"></div>"
		);

		var graphContainer = main.find("#fundCounterGraph");
		drawGraph(graphContainer, funds);
		var footer = main.find(".fund-counter__footer");
		renderFooter(footer, funds);

		window.addEventListener("resize", resizer);
	}

	function drawGraph (el, data) {
		var outterWidth = el.width();
		var innerWidth = Math.min(500, outterWidth);
		el.html("<svg></svg>");	
		var canvas = d3.select(el.children().get(0));
		var group = canvas.append("g")
			.attr("class", "fund-counter__graph-group")
			.attr("transform", "translate(" + ((outterWidth - innerWidth) / 2) + ", 0)");

		var rect = group.append("rect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("height", 30)
			.attr("width", innerWidth)
			.attr("fill", "#f1f1f1")
			.attr("rx", 15);

		var progress = group.append("path")
			.attr("class", "fund-counter__status")
			.attr("d", drawStatusBar(0, 0, Math.max(15, innerWidth * data.rate), 30, 15))
			.attr("fill", "#c13737")

		var percentage = group.append("text")
			.attr("x", Math.max(20, innerWidth * data.rate) + (data.rate < .2 ? 2 : -5))
			.attr("y", 20)
			.attr("text-anchor", data.rate < 0.2 ? "start" : "end")
			.attr("fill", data.rate < 0.2 ? "black" : "white")
			.append("tspan")
				.attr("alignment-baseline", "middle")
				.text(Math.round(data.rate * 100) + "%");
	}

	function drawStatusBar (x, y, width, height, radius) {
		return "m " + (x + radius) + "," + y
			+ " h " + (width - radius)
			+ " v " + height
			+ " h " + (radius - width)
			+ " q " + -radius + " 0" + "," + -radius + " " + -radius
			+ " q 0 " + -radius + "," + radius + " " + -radius
			+ " z";
	}

	function renderFooter (el, data) {
		var footerTop = $("<div class=\"fund-counter__footer-section top\">");
		var footerBottom = $("<div class=\"fund-counter__footer-section bottom\">");
		el.append(footerTop);
		el.append(footerBottom);

		var infoTemplate = "<h4 class=\"fund-counter__info-header\"></h4>"
			+ "<p class=\"fund-counter__info-body\"></p>";

		var goal = $("<div class=\"fund-counter__info goal\">");
		goal.html(infoTemplate);
		var state = $("<div class=\"fund-counter__info state\">");
		state.html(infoTemplate);
		var pending = $("<div class=\"fund-counter__info pending\">");
		pending.html(infoTemplate);

		goal.find(".fund-counter__info-header").text("Objectiu");
		goal.find(".fund-counter__info-body").text(new Intl.NumberFormat("es-ES", {
			style: "currency",
			currency: "EUR"
		}).format(40000));

		state.find(".fund-counter__info-header").text("Recaptat");
		state.find(".fund-counter__info-body").text(new Intl.NumberFormat("es-ES", {
			style: "currency",
			currency: "EUR"
		}).format(data.total));

		pending.find(".fund-counter__info-header").text("Ens falta");
		pending.find(".fund-counter__info-body").text(new Intl.NumberFormat("es-ES", {
			style: "currency",
			currency: "EUR"
		}).format(40000 - data.total));

		footerTop.append(goal);footerTop.append(state);footerTop.append(pending);

		var button = $("<a href='https://ko-fi.com/P5P13VFXV' target='_blank'><img height='45' style='border:0px;height:45px;' src='/wp-content/uploads/2021/03/kofi-btn.png' border='0' alt='ko-fi.com' /></a>");
		footerBottom.append(button);
	}

	var resizer = (function resizer () {
		var waitter;
		return function resizer () {
			clearTimeout(waitter);
			waitter = setTimeout(function () {
				main.html("");
				renderFundCounter();
			}, 200);
		}
	})();

});
