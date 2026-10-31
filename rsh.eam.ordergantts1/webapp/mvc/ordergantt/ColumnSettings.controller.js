/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/rsh/eam/lib/common/controller/ColumnSettings.controller", "sap/rsh/eam/lib/common/utils/utils", "sap/rsh/eam/lib/common/utils/Constants"],
	function (ColumnSettingsController, Utils, Constants) {
		"use strict";

		return ColumnSettingsController.extend("rsh.eam.ordergantts1.mvc.ordergantt.ColumnSettings.controller", {
			onInit: function () {
				ColumnSettingsController.prototype.onInit.apply(this, arguments);
				this.oModel.attachBatchRequestCompleted(this._onBatchRequestComplete, this);
			},

			onInitMembers: function () {
				ColumnSettingsController.prototype.onInitMembers.apply(this, arguments);
				this._bNewColumnAdded = false;
			},

			_getTable: function () {
				return this.byId("idOrderTreeTable");
			},

			_onAddColumn: function () {
				this._bNewColumnAdded = true;
				this.controllers.ordergantt.binding.refreshBinding({ filtersChanged: false, force: true });
			},

			_onDisableSort: function () {
				this.controllers.ordergantt.sort.applyDefaults();
				this.controllers.ordergantt.binding.refreshBinding({ filtersChanged: false, force: true });
				var oState = this.controllers.persAppState.get();
				if (oState && oState.aSortColumn) {
					oState.aSortColumn = null;
				}
			},

			// displays a message toast for a full gantt refresh
			// before cleanup: SchedulingBoard._requestComplete
			_onBatchRequestComplete: function (oEvent) {
				if (this._bNewColumnAdded) {
					var sMessage = this.oBundle.getText("FullRefreshAfterColumnAdded");
					Utils.addMessage(sMessage, "Information", Constants.sDisplayTypeMessageToast);
					this._bNewColumnAdded = false;
				}
			}
		});
	}
);
