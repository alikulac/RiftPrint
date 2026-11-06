/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/model/json/JSONModel"], function (JSONModel) {
	"use strict";

	return JSONModel.extend("zrift.rsh.eam.ordergantts1.mvc.FeatureToggleModel", {
		_oLoaded: undefined,

		constructor: function () {
			var oData = {
				searchInGantt: false
			};
			JSONModel.call(this, oData);
			this._oLoaded = this._load();
		},

		_load: function () {
			return new Promise(
				function (resolve, reject) {
					sap.s4h.cfnd.featuretoggle.lib.featuresAsync().then(
						function (oFeatures) {
							this.setProperty("/searchInGantt", oFeatures.getFeatureStatus("RSH_EAM_SEARCH_IN_GANTT"));
							resolve(this);
						}.bind(this),
						reject
					);
				}.bind(this)
			);
		},

		loaded: function () {
			return this._oLoaded;
		}
	});
});
