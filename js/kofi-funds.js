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
		calcShortTermGoal(data);
		return data.sort(function (d1, d2) {
			return Date.parse(d1.timestamp) >= Date.parse(d2.timestamp) ?
				-1 : 1;
		});
	}

	function calcShortTermGoal (data) {
		data.shortTermStart = data.total - data.total % 1000;
		data.shortTermGoal = data.total + 1000 - data.total % 1000;
		data.shortTermTotal = data.total - data.shortTermStart;
		data.shortTermRate = data.shortTermTotal / (data.shortTermGoal - data.shortTermStart);
	}

	function renderFundCounter (funds) {
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
		var header = main.find(".fund-counter__header");
		var footer = main.find(".fund-counter__footer");
		renderHeader(header, funds);
		renderFooter(footer, funds);

		window.addEventListener("resize", resizer);
	}

	function setProgressGradients (canvas, data) {
		var defs = canvas.append("defs");

		var totalGradient = defs.append("linearGradient")
			.attr("id", "totalGradient");

		var shortTermGradient = defs.append("linearGradient")
			.attr("id", "shortTermGradient");

		var index = 0;
		var step = .1;
		var stepColors = [
			"#c13737",
			"#D15C29",
			"#E0821C",
			"#F0A70E",
			"#ffcc00",
			"#BFB900",
			"#80A600",
			"#409300",
			"#008000"
		];
		while (index * step < data.rate) {
			totalGradient.append("stop")
				.attr("stop-color", stepColors[index]);
			index++;
		}
		index++;
		totalGradient.append("stop")
			.attr("stop-color", stepColors[index]);

		index = 0;
		while (index * step < data.shortTermRate) {
			shortTermGradient.append("stop")
				.attr("stop-color", stepColors[index]);
			index++
		}
		index++;
		shortTermGradient.append("stop")
			.attr("stop-color", stepColors[index]);

		totalGradient.selectAll("stop")
			.each(function (d, i, nodes) {
				this.setAttribute("offset", (i / (nodes.length - 1) * 100) + "%")
			});

		shortTermGradient.selectAll("stop")
			.each(function (d, i, nodes) {
				this.setAttribute("offset", (i / (nodes.length - 1) * 100) + "%")
			});
	}

	function drawGraph (el, data) {
		var outterWidth = el.width();
		var innerWidth = Math.min(500, outterWidth) - 40;
		var titleHeight = 20;
		var titlePadding = 20;
		var edgeWidth = 40;
		if (window.innerWidth < 700) {
			edgeWidth = 30;
		}
		var longTermHeight = 10;
		var longTermArc = 10 / 2;
		var shortTermHeight = 20;
		var lineHeight = 20;
		var shortTermArc = shortTermHeight / 2;
		el.html("<svg></svg>");	
		var canvas = d3.select(el.children().get(0));
		setProgressGradients(canvas, data);

		var longTermGraph = canvas.append("g")
			.attr("class", "fund-counter__long-term-graph")
			.attr("transform", "translate(" + ((outterWidth - innerWidth) / 2) + ", 120)");

		var shortTermGraph = canvas.append("g")
			.attr("class", "fund-counter__short-term-graph")
			.attr("transform", "translate(" + ((outterWidth - innerWidth) / 2) + ", 10)");

		var longTitle = longTermGraph.append("text")
			.attr("x", innerWidth / 2)
			.attr("y", titleHeight)
			.attr("text-anchor", "middle")
			.append("tspan")
				.attr("alignment-baseline", "middle")
				.text("Objectiu final");

		var longRect = longTermGraph.append("rect")
			.attr("x", 0)
			.attr("y", titleHeight + titlePadding)
			.attr("height", longTermHeight)
			.attr("width", innerWidth)
			.attr("fill", "#f1f1f1")
			.attr("rx", longTermArc);

		var longProgress = longTermGraph.append("path")
			.attr("class", "fund-counter__status")
			.attr("d", drawStatusBar(0, titleHeight + titlePadding, Math.min(innerWidth, Math.max(longTermArc, innerWidth * data.rate)), longTermHeight, longTermArc))
			.attr("fill", "url(#totalGradient");

		var longPercentage = longTermGraph.append("text")
			.attr("x", Math.max(longTermArc, innerWidth * data.rate) - longTermArc)
			.attr("y", titleHeight + titlePadding + longTermHeight + lineHeight)
			.attr("text-anchor", data.rate < 0.2 ? "start" : "end")
			// .attr("fill", data.rate < 0.2 ? "black" : "white")
			.append("tspan")
				.attr("alignment-baseline", "middle")
				.text(Math.round(data.rate * 100) + "%");

		var shortTitle = shortTermGraph.append("text")
			.attr("x", innerWidth / 2)
			.attr("y", titleHeight)
			.attr("text-anchor", "middle")
			.style("font-size", "1.5em")
			.append("tspan")
				.attr("alignment-baseline", "baseline")
				.text("Objectiu actual");

		var shortRect = shortTermGraph.append("rect")
			.attr("x", edgeWidth)
			.attr("y", titleHeight + titlePadding)
			.attr("height", shortTermHeight)
			.attr("width", innerWidth - edgeWidth * 2)
			.attr("fill", "#f1f1f1")
			.attr("rx", shortTermArc);

		var shortLeftLine = shortTermGraph.append("line")
			.attr("x1", 0)
			.attr("x2", edgeWidth)
			.attr("y1", titleHeight + titlePadding + shortTermHeight / 2)
			.attr("y2", titleHeight + titlePadding + shortTermHeight / 2)
			.style("stroke", "#c13737") 
			.style("stroke-width", 4)
			.style("stroke-dasharray", "4"); 

		var shortRightLine = shortTermGraph.append("line")
			.attr("x1", innerWidth - edgeWidth)
			.attr("x2", innerWidth)
			.attr("y1", titleHeight + titlePadding + shortTermHeight / 2)
			.attr("y2", titleHeight + titlePadding + shortTermHeight / 2)
			.style("stroke", "#f1f1f1")
			.style("stroke-width", 4)
			.style("stroke-dasharray", "4");

		var shortProgress = shortTermGraph.append("path")
			.attr("class", "fund-counter__status")
			.attr("d", drawStatusBar(edgeWidth, titleHeight + titlePadding, Math.min(innerWidth - edgeWidth * 2, Math.max(shortTermArc, (innerWidth - edgeWidth * 2) * data.shortTermRate)), shortTermHeight, shortTermArc))
			.attr("fill", "url(#shortTermGradient");

		var shortStartLabel = shortTermGraph.append("text")
			.attr("class", "fund-counter__label")
			.attr("x", edgeWidth)
			.attr("y", titleHeight + titlePadding + shortTermHeight + lineHeight)
			.attr("text-anchor", "end")
			.append("tspan")
				.attr("alignment-baseline", "baseline")
				.text(formatCurrency(data.shortTermStart));

		var shortLabelEnd = shortTermGraph.append("text")
			.attr("class", "fund-counter__label")
			.attr("x", innerWidth - edgeWidth)
			.attr("y", titleHeight + titlePadding + shortTermHeight + lineHeight)
			.attr("text-anchor", "start")
			.append("tspan")
				.attr("alignment-baseline", "baseline")
				.text(formatCurrency(data.shortTermGoal));

		var shortLabelStatus = shortTermGraph.append("text")
			.attr("class", "fund-counter__status")
			.attr("x", (innerWidth - edgeWidth * 2) * data.shortTermRate + edgeWidth)
			.attr("y", titleHeight + titlePadding + shortTermHeight + lineHeight)
			.attr("text-anchor", "middle")
			.append("tspan")
				.attr("alignment-baseline", "baseline")
				.text(Math.round(data.shortTermRate * 100) + "%");
	}

	function formatNumber (n, currency) {
		return new Intl.NumberFormat("es-ES").format(n);
	}

	function formatCurrency (n) {
		return new Intl.NumberFormat("es-ES", {
			style: "currency",
			currency: "EUR",
			maximumFractionDigits: 0,
			minimumFractionDigits: 0
		}).format(n);
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

	function renderHeader (el, data) {
		var footerTop = $("<div class=\"fund-counter__footer-section top\">");
		el.append(footerTop);

		var infoTemplate = "<h4 class=\"fund-counter__info-header\"></h4>"
			+ "<p class=\"fund-counter__info-body\"></p>";

		var goal = $("<div class=\"fund-counter__info goal\">");
		goal.html(infoTemplate);
		var state = $("<div class=\"fund-counter__info state\">");
		state.html(infoTemplate);
		var pending = $("<div class=\"fund-counter__info pending\">");
		pending.html(infoTemplate);

		goal.find(".fund-counter__info-header").text("Objectiu");
		goal.find(".fund-counter__info-body").text(formatCurrency(data.goal));

		state.find(".fund-counter__info-header").text("Recaptat");
		state.find(".fund-counter__info-body").text(formatCurrency(data.total));

		pending.find(".fund-counter__info-header").text("Ens falta");
		pending.find(".fund-counter__info-body").text(formatCurrency(data.goal - data.total));	

		footerTop.append(goal);footerTop.append(state);footerTop.append(pending);
	}

	function renderFooter (el, data) {
		var footerBottom = $("<div class=\"fund-counter__footer-section bottom\">");
		el.append(footerBottom);

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
