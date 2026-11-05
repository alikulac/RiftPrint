/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseComponent",
		"sap/rsh/eam/lib/common/utils/utils",
		"rsh/eam/ordergantts1/mvc/UIModel",
		"rsh/eam/ordergantts1/mvc/FeatureToggleModel"
	],
	function (BaseComponent, Utils, UIModel, FeatureToggleModel) {
		"use strict";

		return BaseComponent.extend("rsh.eam.ordergantts1.Component", {
			metadata: {
				manifest: "json"
			},

			init: function () {
				BaseComponent.prototype.init.apply(this, arguments);
				this.setModel(new UIModel(), "UIModel");
				this.setModel(new FeatureToggleModel(), "FeatureToggle");
				// create the views based on the url/hash
				this.getRouter().initialize();
			}
		});
	}
);
