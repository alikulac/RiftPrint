/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/ui/generic/app/navigation/service/NavigationHandler", // TODO use new API
		"sap/fe/navigation/SelectionVariant",
		"sap/ui/comp/state/UIState",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/rsh/eam/lib/common/utils/Constants"
	],
	function (BaseViewChildController, NavigationHandler, SelectionVariant, UIState, Utils, Constants) {
		"use strict";

		/*
		 * Follows the standard code sample from Fiori End-2-End guide
		 * (NavigationBetweenApps - StandardizedNavigation)
		 */
		return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.Navigation.controller", {
			onInit: function () {
				BaseViewChildController.prototype.onInit.apply(this, arguments);
				this._oFilterBar.suspendSelection(); // will be resumed after the app state is initialized
			},

			onInitMembers: function () {
				this._bAppStateInitialized = false;
				this._oFilterBar = this.byId("idOrderGanttSmartFilterBar");
				this._oVariantManagement = this.byId("idGanttPgVarMgmt");
				this._oNavigationHandler = new NavigationHandler(this.oComponent);
			},

			isAppStateInitialized: function () {
				return this._bAppStateInitialized;
			},

			initAppState: function () {
				var pParseNavigation = this._oNavigationHandler.parseNavigation();
				var pInit = pParseNavigation.then(this._onInitAppState.bind(this));
				pParseNavigation.fail(function (e) {
					var sMessage = "Failed to parse app state. " + e;
					Utils.addMessage(sMessage, sap.ui.core.MessageType.Error, Constants.sDisplayTypeMessageBox);
				});
				return pInit;
			},

			_onInitAppState: function (oAppData, oStartupParameters, sNavType) {
				this._defaultTimePeriod();
				if (sNavType === sap.fe.navigation.NavType.initial || sNavType === sap.fe.navigation.NavType.iAppState) {
					// the implementation of iAppState was completely deleted in the 2308 release
				} else {
					this._addFilterFieldsToAdvancedArea(oAppData);
					this._setFilterBarState(oAppData);
					this._resetVariantModified(oAppData);
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
				if (this._oFilterBar.getCurrentVariantId() === "" && !this._oFilterBar.getControlByKey("PeriodType").getValue()) {
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

			// it's not clear what this is doing (and why)
			_resetVariantModified: function (oAppData) {
				if (
					(oAppData.customData && !oAppData.customData.filterBarVariantDirty) ||
					(oAppData.bNavSelVarHasDefaultsOnly && this._oFilterBar.getCurrentVariantId() === "")
				) {
					if (this._oFilterBar.isPending()) {
						this._oFilterBar.attachEventOnce(
							"pendingChange",
							function () {
								this._oVariantManagement.currentVariantSetModified(false);
							}.bind(this)
						);
					} else {
						this._oVariantManagement.currentVariantSetModified(false);
					}
				}
			},

			// applies custom data for
			//  - MaintenanceOrder (because of concatenation of multiple IDs not handled by setUiState)
			//  - MaintPriority => TODO only use setUiState?
			//  - ProcessingStatus => TODO only use setUiState?
			//  - WorkCenter => TODO only use setUiState?
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
				var aItems = [];
				var oPriorityValue = {};
				var oStatusValue = {};
				var oWorkCenterValue = {};

				// Pick Priority parameter from Startup Parameters
				if (oStartupParameters.MaintPriority) {
					oPriorityValue.key = oStartupParameters.MaintPriority[0];

					if (oStartupParameters.MaintPriorityDesc) {
						oPriorityValue.text = oStartupParameters.MaintPriorityDesc[0];
					} else {
						oPriorityValue.text = oPriorityValue.key;
					}
					aItems.push(oPriorityValue);
					if (!oFilterData.MaintPriority) {
						oFilterData.MaintPriority = {};
					}
					oFilterData.MaintPriority.items = aItems;
				}
				aItems = [];
				
				// Pick Processing Status from Startup Parameters
				if (oStartupParameters.ProcessingStatus) {
					oStatusValue.key = oStartupParameters.ProcessingStatus[0];
					aItems.push(oStatusValue);
					if (!oFilterData.ProcessingStatus) {
						oFilterData.ProcessingStatus = {};
					}
					oFilterData.ProcessingStatus.items = aItems;
				}
				aItems = [];
				
				// Pick WorkCenter from Startup Parameters
				if (oStartupParameters.WorkCenter) {
					oWorkCenterValue.key = oStartupParameters.WorkCenter[0];
					oWorkCenterValue.text = oStartupParameters.WorkCenter[0];
					aItems.push(oWorkCenterValue);
					if (!oFilterData.WorkCenter) {
						oFilterData.WorkCenter = {};
					}
					oFilterData.WorkCenter.items = aItems;
				}

				// While navigating into this app with Maintenance Order (e.g. from Order tab of Details App)
				if (oStartupParameters.MaintenanceOrder) {
					if (!oFilterData.MaintenanceOrder) {
						oFilterData.MaintenanceOrder = {};
					}
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
					return oFilterData;
				} else {
					return {};
				}
			}
		});
	}
);
