/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * Controller for the Schedules Quickview popup fragment
 * Hook methods of view life cycle can be imeplemented for fragment life cycle.
 * @name rsh.eam.lib.common.controller.MyDialogDelegate
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/controller/BaseDelegate",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/format/DateFormat",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator"
	],
	function (BaseDelegate, Utils, JSONModel, DateFormat, Filter, FilterOperator) {
		"use strict";
		return BaseDelegate.extend("sap.rsh.eam.lib.common.controller.MyDialogDelegate", {
			utils: Utils,
			// _sFragmentName: "sap.rsh.eam.lib.common.view.GenericQuickViewPopup",
			_sFragmentName: "sap.rsh.eam.lib.common.view.SchedulesPopup",
			_oCrossAppNav: null,

			/**
			 * Fragment Initialization method
			 *
			 */
			onInit: function () {
				this._oFragment = this.getFragment();
				this.schedulePopupModel = new JSONModel();
				this._oFragment.setModel(this.schedulePopupModel);
				this._oCrossAppNav = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
				this._pCrossAppNav = sap.ushell.Container.getServiceAsync("CrossApplicationNavigation");

				// Create a resource bundle for language specific texts
				var oResourceModel = new sap.ui.model.resource.ResourceModel({
					bundleName: "sap.rsh.eam.lib.common.messagebundle"
				});

				// Assign the model object to the SAPUI5 core using the name "i18n"
				this._oFragment.setModel(oResourceModel, "i18nLib");

				this._oDateFormatter = DateFormat.getDateInstance({
					style: "medium"
				});
			},

			/**
			 * method is called from view controller which initializes the fragment delegate
			 * @param {Object} oEvent Event object from the source used to extract the required oData call params
			 * @param {object} oOwnerComponent owner component
			 * @param {Object} oViewModel View Model from the calling view controller used to make the oData read call
			 * @public
			 */
			setContentToFragment: function (oEvent, oOwnerComponent, oViewModel) {
				var sPath = oEvent.getSource().getBindingContext().sPath;
				var maintenanceOrder = oEvent.getSource().getBindingContext().getProperty("MaintenanceOrder");
				var maintenanceOrderOP = oEvent.getSource().getBindingContext().getProperty("MaintenanceOrderOperation");
				var maintenanceOrderSubOP = oEvent.getSource().getBindingContext().getProperty("MaintenanceOrderSubOperation");

				var aFilter = [];

				if (sPath.startsWith("/C_RSHOrdersAnd")) {
					sPath = "/C_RSHOrdersAndOperations";
					aFilter.push(
						new Filter({
							filters: [
								new Filter("MaintenanceOrder", FilterOperator.EQ, maintenanceOrder),
								new Filter("MaintenanceOrderOperation", FilterOperator.EQ, maintenanceOrderOP),
								new Filter("MaintenanceOrderSubOperation", FilterOperator.EQ, maintenanceOrderSubOP)
							],
							and: true
						})
					);
				}
				var oLink = oEvent.getSource();

				oLink.setBusyIndicatorDelay(0);
				oLink.setBusy(true);

				var oDataForFragmentRef = {
					link: oLink
				};

				oViewModel.read(sPath, {
					groupId: "batchOperation",
					filters: aFilter,
					urlParameters: {
						$expand: "to_MaintSchedSimulation"
					},
					success: function (oData) {
						var oSingleEntry = oData.results ? oData.results[0] : oData;
						this._prepareFragmentData(oSingleEntry);
						this._oFragment.openBy(oDataForFragmentRef.link);
						oDataForFragmentRef.link.setBusy(false);
					}.bind(this),
					error: function () {
						oDataForFragmentRef.link.setBusy(false);
					}
				});
			},

			/**
			 * This method prepares the Json Data which is then bound to quick view
			 * @param {Object} oData		returned from the oData Read call
			 * @private
			 */
			_prepareFragmentData: function (oData) {
				var reuseResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rsh.eam.lib.common");
				var aSchedulesData = [];

				this._pCrossAppNav.then(function (oCrossAppNav) {
					var aIntents = [
						{
							target: {
								semanticObject: "WorkCenterUtilization",
								action: "operationsLeveling"
							}
						}
					];
					oCrossAppNav.isNavigationSupported(aIntents).done(
						function (oCrossAppData) {
							for (var i = 0; i < oData.to_MaintSchedSimulation.results.length; i++) {
								var dStartDate = this._oDateFormatter.format(oData.to_MaintSchedSimulation.results[i].MaintSchedSimulationStartDate, true);
								var dEndDate = this._oDateFormatter.format(oData.to_MaintSchedSimulation.results[i].MaintSchedSimulationEndDate, true);
	
								aSchedulesData.push({
									ScheduleName: oData.to_MaintSchedSimulation.results[i].MaintSchedSimlnDescription,
									SchedulePeriod: reuseResourceBundle.getText("SchedulePeriod", [dStartDate, dEndDate]),
									ScheduleUrl: this.getScheduleLinkUrl(oData.to_MaintSchedSimulation.results[i].MaintSchedSimlnUUID),
									ScheduleStatus: oData.to_MaintSchedSimulation.results[i].MaintOrdSchedExecutionStatTxt,
									NavSupported: oCrossAppData[0].supported
								});
							}
	
							var oFragmentJSON = {
								data: aSchedulesData
							};
							this.schedulePopupModel.setData(oFragmentJSON);
						}.bind(this)
					);
				}.bind(this));
			},

			getScheduleLinkUrl: function (MaintSchedSimlnUUID) {
				var sUrl = "";
				if (sap.ushell.Container) {
					var oArgs = {
						target: {
							semanticObject: "WorkCenterUtilization",
							action: "operationsLeveling"
						},
						params: {
							MaintSchedSimlnUUID: MaintSchedSimlnUUID
						}
					};
					sUrl = this._oCrossAppNav.hrefForExternal(oArgs);
				}
				return sUrl;
			}
		});
	}
);
