/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseComponent",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/rsh/eam/lib/common/utils/AppState",
		"sap/rsh/eam/lib/common/utils/AppPersContainer",
		"zrsh/eam/ordergantts1/mvc/UIModel",
		"zrsh/eam/ordergantts1/mvc/FeatureToggleModel"
	],
	function (BaseComponent, Utils, AppState, AppPersContainer, UIModel, FeatureToggleModel) {
		"use strict";

		return BaseComponent.extend("zrsh.eam.ordergantts1.Component", {
			metadata: {
				manifest: "json",
				config: {
					fullWidth: true
				}
			},

			init: function () {
				BaseComponent.prototype.init.apply(this, arguments);

				this.setModel(new UIModel(), "UIModel");
				this.setModel(new FeatureToggleModel(), "FeatureToggle");

				AppPersContainer.createInstance(this);

				// app state is not used by the app but by some common artefacts
				AppState.createInstance(this);

				Utils.setMondayFirstDayOfWeek();

				// create the views based on the url/hash
				this.getRouter().initialize();
			}
		});
	}
);
