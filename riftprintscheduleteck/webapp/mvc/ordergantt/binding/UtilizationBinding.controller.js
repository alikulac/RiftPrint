/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/BaseViewChild.controller"], function (BaseViewChildController) {
	"use strict";

	return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.ordergantt.binding.UtilizationBinding.controller", {
		onInitMembers: function () {
			this._oTable = this.byId("idOrderTreeTable");
			this._oPreviousUtilizationBinding = undefined;
		},

		bind: function () {
			var oRowSettings = this.byId("OrderGntRowStgID");
			if (!this.oUIModel.getProperty("/showUtilizationIndicator")) {
				if (oRowSettings.getBindingInfo("shapes4")) {
					this._oPreviousUtilizationBinding = oRowSettings.getBindingInfo("shapes4");
					oRowSettings.unbindAggregation("shapes4");
					this._oTable.setRowSettingsTemplate(null);
					this._oTable.setRowSettingsTemplate(oRowSettings);
				}
			} else {
				if (!oRowSettings.getBindingInfo("shapes4")) {
					//Full refresh is required in scenarios when settings is switched on first time within the app
					//in order to add association to the tree table rows and subsequent expand requests
					this.controllers.ordergantt.binding.refreshBinding({ filtersChanged: false, force: false });
					oRowSettings.bindAggregation("shapes4", this._oPreviousUtilizationBinding);
					this._oTable.setRowSettingsTemplate(null);
					this._oTable.setRowSettingsTemplate(oRowSettings);
				}
			}
		}
	});
});
