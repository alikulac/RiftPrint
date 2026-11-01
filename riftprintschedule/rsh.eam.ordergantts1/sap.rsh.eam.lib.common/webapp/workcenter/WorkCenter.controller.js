/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/rsh/eam/lib/common/managers/SchedulingInteractionManager",
		"sap/rsh/eam/lib/common/controller/ChangeWorkCenterCapacity",
		"sap/ui/Device",
		"sap/rsh/eam/lib/common/controller/AssignMyWorkCenters"
	],
	function (BaseViewChildController, SchedulingInteractionManager, ChangeWorkCenterCapacity, Device, AssignMyWorkCenters) {
		"use strict";

		return BaseViewChildController.extend("sap.rsh.eam.lib.common.variant.workcenter.WorkCenter.controller", {
			onInit: function () {
				BaseViewChildController.prototype.onInit.apply(this, arguments);
				this.oModel.attachBatchRequestCompleted(this._onBatchRequestComplete, this);
			},

			onInitMembers: function () {
				var oSIM = new SchedulingInteractionManager(this.oModel);
				this._oChangeWorkCenterCapacity = new ChangeWorkCenterCapacity(oSIM, this.getView());
				this._oAssignMyWorkCenters = undefined;
			},

			_onBatchRequestComplete: function (oResponse) {
				var bUserVariantRequested = this._userVariantRequested(oResponse);
				if (bUserVariantRequested) {
					this.oModel.detachBatchRequestCompleted(this._onBatchRequestComplete, this);
					// check that C_RSHEAMUserVariant cannot be found in the responseText which means that no Work Centers are assigned to the user
					var sResponseText = oResponse.getParameters().response.responseText;
					var oUserVariantRegex = new RegExp("C_RSHEAMUserVariant");
					var bNoWorkCentersAssigned = !oUserVariantRegex.test(sResponseText);
					if (bNoWorkCentersAssigned) {
						this.openAssignDialog();
					}
				}
			},

			_userVariantRequested: function (oResponse) {
				if (oResponse && oResponse.getParameters() && oResponse.getParameters().requests) {
					var aRequests = oResponse.getParameters().requests;
					var bUserVariantRequested = aRequests.some(function (oRequest) {
						return oRequest.url.startsWith("C_RSHEAMUserVariant");
					});
					return bUserVariantRequested;
				} else {
					return false;
				}
			},

			openChangeCapacityDialog: function () {
				this._oChangeWorkCenterCapacity.invokeChangeWorkCenterCapacity(this._onChangeCapacity.bind(this));
			},

			_onChangeCapacity: function (oResult) {
				throw new Error("not implemented");
			},

			openAssignDialog: function (oMessageHandlerResponseModel, bSkipRefresh) {
				this.oModel.setRefreshAfterChange(false);
				
				this._oAssignMyWorkCenters = new AssignMyWorkCenters();
				if (bSkipRefresh) {
					this._oAssignMyWorkCenters.bRefreshAllModels = false;
				}
				
				var oDialog = this._oAssignMyWorkCenters.getFragment();
				var oResourceModel = this.getModel("i18n");
				oDialog.setModel(oResourceModel, "i18n");
				sap.ui.getCore().getMessageManager().registerObject(oDialog, true);
				oDialog.setModel(this.oModel);
				oDialog.setBusy(true);
				
				if (Device.system.phone) {
					oDialog.setStretch(true);
				}

				oDialog.attachAfterOpen(function () {
					if (oMessageHandlerResponseModel) {
						oMessageHandlerResponseModel.setProperty("/bIsDialogOpen", true);
					}
				}, this);
				
				oDialog.attachAfterClose(function () {
					if (oMessageHandlerResponseModel) {
						oMessageHandlerResponseModel.setProperty("/bIsDialogOpen", false);
					}
					this._oAssignMyWorkCenters.getFragment().destroy();
				}, this);

				return this._oAssignMyWorkCenters.open();
			}
		});
	}
);
