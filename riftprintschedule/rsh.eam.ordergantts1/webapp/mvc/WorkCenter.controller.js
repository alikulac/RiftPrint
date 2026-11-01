/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/workcenter/WorkCenter.controller"], function (WorkCenterController) {
	"use strict";

	return WorkCenterController.extend("zrsh.eam.ordergantts1.mvc.WorkCenter.controller", {
		onInit: function () {
			WorkCenterController.prototype.onInit.apply(this, arguments);
			this.oModel.attachBatchRequestCompleted(this._requestComplete, this);
		},

		openChangeCapacityDialog: function () {
			this._fixDeferredBindings();
			WorkCenterController.prototype.openChangeCapacityDialog.apply(this, arguments);
		},

		openAssignDialog: function (oMessageResponseModel) {
			this.controllers.systemTimeZone.loaded().then(
				function () {
					this._fixDeferredBindings();
					WorkCenterController.prototype.openAssignDialog.call(this, oMessageResponseModel, true).then(
						function () {
							// TODO avoid model refresh and call refreshBinding instead (open: how to refresh filter bar?)
							this.controllers.ordergantt.binding._updateBindingForOrder(); // in case the binding has been updated for operation
							this.oModel.refresh(true);
						}.bind(this)
					);
				}.bind(this)
			);
		},

		// this is a workaround !!!
		// (1) the root problem is that both the dialogs are calling submitChanges without specifying groups
		// and this triggers the read requests of the gantt. this can only be fixed in the dialogs in a later release
		// (2) the followup problem is that until the first submit of the deferred requests is done the binding
		// does not contain filters and select and "bad" requests are send. this is patched in this function
		// TODO fix the dialogs and submit only the respective batch group. then delete this workaround
		_fixDeferredBindings: function () {
			var bRequestsDeferred = !this.controllers.filterBarSearch.submitOfDeferredRequestsDone();
			if (bRequestsDeferred) {
				this.controllers.ordergantt.binding.refreshBinding({ filter: true, force: true });
				this.controllers.utilizationGantt.refreshBinding();
			}
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
		},

		// added for scenerios when workcenter is added or removed for the user while the sorting is already applied
		// TODO change my assign dialog to call bind instead of a model refresh and then delete this handling
		_requestComplete: function (oEvent) {
			if (oEvent.getParameter("requests")) {
				var oRequest = oEvent.getParameter("requests")[0];
				if (oRequest.url.indexOf("C_RSHUserVariantWithTeam") !== -1 && oRequest.method !== "GET") {
					this.controllers.ordergantt.binding._updateBindingForOrder(); // yes it's private but this code should anyway be deleted
				}
			}
		}
	});
});
