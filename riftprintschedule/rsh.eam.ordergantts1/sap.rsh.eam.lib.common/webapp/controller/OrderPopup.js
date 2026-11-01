/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * Controller for the Order Popup fragment(OrderPopup.fragment.xml)
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
			/**
			 * Fragment Initialization method
			 *
			 */
			onInit: function () {
				this._oFragment = this.getFragment();
				this._orderPopupModel = new JSONModel();
				this._oFragment.setModel(this._orderPopupModel);
				this._oCrossAppNav = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
				this.isNavitationEnabled("MaintenanceOrder-change", "_bOrderChangeNavEnabled");
				this.isNavitationEnabled("MaintenanceObject-display", "_bMaintObjDispNavEnabled");
			},

			setContentToFragment: function (oEvent, oOwnerComponent, oViewModel, sSelectQuery) {
				var sPath = oEvent.getSource().getBindingContext().sPath;
				var maintenanceOrder = oEvent.getSource().getBindingContext().getProperty("MaintenanceOrder");
				var maintAssetBoardReadKey = oEvent.getSource().getBindingContext().getProperty("MaintAssetBoardReadableKey");
				var aFilter = [];

				if (sPath.startsWith("/C_RSHOrdersAnd")) {
					sPath = "/C_RSHOrdersAndOperations";
					aFilter.push(
						new Filter({
							filters: [
								new Filter("MaintenanceOrder", FilterOperator.EQ, maintenanceOrder),
								new Filter("OrderOperationRowLevel", FilterOperator.EQ, 0)
							],
							and: true
						})
					);
				} else if (sPath.startsWith("/C_RSHOrders")) {
					sPath = "/C_RSHOrders";
					aFilter.push(new Filter("MaintenanceOrder", FilterOperator.EQ, maintenanceOrder));
				} else if (sPath.startsWith("/C_RSHMaintAssetBoardSet")) {
					aFilter.push(new Filter("MaintAssetBoardReadableKey", FilterOperator.EQ, maintAssetBoardReadKey));
				}

				this.orderInfo = [];
				var oLink = oEvent.getSource();
				oLink.setBusyIndicatorDelay(0);
				oLink.setBusy(true);

				var oUrlParams = {
					$expand: "to_OrderActiveStatus,to_OrderDetails"
				};
				if (sSelectQuery) {
					oUrlParams = {
						$expand: "to_OrderActiveStatus,to_OrderDetails",
						$select: sSelectQuery
					};
				}

				oViewModel.read(sPath, {
					groupId: "batchOrderData",
					filters: aFilter,
					urlParameters: oUrlParams,
					success: function (oData) {
						var oSingleEntry = oData.results ? oData.results[0] : oData;
						this._prepareFragmentData(oSingleEntry);
						this._oFragment.openBy(oLink);
						oLink.setBusy(false);
					}.bind(this)
				});
			},

			/**
			 * This method prepares the Json Data which is then bound to quick view
			 * @param {Object} oData		returned from the oData Read call
			 * @param {String} sDescription	Description that is formed using the Orderid and description
			 * @private
			 */
			_prepareFragmentData: function (oData) {
				var reuseResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rsh.eam.lib.common");
				var oFragmentJSON = {
					pages: [
						{
							pageId: "idOrderPopupPage",
							header: reuseResourceBundle.getText("titleOrderPopup"),
							groups: [
								{
									heading: reuseResourceBundle.getText("Details"),
									elements: [
										{
											label: reuseResourceBundle.getText("orderDescription"),
											value:
												(oData.MaintenanceOrder ? oData.MaintenanceOrder : oData.to_OrderDetails.MaintenanceOrder) +
												" " +
												(oData.MaintenanceOrderDesc ? oData.MaintenanceOrderDesc : oData.MaintAssetBoardRowDescription),
											elementType: this._bOrderChangeNavEnabled ? sap.m.QuickViewGroupElementType.link : sap.m.QuickViewGroupElementType.text,
											url: this._bOrderChangeNavEnabled
												? this.getOrderChangeLinkUrl(oData.MaintenanceOrder ? oData.MaintenanceOrder : oData.to_OrderDetails.MaintenanceOrder)
												: ""
										},
										{
											label: reuseResourceBundle.getText("userStatus"),
											value:
												(oData.to_OrderActiveStatus.results && oData.to_OrderActiveStatus.results.length) > 0
													? this.concatenateValues(oData.to_OrderActiveStatus.results, "StatusShortName", "StatusName")
													: reuseResourceBundle.getText("noUserStatus"),
											elementType: sap.m.QuickViewGroupElementType.text
										},
										{
											label: reuseResourceBundle.getText("orderMaterialAvailabilityStatus"),
											value: oData.MaterialStatusKey ? oData.MaterialStatusKey + ": " + oData.MaterialStatusText : "",
											elementType: sap.m.QuickViewGroupElementType.text
										},
										{
											label: reuseResourceBundle.getText("orderLongText"),
											value: oData.to_OrderDetails.MaintOrderOperationLongText
												? oData.to_OrderDetails.MaintOrderOperationLongText
												: reuseResourceBundle.getText("noOrderLongText"),
											elementType: sap.m.QuickViewGroupElementType.text
										}
									]
								},
								{
									heading: reuseResourceBundle.getText("referenceTechnicalObjects"),
									elements: [
										{
											label: reuseResourceBundle.getText("FunctionalLocation"),
											value: oData.FunctionalLocation
												? oData.FunctionalLocation + ": " + oData.FunctionalLocationName
												: reuseResourceBundle.getText("NoFunctionalLocation"),
											elementType:
												oData.FunctionalLocation && this._bMaintObjDispNavEnabled
													? sap.m.QuickViewGroupElementType.link
													: sap.m.QuickViewGroupElementType.text,
											url:
												oData.FunctionalLocation && this._bMaintObjDispNavEnabled ? this.getMaintObjLinkUrl(oData.FunctionalLocation, "EAMS_FL") : ""
										},
										{
											label: reuseResourceBundle.getText("Equipment"),
											value: oData.Equipment ? oData.Equipment + ": " + oData.EquipmentName : reuseResourceBundle.getText("NoEquipment"),
											elementType:
												oData.Equipment && this._bMaintObjDispNavEnabled
													? sap.m.QuickViewGroupElementType.link
													: sap.m.QuickViewGroupElementType.text,
											url: oData.Equipment && this._bMaintObjDispNavEnabled ? this.getMaintObjLinkUrl(oData.Equipment, "EAMS_EQUI") : ""
										}
									]
								}
							]
						}
					]
				};
				this._orderPopupModel.setData(oFragmentJSON);
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
