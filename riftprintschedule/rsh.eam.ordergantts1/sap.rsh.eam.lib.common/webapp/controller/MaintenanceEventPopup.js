/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * Controller for the Generic Quick View popup fragment(GenericQuickViewPopup.fragment.xml)
 * Hook methods of view life cycle can be implemented for fragment life cycle.
 * @name rsh.eam.lib.common.controller.MyDialogDelegate
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/controller/BaseDelegate",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/rsh/eam/lib/common/utils/AppState"
	],
	function (BaseDelegate, Utils, JSONModel, Filter, FilterOperator, AppState) {
		"use strict";
		return BaseDelegate.extend("sap.rsh.eam.lib.common.controller.MyDialogDelegate", {
			utils: Utils,
			_sFragmentName: "sap.rsh.eam.lib.common.view.GenericQuickViewPopup",
			_oCrossAppNav: null,
			_bOrderChangeNavEnabled: false,
			_bMaintObjDispNavEnabled: false,
			_bMaintPlanNavEnabled: false,
			/**
			 * Fragment Initialization method
			 *
			 */
			onInit: function () {
				this._oFragment = this.getFragment();
				this.maintPopupModel = new JSONModel();
				this._oFragment.setModel(this.maintPopupModel);
				this._oAppStateInstance = AppState.getInstance();
				this._oCrossAppNav = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
				this.isNavigationEnabled("MaintenancePlanningBucket-manage", "_bMaintPlanNavEnabled");
			},
			/**
			 * method is called from view controller which initializes the fragment delegate
			 * @param {string} sMaintenanceEvent it contains the maintenance event value
			 * @param {string} sMaintenancePlanningPlant it contains the maintenance planning plant
			 * @param {object} oSource it contains the source in which action happened
			 * @param {Object} oViewModel View Model from the calling view controller used to make the oData read call
			 * @param {string} sEntity pass the entity which has to be called through oData Model
			 * @param {int} iPageX Pass the X coordinates values in pixel
			 * @param {int} iPageY Pass the Y coordinates values in pixel
			 * @param {string} sSourceOrigin pass the source whether its shape or link from which the action happened
			 * @param {Object} oInnerAppState It holds the App state value
			 * @returns {void}
			 * @public
			 */
			setContentToFragment: function (
				sMaintenanceEvent,
				sMaintenancePlanningPlant,
				oSource,
				oViewModel,
				sEntity,
				iPageX,
				iPageY,
				sSourceOrigin,
				oInnerAppState
			) {
				var sLocalEntity = sEntity;
				var oPlaceHolder = new sap.m.Label();
				var oPopup = new sap.ui.core.Popup(oPlaceHolder, false, true, false);
				var aFilterOperation = [];
				var that = this,
					sOffset;
				oSource.setBusyIndicatorDelay(0);
				oSource.setBusy(true);
				var eDock = sap.ui.core.Popup.Dock;
				if (sSourceOrigin === "shape") {
					sOffset = parseInt(iPageX, 10) + 1 + " " + (parseInt(iPageY, 10) - 10);
				}
				aFilterOperation.push(
					new Filter({
						filters: [
							new Filter("MaintenanceEvent", FilterOperator.EQ, sMaintenanceEvent),
							new Filter("MaintenancePlanningPlant", FilterOperator.EQ, sMaintenancePlanningPlant)
						],
						and: true
					})
				);
				oViewModel.read(sLocalEntity, {
					groupId: "batchOperation",
					filters: aFilterOperation,
					success: function (oData) {
						that._oFragment.setPlacement("Horizontal");
						var oSingleEntry = oData.results ? oData.results[0] : oData;
						that._prepareFragmentData(oSingleEntry, oInnerAppState);
						if (sSourceOrigin === "shape") {
							oPopup.open(0, eDock.BeginTop, eDock.LeftTop, null, sOffset);
							that._oFragment.openBy(oPlaceHolder);
						} else if (sSourceOrigin === "link") {
							that._oFragment.openBy(oSource);
						}
						oSource.setBusy(false);
					},
					error: function () {
						oSource.setBusy(false);
					}
				});
			},

			/**
			 * This method prepares the Json Data which is then bound to quick view
			 * @param {Object} oData returned from the oData Read call
			 * @param {Object} oInnerAppState current app state
			 * @private
			 */
			_prepareFragmentData: function (oData, oInnerAppState) {
				var reuseResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rsh.eam.lib.common");
				var oFragmentJSON = {
					pages: [
						{
							pageId: "idOrderOperationPopupPage",
							header: reuseResourceBundle.getText("MaintEvent"),
							groups: [
								{
									elements: [
										{
											label: reuseResourceBundle.getText("MaintEvent"),
											value: oData.MaintenanceEventText + " (" + oData.MaintenanceEvent + ")",
											elementType: sap.m.QuickViewGroupElementType.text
										},
										{
											label: reuseResourceBundle.getText("MaintEventType"),
											value: oData.MaintEventTypeDescription + " (" + oData.MaintenanceEventType + ")",
											elementType: sap.m.QuickViewGroupElementType.text
										},
										{
											label: reuseResourceBundle.getText("MaintPlanBucket"),
											value: oData.MaintPlngBucketLabel ? oData.MaintPlanningBucketDescription + " (" + oData.MaintPlngBucketLabel + ")" : "",
											elementType: this._bMaintPlanNavEnabled ? sap.m.QuickViewGroupElementType.link : sap.m.QuickViewGroupElementType.text,
											url: this._bMaintPlanNavEnabled ? this.getMaintPlanningBucketUrl(oData.MaintPlanningBucketUUID, oInnerAppState) : ""
										},
										{
											label: reuseResourceBundle.getText("PersonResponsibe"),
											value: oData.PersonResponsibleName ? oData.PersonResponsibleName + " (" + oData.MaintPlanningBucketPersonResp + ")" : "",
											elementType: sap.m.QuickViewGroupElementType.text
										}
									]
								}
							]
						}
					]
				};
				this.maintPopupModel.setData(oFragmentJSON);
			},
			/**
			 *Utility function to create URL for navigation to Maintenance Planning buckct
			 * @param {string} sPlanningBucketId Internal Id of Maintenance event
			 * @param {object} oAppState  current app state
			 * @returns {string} sUrl to Maintenance Planning Bucket
			 */
			getMaintPlanningBucketUrl: function (sPlanningBucketId, oAppState) {
				var sUrl = "";
				if (sap.ushell.Container) {
					var target = {
						semanticObject: "MaintenancePlanningBucket",
						action: "manage&/C_MaintPlanningBucketTP(MaintPlanningBucketUUID=guid'" + sPlanningBucketId + "',IsActiveEntity=true)/"
					};
					var params = {};
					sUrl = this._oAppStateInstance.setStateGetHref(target, params, oAppState);
				}
				return sUrl;
			},
			/**
			 * utility function to check the user is authorization to navigate
			 * @param {string} sIntent pass the semantic object and action
			 * @param {string} sResultVar it stores whether navigation is allowed to the particular semantic object
			 * */
			isNavigationEnabled: function (sIntent, sResultVar) {
				if (this._oCrossAppNav) {
					var that = this;
					this._oCrossAppNav.isNavigationSupported([sIntent]).done(function (oData) {
						that[sResultVar] = oData[0].supported;
					});
				}
			}
		});
	}
);
