/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/BaseViewChild.controller"], function (BaseViewChildController) {
	"use strict";

	return BaseViewChildController.extend("zrift.rsh.eam.ordergantts1.mvc.ordergantt.actions.ScheduleOrders.controller", {
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
						this.controllers.message.addMessage(this.oBundle.getText("SelectOnlyOneOrder"), "Error", "Dialog");
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
				this.controllers.message.addMessage(this.oBundle.getText("InProcessOrderSch"), "Error", "Dialog");
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
			this.controllers.message.addMessage(this.oBundle.getText("ScheduleSuccess"), "Success", "Toast");
			var oRefreshParams = {
				fetchAllOps: true,
				orderOps: [
					{
						order: oOrder.MaintenanceOrder,
						checkCrossOrders: true
					}
				]
			};
			this.controllers.deltaRefresh.refresh(oRefreshParams);
			this.byId("idOrderGanttContainer").setBusy(false);
		},

		_onError: function () {
			this.controllers.message.addMessage(this.oBundle.getText("ScheduleError"), "Error", "Popover");
			this.byId("idOrderGanttContainer").setBusy(false);
		}
	});
});
