<?php

class KOFI_Rest {

	public function __construct () {
		add_action("rest_api_init", array(
			$this,
			"initializer"
		));
	}

	public function initializer () {

		register_rest_route("kofi_funds/v1", "/on_fund", array(
			"methods" => "POST",
			"callback" => array(
				$this,
				"log_fund"
			),
			"args" => array(
				"data" => array(
					"required" => true,
					"type" => "string"
				)
			),
			"permission_callback" => function () {
				return true;
			}
		));

		register_rest_route("kofi_funds/v1", "/get_funds", array(
			"methods" => "GET",
			"callback" => array(
				$this,
				"get_funds"
			),
			"permission_callback" => function () {
				return true;
			}
		));

		register_rest_route("kofi_funds/v1", "/store_income", array(
			"methods" => "POST",
			"callback" => array(
				$this,
				"update_store_income"
			),
			"args" => array(
				"data" => array(
					"required" => true,
					"type" => "string"
				)
			),
			"permission_callback" => function () {
				return true;
			}
		));
	}

	public function get_funds (WP_REST_Request $request) {
		$funds = get_posts(array(
			"numberposts" => -1,
			"post_type" => "kofi_fund"
		));

		$data = array();
		foreach ($funds as $fund) {
			$data[] = array(
				"message_id" => get_post_meta($fund->ID, "message_id", true),
				"kofi_transaction_id" => get_post_meta($fund->ID, "kofi_transaction_id", true),
				"timestamp" => get_post_meta($fund->ID, "timestamp", true),
				"type" => get_post_meta($fund->ID, "type", true),
				"from_name" => $fund->post_title,
				"message" => $fund->post_content,
				"amount" => get_post_meta($fund->ID, "amount", true),
				"currency" => get_post_meta($fund->ID, "currency", true),
				"url" => get_post_meta($fund->ID, "url", true)
			);
		}

		echo json_encode($data);
	}

	public function log_fund (WP_REST_Request $request) {
		$body = $request->get_body();
		$parsed = $this->parse_url($body);
		$data = json_decode($parsed["data"], true);

		$post_data = array(
			"post_author" => 1,
			"post_content" => $data["message"],
			"post_title" => $data["from_name"],
			"post_excerpt" => "Registre de donaci?? de Ko-Fi",
			"post_status" => "publish",
			"post_type" => "kofi_fund",
			"meta_input" => array(
				"message_id" => $data["message_id"],
				"kofi_transaction_id" => $data["kofi_transaction_id"],
				"timestamp" => $data["timestamp"],
				"type" => $data["type"],
				"from_name" => $data["from_name"],
				"amount" => $data["amount"],
				"currency" => $data["currency"],
				"url" => $data["url"]
			)
		);

		$id = wp_insert_post($post_data);

		if ($id) {
			echo "{\"success\": true}";
		} else {
			http_response_code(405);
			echo "{\"success\": false}";
		}
	}

	public function update_store_income (WP_REST_Request $request) {
		$body = $request->get_body();
		$parsed = $this->parse_url($body);
		$data = json_decode($parsed["data"], true);

		try {
			$post_id = $data["post_id"];
			update_post_meta($post_id, "amount", $data["amount"]);
			update_post_meta($post_id, "timestamp", $data["timestamp"]);

			echo "{\"success\": true}";
		} catch (Exception $e) {
			echo $e->getMessage();
		}
	}

	private function parse_url ($url) {
		$params = array();
		$chunks = explode("&", $url);

		foreach ($chunks as $chunk) {
			$pair = explode("=", $chunk);
			$key = urldecode($pair[0]);
			$val = isset($pair[1]) ? urldecode($pair[1]) : null;
			$params[$key] = $val;
		}

		return $params;
	}
}

new KOFI_Rest();
?>
