/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * Controller for the Functional Location Popup fragment(FunctionalLocationPopup.fragment.xml)
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
				this._functionalLocationPopupModel = new JSONModel();
				this._oFragment.setModel(this._functionalLocationPopupModel);
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
				var bOperationLevelFLoc = bOperation;
				var sMaintenanceOrderContext = oEvent.getSource().getBindingContext().sPath;
				var maintenanceOrder = oEvent.getSource().getBindingContext().getProperty("MaintenanceOrder");
				var maintenanceOperation = oEvent.getSource().getBindingContext().getProperty("MaintenanceOrderOperation");
				var orderOperationRowLevel = oEvent.getSource().getBindingContext().getProperty("OrderOperationRowLevel");
				var sPath = "",
					aFilter = [];
				this.oOwnerComponent = oOwnerComponent;

				aFilter.push(new Filter("MaintenanceOrder", FilterOperator.EQ, maintenanceOrder));
				if (sMaintenanceOrderContext.startsWith("/C_RSHOrdersAnd")) {
					sPath = "/C_RSHOrdersAndOperations";
					if (orderOperationRowLevel === 0) {
						aFilter.push(new Filter("OrderOperationRowLevel", FilterOperator.EQ, orderOperationRowLevel));
					} else {
						aFilter.push(new Filter("MaintenanceOrderOperation", FilterOperator.EQ, maintenanceOperation));
						bOperationLevelFLoc = true;
					}
				} else if (bOperationLevelFLoc) {
					sPath = "/C_RSHOperations";
					aFilter.push(new Filter("MaintenanceOrderOperation", FilterOperator.EQ, maintenanceOperation));
				} else {
					sPath = "/C_RSHOrders";
				}

				var sSelectString = bOperationLevelFLoc
					? "OpMaintObjectFunctionalLocID,OperationFunctionalLocation,OpFunctionalLocationName"
					: "MaintObjectFunctionalLocID,FunctionalLocation,FunctionalLocationName";

				var oLink = oEvent.getSource();
				oLink.setBusyIndicatorDelay(0);
				oLink.setBusy(true);
				oViewModel.read(sPath, {
					groupId: "batchFLOCData",
					urlParameters: {
						$select: sSelectString
					},
					filters: aFilter,
					success: function (oData) {
						this._prepareFragmentData(oData.results[0], oAppState, bTechnicalObject, bOperationLevelFLoc);
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
				var aFlocData = [];
				this.oGlobalData = {};
				if (bOperation) {
					aFlocData.push({
						GenericIcon: "sap-icon://functional-location",
						GenericTitle: bTechnicalObject
							? reuseResourceBundle.getText("TechnicalObject")
							: reuseResourceBundle.getText("titleFunctionalLocationPopup"),
						GenericObject: oData.OperationFunctionalLocation
							? oData.OperationFunctionalLocation
							: reuseResourceBundle.getText("NoFunctionalLocation"),
						GenericObjectName: oData.OperationFunctionalLocation
							? oData.OpFunctionalLocationName
							: reuseResourceBundle.getText("NoFunctionalLocation"),
						showHideGenericLink: this._bFuncLocNavEnabled
					});
					this.oGlobalData = {
						MaintAssetObjID: oData.OpMaintObjectFunctionalLocID,
						FuncLocationName: oData.OpFunctionalLocationName,
						FuncLocation: oData.OperationFunctionalLocation
					};
				} else {
					aFlocData.push({
						GenericIcon: "sap-icon://functional-location",
						GenericTitle: bTechnicalObject
							? reuseResourceBundle.getText("TechnicalObject")
							: reuseResourceBundle.getText("titleFunctionalLocationPopup"),
						GenericObject: oData.FunctionalLocation ? oData.FunctionalLocation : reuseResourceBundle.getText("NoFunctionalLocation"),
						GenericObjectName: oData.FunctionalLocation ? oData.FunctionalLocationName : reuseResourceBundle.getText("NoFunctionalLocation"),
						showHideGenericLink: this._bFuncLocNavEnabled
					});
					this.oGlobalData = {
						MaintAssetObjID: oData.MaintObjectFunctionalLocID,
						FuncLocationName: oData.FunctionalLocationName,
						FuncLocation: oData.FunctionalLocation
					};
				}

				var oFragmentJSON = {
					data: aFlocData
				};

				this._functionalLocationPopupModel.setData(oFragmentJSON);
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
						maintAssetObjID: this.oGlobalData.MaintAssetObjID,
						functionalLocationName: this.oGlobalData.FuncLocationName,
						functionalLocation: this.oGlobalData.FuncLocation
					};
					if (this.oOwnerComponent.controllers && this.oOwnerComponent.controllers.timePeriod) {
						var oNavParams = this.oOwnerComponent.controllers.timePeriod.getNavParams();
						for (var sItem in oNavParams) {
							oParams[sItem] = oNavParams[sItem];
						}
					}
				}
				this._oAppStateInstance.checkIntentAndNavigate(oTarget, oParams, oInnerAppState);
			}
		});
	}
);
