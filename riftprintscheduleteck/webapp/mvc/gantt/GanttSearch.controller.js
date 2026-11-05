/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/m/BusyDialog",
		"sap/gantt/misc/Utility",
		"sap/tnt/NavigationListItem",
		"sap/tnt/NavigationList",
		"sap/rsh/eam/lib/common/utils/formatter"
	],
	function (BaseViewChildController, BusyDialog, GanttUtility, NavigationListItem, NavigationList, commonFormatter) {
		"use strict";

		return BaseViewChildController.extend("zrsh.eam.ordergantts1.mvc.gantt.GanttSearch.controller", {
			commonFormatters: commonFormatter,

			onInitMembers: function () {
				this.oGanttChartContainer = this.byId("idOrderGanttContainer");
				this.oTreeTable = this.byId("idOrderTreeTable");
				this._oFindBusyDialog = undefined;
			},

			onGanttSidePanel: function (oEvent) {
				oEvent.getParameters().updateSidePanelState.enable();
			},

			onSearchResultsCompute: function (oEvent) {
				var aSearchResults = oEvent.getParameters().searchResults;
				var aFilteredSearchResults = [];
				var aOrderAttributes = ["MaintenanceOrder", "MaintenanceOrderDesc"];

				aSearchResults.forEach(function (oResult) {
					var aMatchedAttributes = Object.keys(oResult.oMatchedValue);
					var bIsAnOrderSearch = aMatchedAttributes.every(function (sMatchedAttribute) {
						return aOrderAttributes.includes(sMatchedAttribute) ? true : false;
					});
					if (!bIsAnOrderSearch || (bIsAnOrderSearch && oResult.data.OrderOperationRowLevel === 0)) {
						aFilteredSearchResults.push(oResult);
					}
				});
				this.oGanttChartContainer.setProperty("customSearchResults", aFilteredSearchResults, true);
			},

			onFindShapes: function (oEvent) {
				this.oGanttChartContainer.setBusy(false);

				var oBinding = this.oTreeTable.getBinding();
				var iLoadedOrders = oBinding.oKeys.null.length;
				var iTotalOrders = this.getModel("UIModel").getProperty("/rowCount");

				if (!this._oFindBusyDialog) {
					this._oFindBusyDialog = new BusyDialog({
						title: this.oBundle.getText("FindAndSelectBusyDialogTitle")
					});
				}
				this._oFindBusyDialog.setText(this.oBundle.getText("FindAndSelectBusyDialogText", [iTotalOrders]));
				this._oFindBusyDialog.open();

				if (iTotalOrders && iLoadedOrders < iTotalOrders) {
					this._loadAllOrdersAndSearch();
				} else {
					this.oGanttChartContainer.updateSearch();
				}
			},

			_loadAllOrdersAndSearch: function () {
				var oBinding = this.oTreeTable.getBinding();
				var aExpandedOrdersBindingPaths = Object.keys(oBinding.oKeys).filter(function (sBindingPath) {
					return sBindingPath !== "null";
				});

				var iTotalOrders = this.getModel("UIModel").getProperty("/rowCount");
				var iOldThreshold = this.oTreeTable.getThreshold();

				// Disregard lazy loading and request all the orders from the backend
				this.oTreeTable.setThreshold(iTotalOrders);
				this.controllers.ordergantt.binding.refreshBinding({ filtersChanged: true, force: false });
				this.oTreeTable.setThreshold(iOldThreshold);

				if (aExpandedOrdersBindingPaths.length) {
					this._expandOrdersAndSearch(aExpandedOrdersBindingPaths);
				} else {
					oBinding.attachEventOnce(
						"dataReceived",
						function () {
							this.oGanttChartContainer.updateSearch();
						}.bind(this)
					);
				}
			},

			_expandOrdersAndSearch: function (aExpandedOrdersBindingPaths) {
				var oBinding = this.oTreeTable.getBinding();

				this.oGanttChartWithTable.attachEventOnce(
					"renderingComplete",
					function () {
						var aExpandedOrderRowIndices = [];
						aExpandedOrdersBindingPaths.forEach(
							function (sBindingPath) {
								var sOrderOperationRowId = this.oModel.getData("/" + sBindingPath).OrderOperationRowID;
								var aShapeUids = this.oGanttChartWithTable.getShapeUids({
									shapeId: sOrderOperationRowId,
									highlightable: true
								});
								if (aShapeUids.length) {
									var iRowIndex = parseInt(GanttUtility.parseUid(aShapeUids[0]).rowIndex, 10);
									aExpandedOrderRowIndices.push(iRowIndex);
								}
							}.bind(this)
						);

						if (aExpandedOrderRowIndices.length) {
							this.oTreeTable.expand(aExpandedOrderRowIndices);

							oBinding.attachEventOnce(
								"dataReceived",
								function () {
									this.oGanttChartContainer.updateSearch();
								}.bind(this)
							);
						} else {
							this.oGanttChartContainer.updateSearch();
						}
					}.bind(this)
				);
			},

			onSearchSidePanelRender: function (oEvent) {
				var aSearchResults = oEvent.getParameters().searchResults;

				var aSearchResultsListItems = aSearchResults.map(
					function (oResult, iCount) {
						// Template:
						// <chevron icon> 4004711 Repair Pump : <matches>
						// <circle icon> 4004711/0010 Replace Seal : <matches>
						var sIcon = this.commonFormatters.imageOrder(oResult.data.OrderOperationRowLevel);
						var sShapeId = oResult.data.MaintenanceOrder;
						if (oResult.data.OrderOperationRowLevel === 0) {
							sShapeId += " " + oResult.data.MaintenanceOrderDesc;
						} else {
							sShapeId += "/" + oResult.data.MaintenanceOrderOperation + " " + oResult.data.OperationDescription;
						}
						var aMatchedValues = Object.values(oResult.oMatchedValue);
						var sMatchedValue = aMatchedValues.join(", ");

						var oListItem = new NavigationListItem({
							icon: sIcon,
							text: (sShapeId + " : " + sMatchedValue).substring(0, 200),
							id: "listItem" + iCount
						});
						return oListItem;
					}.bind(this)
				);
				var aSearchResultsList = new NavigationList({
					items: [aSearchResultsListItems]
				});
				this.oGanttChartContainer.setSearchSidePanelList(aSearchResultsList);

				if (this._oFindBusyDialog) {
					this._oFindBusyDialog.close();
				}
			}
		});
	}
);
