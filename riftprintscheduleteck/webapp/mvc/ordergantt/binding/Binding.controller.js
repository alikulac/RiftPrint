/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/ui/core/routing/HashChanger",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/ui/model/FilterType"
	],
	function (BaseViewChildController, Constants, HashChanger, Utils, FilterType) {
		"use strict";

		return BaseViewChildController.extend("zrsh.eam.ordergantts1.mvc.ordergantt.binding.Binding.controller", {
			onInit: function () {
				BaseViewChildController.prototype.onInit.apply(this, arguments);
				this._bindFirstTime();
			},

			onInitMembers: function () {
				this._oTable = this.byId("idOrderTreeTable");
				this._oGantt = this.byId("idOrderGanttChartWithTable");
				this._bNavWarningRaised = false;
				this._bOperationPagingRequest = false; // before cleanup: _bPagingRequestOfSubnodes
			},

			_bindFirstTime: function () {
				this._oTable.bindRows({
					path: "/C_RSHOrdersAndOperations",
					parameters: {
						treeAnnotationProperties: {
							hierarchyLevelFor: "OrderOperationRowLevel",
							hierarchyNodeFor: "OrderOperationRowID",
							hierarchyParentNodeFor: "OrderOperationParentRowID",
							hierarchyDrillStateFor: "OrderOperationIsExpanded"
						},
						gantt: {
							rowIdName: "OrderOperationRowID"
						},
						groupId: "iDBatchOrderFilterRequest"
					},
					events: {
						dataReceived: this._onDataReceived.bind(this),
						change: this._onChange.bind(this)
					}
				});
			},

			// this function triggers a request (as compared to _updateBindingFor...)
			// in some scenarios it is called multiple times for one user interaction
			// but UI5 makes sure that only a single request is send
			// (as we are only calling filter/sort/refresh on an existing binding but do not create a new one)
			refreshBinding: function (oParams) {
				var oBinding = this._oTable.getBinding("rows");

				this.controllers.ordergantt.columnFields.setOrderFields();

				// expand & select
				// this must be done before filter/sort/refresh as additional requests were observed otherwise
				var aSelect = this.controllers.ordergantt.fields.getOrderSelectFields();
				var aExpand = this.controllers.ordergantt.fields.getExpandFields();
				this._updateSelectAndExpand(aSelect, aExpand);

				// filter
				var oFilter = this.controllers.ordergantt.filters.get();
				oBinding.filter(oFilter, FilterType.Application);

				// sort
				var aSorters = this.controllers.ordergantt.sort.getOrderSorters();
				oBinding.sort(aSorters);

				// force refresh
				if (oParams.force) {
					oBinding.refresh(true);
				}

				this.controllers.ordergantt.expandOrders.resetPerformanceFilter();
			},

			// before cleanup: SchedulingBoard._onChange
			_onChange: function (oEvent) {
				var sReason = oEvent.getParameter("reason");
				if (sReason === "expand") {
					this._onChangeExpand();
				}

				this.controllers.ordergantt.enableToolbarButtons.update();

				var bFromContextMenu = this.controllers.ordergantt.operationActionSheet.isActionFromMenu();
				if (bFromContextMenu) {
					this._oGantt.deselectShapes(this._oGantt.getSelectedShapeUid());
					this.controllers.ordergantt.operationActionSheet.resetActionFromMenu();
				}
			},

			// before cleanup: SchedulingBoard._onChange
			_onChangeExpand: function () {
				this._updateBindingForOperation();

				// Because dataReceived event of the first paging request is raised after the _onOrderGanttChange of the second page is called,
				// we need to assume as default that there will be more than one paging request
				// If this is not the case, it will be re-validated in the function handler of dataReceived event
				if (!Utils.isMockRun()) {
					this._bOperationPagingRequest = true;
				}
			},

			// before cleanup: SchedulingBoard._initBindingEventHandlers
			_onDataReceived: function (oEvent) {
				this._updateRowCount();
				this._informNotAllOperationsMayBeSeen();
				var oData = oEvent.getParameter("data");
				this._checkOperationPagingRequest(oData);
			},

			// before cleanup: SchedulingBoard._initBindingEventHandlers
			_updateRowCount: function () {
				var oBinding = this._oTable.getBinding("rows");
				var iCount = oBinding.oLengths.null;
				this.oUIModel.setProperty("/rowCount", iCount);
			},

			// Inform users about possible missing information if we're coming from Maintenance Schedule for Assets app
			// before cleanup: SchedulingBoard._initBindingEventHandlers
			_informNotAllOperationsMayBeSeen: function () {
				var sOldHash = HashChanger.getInstance().getCurrentNavigationState().oldHash;
				if (sOldHash && sOldHash.includes("WorkCenterUtilization-displayAssetBoard") && !this._bNavWarningRaised) {
					this._bNavWarningRaised = true;
					var oBinding = this._oTable.getBinding("rows");
					var iOrderCountInTable = oBinding.getLength();
					var oSmartFilterBar = this.byId("idOrderGanttSmartFilterBar");
					var oFilterData = oSmartFilterBar.getFilterData();
					if (oFilterData.MaintenanceOrder) {
						var iOrderCountInFilter = oFilterData.MaintenanceOrder.items.length;
						if (iOrderCountInFilter > 0 && iOrderCountInFilter !== iOrderCountInTable) {
							this.controllers.notAgainMessage.open({
								messageKey: "NotAllOperationsMayBeSeen",
								persKey: "ShowInfoOnNavFromAssetView"
							});
						}
					}
				}
			},

			// check whether it is a paging request
			// e.g. if an order has 250 operations and an expand of it is done, we need
			// to ensure for each batch of paging requests to select all 250 operations
			// we don't send Select fields for the order header
			// before cleanup: SchedulingBoard._initBindingEventHandlers
			_checkOperationPagingRequest: function (oData) {
				if (!oData) {
					return;
				}
				var iReceivedNumberOfSubnodes = oData.results.length;
				var iCountOfTotalSubnodes = oData.__count;
				var bOperationLevel = oData.results.length > 0 && oData.results[0].OrderOperationRowLevel === 1;
				this._bOperationPagingRequest = bOperationLevel && iReceivedNumberOfSubnodes < iCountOfTotalSubnodes;
				if (this._bOperationPagingRequest) {
					// Distinguish between the $Select for order and operation read call
					var oBinding = this._oTable.getBinding("rows");
					var OPERATION_RELEVANT_FIELD = "MaintenanceOrderOperation";
					if (oBinding.sCustomParams.indexOf(OPERATION_RELEVANT_FIELD) === -1) {
						this._updateBindingForOperation();
					}
				} else {
					// if no further paging requests of operations are expected,
					// we need to set switch to orders as the next request will be for order level
					if (bOperationLevel) {
						this._updateBindingForOrder();
					}
				}
			},

			// this function does not trigger a request (as compared to refreshBinding)
			// before cleanup: SchedulingBoard.setFinalSelectForOrderRequest
			_updateBindingForOrder: function () {
				this.controllers.ordergantt.columnFields.setOrderFields();

				// select & expand
				var aSelect = this.controllers.ordergantt.fields.getOrderSelectFields();
				var aExpand = this.controllers.ordergantt.fields.getExpandFields();
				this._updateSelectAndExpand(aSelect, aExpand);

				// sort
				var aSorters = this.controllers.ordergantt.sort.getOrderSorters();
				this._updateSort(aSorters);
			},

			// this function does not trigger a request (as compared to refreshBinding)
			// before cleanup: SchedulingBoard.setFinalSelectForOperationRequest
			_updateBindingForOperation: function () {
				this.controllers.ordergantt.columnFields.setOperationFields();

				// select & expand
				var aSelect = this.controllers.ordergantt.fields.getOperationSelectFields();
				var aExpand = this.controllers.ordergantt.fields.getExpandFields();
				this._updateSelectAndExpand(aSelect, aExpand);

				// sort
				var aSorters = this.controllers.ordergantt.sort.getOperationSorters();
				this._updateSort(aSorters);
			},

			// definitely some not allowed usage of UI5 private variables
			// and even not only for reading stuff but for modification
			// high risk of breaking on UI5 update
			// but was in the solution from beginning and no public API available
			_updateSelectAndExpand: function (aSelect, aExpand) {
				var oBinding = this._oTable.getBinding("rows");
				oBinding.sCustomParams = "$select=" + aSelect;
				if (aExpand.length > 0) {
					oBinding.sCustomParams += "&$expand=" + aExpand;
				}
			},

			// again some not allowed usage of UI5 private variables
			_updateSort: function (aSorters) {
				var oBinding = this._oTable.getBinding("rows");
				if (oBinding.aSorters && oBinding.aSorters.length > 0) {
					oBinding.aSorters[0].sPath = aSorters[0].sPath;
					oBinding.aSorters[0].bDescending = aSorters[0].bDescending;
				}
			},

			onFirstVisibleRowChanged: function () {
				var oBinding = this._oTable.getBinding("rows");
				if (oBinding) {
					//Reset $Select only when paging of operations is not requested.
					if (!this._bOperationPagingRequest) {
						this._updateBindingForOrder();
					}
				}
			},

			// Sets the model size limit based on the number of days in the current time period (N)
			// This is necessary as we display N shapes for utilization and non-working time
			// No other aggregation bindings in this app are affected
			// The binding of orders and ops of the tree table seems to ignore the size limit
			// before cleanup: SchedulingBoard.setThresholdForModelData
			setModelSizeLimit: function () {
				var sViewKey = this.controllers.ganttContainer.getViewKey();
				if (this.oUIModel.getProperty("/showUtilizationIndicator") || this.oUIModel.getProperty("/showNonWorkingTimes") || sViewKey !== "Orders") {
					var oTimePeriod = this.controllers.timePeriod.get();
					var iDiffTime = Math.abs(oTimePeriod.endDate - oTimePeriod.startDate);
					var iDiffDays = Math.ceil(iDiffTime / (1000 * 60 * 60 * 24));
					if (iDiffDays > 100) {
						this.oModel.setSizeLimit(iDiffDays);
					} else if (this.oModel.iSizeLimit > 100) {
						this.oModel.setSizeLimit(100);
					}
				}
			}
		});
	}
);
