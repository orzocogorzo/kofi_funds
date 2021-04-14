const data = {
	"post_id": 3087,
	"amount": 0,
	"timestamp": "2020-08-21T00:00:00Z"
};

fetch("https://www.casabuenosaires.net/wp-json/kofi_funds/v1/store_income", {
	method: "POST",
	headers: {
		"Content-Type": "application/x-www-form-urlencoded",
		"Accept": "application/json"
	},
	body: "data=" + encodeURIComponent(JSON.stringify(data))
});
