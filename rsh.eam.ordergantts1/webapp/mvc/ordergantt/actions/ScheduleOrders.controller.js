/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/ItemHashMap"
	],
	function (BaseViewChildController, Utils, Constants, ItemHashMap) {
		"use strict";

		return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.ordergantt.actions.ScheduleOrders.controller", {
			schedule: function (oShape) {
				if (oShape) {
					this._scheduleShapeOrder(oShape);
				} else {
					this._scheduleSelectedOrder();
				}
			},

			// before cleanup: SchedulingBoard.onOrderContextMenuTriggerSchedulingAction
			_scheduleShapeOrder: function (oShape) {
				var oOrder = oShape.getBindingContext().getObject();
				this._callSchedulingService(oOrder);
				var oGanttChartWithTable = this.byId("idOrderGanttChartWithTable");
				oGanttChartWithTable.deselectShapes(oGanttChartWithTable.getSelectedShapeUid());
			},

			// before cleanup: SchedulingBoard.onPressScheduleOrderButton
			_scheduleSelectedOrder: function () {
				var aSelectedItemsContext = this.controllers.orderGantt.getSelectedBindingContexts();
				var bOneHeaderRowSelected = false;
				var oOrder;

				// If more than 1 order is selected, we give error message saying only one is to be selected.
				for (var i = 0; i < aSelectedItemsContext.length; i++) {
					var oSelectedOrder = aSelectedItemsContext[i].getObject();
					if (oSelectedOrder.OrderOperationRowLevel === 0) {
						if (bOneHeaderRowSelected === true) {
							Utils.addMessage(this.oBundle.getText("SelectOnlyOneOrder"), sap.ui.core.MessageType.Error, Constants.sDisplayTypeMessageBox);
							return;
						} else {
							bOneHeaderRowSelected = true;
							oOrder = oSelectedOrder;
						}
					}
				}

				this._callSchedulingService(oOrder);
			},

			_callSchedulingService: function (oOrder) {
				if (oOrder.OrderOperationRowLevel !== 0) {
					Utils.addMessage(this.oBundle.getText("InProcessOrderSch"), sap.ui.core.MessageType.Error, Constants.sDisplayTypeMessageBox);
					return;
				}

				this.byId("idOrderGanttContainer").setBusy(true);

				var oParams = {
					modelName: "relationshipModel",
					path: "/ScheduleMaintenanceOrder",
					urlParameters: {
						MaintenanceOrder: oOrder.MaintenanceOrder
					}
				};
				this.controllers.modelPromises.callFunction(oParams).then(this._onSuccess.bind(this, oOrder), this._onError.bind(this));
			},

			_onSuccess: function (oOrder) {
				var oTargetParams = new ItemHashMap();
				var oValues = {
					order: oOrder.MaintenanceOrder,
					action: Constants.scheduleOrderAction
				};
				oTargetParams.put([oOrder.MaintenanceOrder, "", Constants.scheduleOrderAction], oValues, "");
				oTargetParams.parameters = {};
				oTargetParams.parameters.bRefreshOfSourceAppRequired = true;

				Utils.addMessage(this.oBundle.getText("ScheduleSuccess"), sap.ui.core.MessageType.Success, Constants.sDisplayTypeMessageToast);

				this.controllers.deltaRefresh.refresh(oTargetParams);
				this.byId("idOrderGanttContainer").setBusy(false);
			},

			_onError: function () {
				Utils.addMessage(this.oBundle.getText("ScheduleError"), sap.ui.core.MessageType.Error, Constants.sDisplayTypeMessagePopover);
				this.byId("idOrderGanttContainer").setBusy(false);
			}
		});
	}
);
