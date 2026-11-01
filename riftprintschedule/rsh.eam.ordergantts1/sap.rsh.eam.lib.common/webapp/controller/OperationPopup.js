/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * Controller for the Operation popup fragment(OperationPopup.fragment.xml)
 * Hook methods of view life cycle can be imeplemented for fragment life cycle.
 * @author: D053364
 * @name rsh.eam.lib.common.controller.MyDialogDelegate
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/controller/BaseDelegate",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator"
	],
	function (BaseDelegate, Utils, JSONModel, Filter, FilterOperator) {
		"use strict";

		return BaseDelegate.extend("sap.rsh.eam.lib.common.controller.MyDialogDelegate", {
			utils: Utils,
			_sFragmentName: "sap.rsh.eam.lib.common.view.GenericQuickViewPopup",
			_oCrossAppNav: null,
			_bOrderChangeNavEnabled: false,
			_bMaintObjDispNavEnabled: false,
			sEamsFl: "EAMS_FL",
			sEamsEqui: "EAMS_EQUI",
			/**
			 * Fragment Initialization method
			 *
			 */
			onInit: function () {
				this._oFragment = this.getFragment();
				this.operationPopupModel = new JSONModel();
				this._oFragment.setModel(this.operationPopupModel);
				this._oCrossAppNav = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
				this.isNavitationEnabled("MaintenanceOrder-change", "_bOrderChangeNavEnabled");
				this.isNavitationEnabled("MaintenanceObject-display", "_bMaintObjDispNavEnabled");
			},

			/**
			 * method is called from view controller which initializes the fragment delegate
			 * @param {Object} oEvent Event object from the source used to extract the required oData call params
			 * @param {object} oOwnerComponent  owner component
			 * @param {Object} oViewModel View Model from the calling view controller used to make the oData read call
			 * @param {string} sSelectQuery pass the list of the fields
			 * @public
			 */

			setContentToFragment: function (oEvent, oOwnerComponent, oViewModel, sSelectQuery) {
				var sPath = oEvent.getSource().getBindingContext().sPath;
				var sOperationDescription = oEvent.getSource().getBindingContext().getProperty("OperationDescription");
				var sMaintenanceOrderOP = oEvent.getSource().getBindingContext().getProperty("MaintenanceOrderOperation");
				var sMaintenanceOrderSubOP = oEvent.getSource().getBindingContext().getProperty("MaintenanceOrderSubOperation");
				var sMaintenanceOrder = oEvent.getSource().getBindingContext().getProperty("MaintenanceOrder");
				var sMaintOrderRoutingNumber = oEvent.getSource().getBindingContext().getProperty("MaintOrderRoutingNumber");
				var sMaintOrderOperationCounter = oEvent.getSource().getBindingContext().getProperty("MaintOrderOperationCounter");
				var aFilterOperation = [];

				this.orderInfo = [];
				var oLink = oEvent.getSource();
				oLink.setBusy(true);

				var sDescription;
				if (sMaintenanceOrderSubOP) {
					sDescription = sMaintenanceOrderOP + "/" + sMaintenanceOrderSubOP + " " + sOperationDescription;
				} else {
					sDescription = sMaintenanceOrderOP + " " + sOperationDescription;
				}

				var oDataForFragmentRef = {
					link: oLink,
					description: sDescription
				};

				if (sPath.startsWith("/C_RSHOrdersAnd")) {
					sPath = "/C_RSHOrdersAndOperations";
					aFilterOperation.push(
						new Filter({
							filters: [
								new Filter("MaintenanceOrder", FilterOperator.EQ, sMaintenanceOrder),
								new Filter("MaintenanceOrderOperation", FilterOperator.EQ, sMaintenanceOrderOP),
								new Filter("MaintenanceOrderSubOperation", FilterOperator.EQ, sMaintenanceOrderSubOP),
								new Filter("MaintOrderRoutingNumber", FilterOperator.EQ, sMaintOrderRoutingNumber),
								new Filter("MaintOrderOperationCounter", FilterOperator.EQ, sMaintOrderOperationCounter)
							],
							and: true
						})
					);
				} else if (sPath.startsWith("/C_RSHOperations")) {
					//To reduce the response time and for better perforamnce of operation pop up, two more filters were added to the odata service
					aFilterOperation.push(
						new Filter({
							filters: [
								new Filter("MaintOrderRoutingNumber", FilterOperator.EQ, sMaintOrderRoutingNumber),
								new Filter("MaintOrderOperationCounter", FilterOperator.EQ, sMaintOrderOperationCounter)
							],
							and: true
						})
					);
				} else if (sPath.startsWith("/C_RSHMaintOperationAssignment")) {
					//To reduce the response time and for better perforamnce of operation pop up, two more filters were added to the odata service
					aFilterOperation.push(
						new Filter({
							filters: [
								new Filter("MaintenanceOrder", FilterOperator.EQ, sMaintenanceOrder),
								new Filter("MaintenanceOrderOperation", FilterOperator.EQ, sMaintenanceOrderOP)
							],
							and: true
						})
					);
				}

				if (sSelectQuery) {
					var oUrlParams = {
						$select: sSelectQuery,
						$expand: "to_OperationActiveStatus,to_OperationDetails"
					};
				}

				oViewModel.read(sPath, {
					groupId: "batchOperation",
					filters: aFilterOperation,
					urlParameters: oUrlParams,
					success: function (oData) {
						var oSingleEntry = oData.results ? oData.results[0] : oData;
						this._prepareFragmentData(oSingleEntry, oDataForFragmentRef.description);
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
			 * @param {String} sOperationDescription	Description that is formed using the operation ID and description
			 * @private
			 */
			_prepareFragmentData: function (oData, sOperationDescription) {
				var oReuseResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rsh.eam.lib.common");
				var oFragmentJSON = {
					pages: [
						{
							pageId: "idOrderOperationPopupPage",
							header: oReuseResourceBundle.getText("MaintenanceOrderOPTitle"),
							groups: [
								{
									heading: oReuseResourceBundle.getText("Details"),
									elements: [
										{
											label: oReuseResourceBundle.getText("orderDescription"),
											value: oData.MaintenanceOrder + " " + oData.MaintenanceOrderDesc,
											elementType: this._bOrderChangeNavEnabled ? sap.m.QuickViewGroupElementType.link : sap.m.QuickViewGroupElementType.text,
											url: this._bOrderChangeNavEnabled ? this.getOrderChangeLinkUrl(oData.MaintenanceOrder) : ""
										},
										{
											label: oReuseResourceBundle.getText("operationDescription"),
											value: sOperationDescription,
											elementType: sap.m.QuickViewGroupElementType.text
										},
										{
											label: oReuseResourceBundle.getText("informationMessages"),
											value:
												oData.ProcessingStatus === 40
													? oReuseResourceBundle.getText("OperationInProcessMsg")
													: oReuseResourceBundle.getText("noInformationMessages"),
											elementType: sap.m.QuickViewGroupElementType.text
										},
										{
											label: oReuseResourceBundle.getText("userStatus"),
											value:
												oData.to_OperationActiveStatus.results.length > 0
													? this.concatenateValues(oData.to_OperationActiveStatus.results, "StatusShortName", "StatusName")
													: oReuseResourceBundle.getText("noUserStatus"),
											elementType: sap.m.QuickViewGroupElementType.text
										},
										{
											label: oReuseResourceBundle.getText("longText"),
											value: oData.to_OperationDetails.MaintOrderOperationLongText
												? oData.to_OperationDetails.MaintOrderOperationLongText
												: oReuseResourceBundle.getText("noOperationLongText"),
											elementType: sap.m.QuickViewGroupElementType.text
										}
									]
								},
								{
									heading: oReuseResourceBundle.getText("referenceObjects"),
									elements: [
										{
											label: oReuseResourceBundle.getText("FunctionalLocation"),
											value: oData.FunctionalLocation
												? oData.FunctionalLocation + ": " + oData.FunctionalLocationName
												: oReuseResourceBundle.getText("NoFunctionalLocation"),
											elementType:
												oData.FunctionalLocation && this._bMaintObjDispNavEnabled
													? sap.m.QuickViewGroupElementType.link
													: sap.m.QuickViewGroupElementType.text,
											url:
												oData.FunctionalLocation && this._bMaintObjDispNavEnabled
													? this.getMaintObjLinkUrl(oData.FunctionalLocation, this.sEamsFl)
													: ""
										},
										{
											label: oReuseResourceBundle.getText("Equipment"),
											value: oData.Equipment ? oData.Equipment + ": " + oData.EquipmentName : oReuseResourceBundle.getText("NoEquipment"),
											elementType:
												oData.Equipment && this._bMaintObjDispNavEnabled
													? sap.m.QuickViewGroupElementType.link
													: sap.m.QuickViewGroupElementType.text,
											url: oData.Equipment && this._bMaintObjDispNavEnabled ? this.getMaintObjLinkUrl(oData.Equipment, this.sEamsEqui) : ""
										}
									]
								},
								{
									heading: oReuseResourceBundle.getText("referenceObjectsOperation"),
									elements: [
										{
											label: oReuseResourceBundle.getText("FunctionalLocation"),
											value: oData.OperationFunctionalLocation
												? oData.OperationFunctionalLocation + ": " + oData.OpFunctionalLocationName
												: oReuseResourceBundle.getText("NoFunctionalLocation"),
											elementType:
												oData.OperationFunctionalLocation && this._bMaintObjDispNavEnabled
													? sap.m.QuickViewGroupElementType.link
													: sap.m.QuickViewGroupElementType.text,
											url:
												oData.OperationFunctionalLocation && this._bMaintObjDispNavEnabled
													? this.getMaintObjLinkUrl(oData.OperationFunctionalLocation, this.sEamsFl)
													: ""
										},
										{
											label: oReuseResourceBundle.getText("Equipment"),
											value: oData.OperationEquipment
												? oData.OperationEquipment + ": " + oData.OperationEquipmentName
												: oReuseResourceBundle.getText("NoEquipment"),
											elementType:
												oData.OperationEquipment && this._bMaintObjDispNavEnabled
													? sap.m.QuickViewGroupElementType.link
													: sap.m.QuickViewGroupElementType.text,
											url: oData.Equipment && this._bMaintObjDispNavEnabled ? this.getMaintObjLinkUrl(oData.OperationEquipment, this.sEamsEqui) : ""
										}
									]
								}
							]
						}
					]
				};
				this.operationPopupModel.setData(oFragmentJSON);
			},

			isNavitationEnabled: function (sIntent, sResultVar) {
				if (this._oCrossAppNav) {
					var that = this;
					this._oCrossAppNav.isNavigationSupported([sIntent]).done(function (oData) {
						that[sResultVar] = oData[0].supported;
					});
				}
			},

			getOrderChangeLinkUrl: function (sOrder) {
				var sUrl = "";
				if (sap.ushell.Container) {
					var oArgs = {
						target: {
							semanticObject: "MaintenanceOrder",
							action: "change"
						},
						params: {
							MaintenanceOrder: sOrder
						}
					};
					sUrl = this._oCrossAppNav.hrefForExternal(oArgs);
				}
				return sUrl;
			},

			getMaintObjLinkUrl: function (maintObj, techObj) {
				var sUrl = "";
				if (sap.ushell.Container) {
					var oArgs = {
						target: {
							semanticObject: "MaintenanceObject",
							action: "display"
						},
						params: {
							MaintenanceObject: maintObj,
							TechObjIsEquipOrFuncnlLoc: techObj
						}
					};
					sUrl = this._oCrossAppNav.hrefForExternal(oArgs);
				}
				return sUrl;
			},

			concatenateValues: function (oValuesArray, sArrayProperty, sArrayPropertyDescr) {
				var sValueString = "";
				if (oValuesArray) {
					oValuesArray.forEach(function (arrayElement) {
						if (sArrayPropertyDescr) {
							sValueString += arrayElement[sArrayProperty] + ": " + arrayElement[sArrayPropertyDescr] + "\n";
						} else {
							sValueString += arrayElement[sArrayProperty] + "\n";
						}
					});
				}
				return sValueString;
			}
		});
	}
);
