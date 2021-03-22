<?php

/**
 * Plugin Name: Ko-Fi Funds
 * Author: Lèmur
 */

if (!defined("ABSPATH")) {
	return;
}

class KOFI_Funds {

	/**
	 * Build the instance
	 */
	public function __construct () {
		register_activation_hook(__FILE__, array(
			$this,
			"install"
		));

		register_deactivation_hook(__FILE__, array(
			$this,
			"uninstall"
		));

		add_action("plugins_loaded", array(
			$this,
			"load_plugin"
		));


		add_action("wp_enqueue_scripts", array(
			$this,
			"enqueue_scripts"
		));
	}

	/**
	 * Advanced Type
	 *
	 * @param array $types
	 * @return void
	 */
	public function load_plugin () {
		require_once "kofi-rest.php";

		register_post_type("kofi_fund", array(
			"labels" => array(
				"name" => __("Donacións"),
				"singular_name" => __("Donació")
			),
			"description" => "Registre de donació de Ko-Fi",
			"public" => false,
			"has_archive" => false,
			"rewrite" => false
		));
	}

	/**
	 * Installing on activation
	 * @return void
	 */
	public function install () {
		// If there is no pack product type taxonomy, add it.
		if (!get_term_by("slug", "kofi_fund", "post_type")) {
			wp_insert_term("kofi_fund", "post_type");
		}
	}

	/*
	 * Uninstalling on deactivate
	 *
	 * @return void
	 */
	public function uninstall () {
		unregister_post_type("kofi_fund");

		if (get_term_by("slug", "kofi_fund", "post_type")) {
			wp_delete_term("kofi_fund", "post_type");
		}

		flush_rewrite_rules();
	}

	public function enqueue_scripts ($hook) {
		wp_enqueue_script(
			"d3js",
			plugins_url(
				"js/d3.min.js",
				__FILE__
			),
			array(),
			"6.0.0",
			true
		);

		wp_enqueue_style(
			"kofi-funds",
			plugins_url(
				"css/kofi-funds.css",
				__FILE__
			),
			[],
			"1.0.0"
		);

		wp_enqueue_script(
			"kofi-funds",
			plugins_url(
				"js/kofi-funds.js",
				__FILE__
			),
			array("jquery", "d3js"),
			"1.0.0",
			true
		);
	}
}

new KOFI_Funds();
