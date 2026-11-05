/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/fe/navigation/SelectionVariant",
		"sap/ui/comp/state/UIState",
		"sap/fe/navigation/library",
		"sap/rsh/eam/lib/common/utils/SmartFilterBarUtils",
		"sap/fe/navigation/NavigationHandler"
	],
	function (BaseViewChildController, SelectionVariant, UIState, NavigationLib, SmartFilterBarUtils, NavigationHandler) {
		"use strict";

		/*
		 * Follows the standard code sample from Fiori End-2-End guide
		 * (NavigationBetweenApps - StandardizedNavigation)
		 */
		return BaseViewChildController.extend("zrsh.eam.ordergantts1.mvc.InboundNavigation.controller", {
			onInit: function () {
				BaseViewChildController.prototype.onInit.apply(this, arguments);
				this._oFilterBar.suspendSelection(); // will be resumed after the app state is initialized
			},

			onInitMembers: function () {
				BaseViewChildController.prototype.onInitMembers.apply(this, arguments);
				this._oNavigationHandler = new NavigationHandler(this.oComponent);
				this._bAppStateInitialized = false;
				this._oFilterBar = this.byId("idOrderGanttSmartFilterBar");
				this._oVariantManagement = this.byId("idGanttPgVarMgmt");
			},

			isAppStateInitialized: function () {
				return this._bAppStateInitialized;
			},

			initAppState: function () {
				var pParseNavigation = this._oNavigationHandler.parseNavigation();
				var pInit = pParseNavigation.then(this._onInitAppState.bind(this));
				pParseNavigation.fail(function (e) {
					var sMessage = "Failed to parse app state. " + e;
					this.controllers.message.addMessage(sMessage, "Error", "Dialog");
				});
				return pInit;
			},

			_onInitAppState: function (oAppData, oStartupParameters, sNavType) {
				this._defaultTimePeriod();
				if (sNavType === NavigationLib.NavType.initial || sNavType === NavigationLib.NavType.iAppState) {
					// the implementation of iAppState was completely deleted in the 2308 release
				} else {
					this._addFilterFieldsToAdvancedArea(oAppData);
					this._setFilterBarState(oAppData);
					this._setFilterBarCustomFields(oAppData, oStartupParameters);
					if (!oAppData.bNavSelVarHasDefaultsOnly) {
						this._oFilterBar.search();
					}
				}
				this._oFilterBar.resumeSelection();
				this._bAppStateInitialized = true;
			},

			// Incident: 2170315837 Adding undefined check for 1.97 version
			_defaultTimePeriod: function () {
				var oPeriodTypeFilter = SmartFilterBarUtils.getControlByKey(this._oFilterBar, "PeriodType");

				if (this._oFilterBar.getCurrentVariantId() === "" && !oPeriodTypeFilter.getValue()) {
					this.controllers.timePeriod.setDefault();
				}
			},

			// excluding PeriodType
			_addFilterFieldsToAdvancedArea: function (oAppData) {
				var oSelectionVariant = new SelectionVariant(oAppData.selectionVariant);
				var aSelectionVariantProperties = oSelectionVariant.getParameterNames().concat(oSelectionVariant.getSelectOptionsPropertyNames());
				for (var i = 0; i < aSelectionVariantProperties.length; i++) {
					if (aSelectionVariantProperties[i] !== "PeriodType") {
						this._oFilterBar.addFieldToAdvancedArea(aSelectionVariantProperties[i]);
					}
				}
			},

			// excluding MaintenanceOrder which is handled by _setFilterBarCustomFields
			_setFilterBarState: function (oAppData) {
				var oUiState = new UIState({
					selectionVariant: JSON.parse(oAppData.selectionVariant),
					semanticDates: oAppData.semanticDates ? JSON.parse(oAppData.semanticDates) : {}
				});
				var iIndexOfMaintenanceOrder = -1;
				oUiState.getSelectionVariant().SelectOptions.forEach(function (oSelOption, j) {
					if (oSelOption.PropertyName === "MaintenanceOrder") {
						iIndexOfMaintenanceOrder = j;
					}
				});
				if (iIndexOfMaintenanceOrder !== -1) {
					oUiState.getSelectionVariant().SelectOptions.splice(iIndexOfMaintenanceOrder, 1);
				}
				if (!oAppData.bNavSelVarHasDefaultsOnly || this._oFilterBar.getCurrentVariantId() === "") {
					this._oFilterBar.clearVariantSelection(); // reset to Standard variant
					this._oFilterBar.clear();
					this._oFilterBar.setUiState(oUiState, {
						replace: true,
						strictMode: false
					});
				}
			},

			// applies custom data for
			//  - MaintenanceOrder (because of concatenation of multiple IDs not handled by setUiState)
			//  - PeriodType (because of custom format)
			_setFilterBarCustomFields: function (oAppData, oStartupParameters) {
				var oFilterData = oStartupParameters ? this._getFilterData(oStartupParameters) : {};
				if (oAppData.bNavSelVarHasDefaultsOnly && this._oFilterBar.getCurrentVariantId() === "") {
					oFilterData.PeriodType = this.controllers.timePeriod.getPeriodTypeNext4Weeks();
				}
				this._oFilterBar.setFilterData(oFilterData);
			},

			_getFilterData: function (oStartupParameters) {
				var oFilterData = {};

				// While navigating into this app with Maintenance Order (e.g. from Order tab of Details App)
				if (oStartupParameters.MaintenanceOrder) {
					oFilterData.MaintenanceOrder = {};
					oFilterData.MaintenanceOrder.items = [];
					var sMaintenanceOrders = decodeURIComponent(oStartupParameters.MaintenanceOrder);
					var aMaintenanceOrders = sMaintenanceOrders.split(",");
					aMaintenanceOrders.forEach(function pushOrder(item) {
						oFilterData.MaintenanceOrder.items.push({
							key: item,
							text: item
						});
					});
				}

				if (oStartupParameters.PeriodType) {
					oFilterData.PeriodType = this.controllers.timePeriod.getPeriodType(oStartupParameters);
				}

				return oFilterData;
			}
		});
	}
);
