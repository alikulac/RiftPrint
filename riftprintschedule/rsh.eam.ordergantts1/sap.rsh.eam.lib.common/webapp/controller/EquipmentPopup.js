/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * Controller for the Equipment Popup fragment(FunctionalLocationandEquipmentPopup.fragment.xml)
 * @name rsh.eam.lib.common.controller.MyDialogDelegate
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/controller/BaseDelegate",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/rsh/eam/lib/common/utils/AppState",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator"
	],
	function (BaseDelegate, Utils, AppState, JSONModel, Filter, FilterOperator) {
		"use strict";
		return BaseDelegate.extend("sap.rsh.eam.lib.common.controller.MyDialogDelegate", {
			utils: Utils,
			_sFragmentName: "sap.rsh.eam.lib.common.view.FunctionalLocationandEquipmentPopover",
			_oCrossAppNav: null,
			_bFuncLocNavEnabled: false,
			/**
			 * Fragment Initialization method
			 *
			 */
			onInit: function () {
				this._oFragment = this.getFragment();
				this._EquipmentPopupModel = new JSONModel();
				this._oFragment.setModel(this._EquipmentPopupModel);
				this._oAppStateInstance = AppState.getInstance();
				this._oCrossAppNav = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
				this.isNavitationEnabled("WorkCenterUtilization-displayAssetBoard", "_bFuncLocNavEnabled");
				// Create a resource bundle for language specific texts
				var oResourceModel = new sap.ui.model.resource.ResourceModel({
					bundleName: "sap.rsh.eam.lib.common.messagebundle"
				});
				// Assign the model object to the SAPUI5 core using the name "i18n"
				this._oFragment.setModel(oResourceModel, "i18nLib");
			},

			setContentToFragment: function (oEvent, oOwnerComponent, oViewModel, oAppState, bTechnicalObject, bOperation) {
				var bOperationLevelEquip = bOperation;
				var sPath = oEvent.getSource().getBindingContext().sPath;
				var maintenanceOrder = oEvent.getSource().getBindingContext().getProperty("MaintenanceOrder");
				var maintenanceOperation = oEvent.getSource().getBindingContext().getProperty("MaintenanceOrderOperation");
				var orderOperationRowLevel = oEvent.getSource().getBindingContext().getProperty("OrderOperationRowLevel");
				var aFilter = [];
				aFilter.push(new Filter("MaintenanceOrder", FilterOperator.EQ, maintenanceOrder));
				if (sPath.startsWith("/C_RSHOrdersAnd")) {
					sPath = "/C_RSHOrdersAndOperations";
					if (orderOperationRowLevel === 0) {
						aFilter.push(new Filter("OrderOperationRowLevel", FilterOperator.EQ, orderOperationRowLevel));
					} else {
						aFilter.push(new Filter("MaintenanceOrderOperation", FilterOperator.EQ, maintenanceOperation));
						bOperationLevelEquip = true;
					}
				} else if (bOperationLevelEquip) {
					sPath = "/C_RSHOperations";
					aFilter.push(new Filter("MaintenanceOrderOperation", FilterOperator.EQ, maintenanceOperation));
				} else {
					sPath = "/C_RSHOrders";
				}

				var sSelectString = bOperationLevelEquip
					? "OpMaintObjectEquipmentID,OperationEquipment,OperationEquipmentName"
					: "MaintObjectEquipmentID,Equipment,EquipmentName";

				var oLink = oEvent.getSource();
				oLink.setBusyIndicatorDelay(0);
				oLink.setBusy(true);
				oViewModel.read(sPath, {
					groupId: "batchEquipmentData",
					urlParameters: {
						$select: sSelectString
					},
					filters: aFilter,
					success: function (oData) {
						this._prepareFragmentData(oData.results[0], oAppState, bTechnicalObject, bOperationLevelEquip);
						this._oFragment.openBy(oLink);
						oLink.setBusy(false);
					}.bind(this)
				});
			},

			/**
			 * This method prepares the Json Data which is then bound to popover
			 * @param {Object} oData		returned from the oData Read call
			 * @param {object} oAppState  current app state
			 * @param {boolean} bTechnicalObject technical object's link pressed
			 * @param {boolean} bOperation operation technical object
			 * @private
			 */
			_prepareFragmentData: function (oData, oAppState, bTechnicalObject, bOperation) {
				var reuseResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rsh.eam.lib.common");
				var aEquipmentData = [];
				this.oGlobalData = {};
				if (bOperation) {
					aEquipmentData.push({
						GenericIcon: "sap-icon://technical-object",
						GenericTitle: bTechnicalObject ? reuseResourceBundle.getText("TechnicalObject") : reuseResourceBundle.getText("titleEquipmentPopUp"),
						GenericObject: oData.OperationEquipment ? oData.OperationEquipment : reuseResourceBundle.getText("NoEquipment"),
						GenericObjectName: oData.OperationEquipment ? oData.OperationEquipmentName : reuseResourceBundle.getText("NoEquipment"),
						showHideGenericLink: this._bFuncLocNavEnabled
					});
					this.oGlobalData = {
						MaintEquipID: oData.OpMaintObjectEquipmentID,
						EquipmentName: oData.OperationEquipmentName,
						Equipment: oData.OperationEquipment
					};
				} else {
					aEquipmentData.push({
						GenericIcon: "sap-icon://technical-object",
						GenericTitle: bTechnicalObject ? reuseResourceBundle.getText("TechnicalObject") : reuseResourceBundle.getText("titleEquipmentPopUp"),
						GenericObject: oData.Equipment ? oData.Equipment : reuseResourceBundle.getText("NoEquipment"),
						GenericObjectName: oData.Equipment ? oData.EquipmentName : reuseResourceBundle.getText("NoEquipment"),
						showHideGenericLink: this._bFuncLocNavEnabled
					});
					this.oGlobalData = {
						MaintEquipID: oData.MaintObjectEquipmentID,
						EquipmentName: oData.EquipmentName,
						Equipment: oData.Equipment
					};
				}

				var oFragmentJSON = {
					data: aEquipmentData
				};

				this._EquipmentPopupModel.setData(oFragmentJSON);
			},

			isNavitationEnabled: function (sIntent, sResultVar) {
				if (this._oCrossAppNav) {
					var that = this;
					this._oCrossAppNav.isNavigationSupported([sIntent]).done(function (oData) {
						that[sResultVar] = oData[0].supported;
					});
				}
			},
			/**
			 * This method handles the navigation to Asset board app
			 */
			handleAssetBoardNavigation: function () {
				var oInnerAppState = {};
				if (sap.ushell.Container) {
					var oTarget = {
						semanticObject: "WorkCenterUtilization",
						action: "displayAssetBoard"
					};
					var oParams = {
						maintAssetObjID: this.oGlobalData.MaintEquipID,
						functionalLocationName: this.oGlobalData.EquipmentName,
						functionalLocation: this.oGlobalData.Equipment
					};
				}
				this._oAppStateInstance.checkIntentAndNavigate(oTarget, oParams, oInnerAppState);
			}
		});
	}
);
