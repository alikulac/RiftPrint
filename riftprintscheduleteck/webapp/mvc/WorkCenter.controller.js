/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/workcenter/WorkCenter.controller"], function (WorkCenterController) {
	"use strict";

	return WorkCenterController.extend("zrift.rsh.eam.ordergantts1.mvc.WorkCenter.controller", {
		openAssignDialog: function () {
			this.controllers.systemTimeZone.loaded().then(
				function () {
					WorkCenterController.prototype.openAssignDialog.call(this, true).then(
						function () {
							// TODO avoid model refresh and call refreshBinding instead (open: how to refresh filter bar?)
							this.controllers.ordergantt.binding._updateBindingForOrder(); // in case the binding has been updated for operation
							this.oModel.refresh(true);
						}.bind(this)
					);
				}.bind(this)
			);
		},

		_onChangeCapacity: function (oResult) {
			if (oResult.responseState.bSuccessfulSave) {
				var bRefresh = this.oUIModel.getProperty("/showUtilizationIndicator") || this.controllers.utilizationGantt.isLoaded();
				if (bRefresh) {
					this.controllers.ordergantt.binding.refreshBinding({ filtersChanged: false, force: false });
					this.controllers.utilizationGantt.deltaRefresh(oResult.workCentersToRefresh);
				}
				this.controllers.ordergantt.calendarBinding.bind(true);
			}
		}
	});
});
