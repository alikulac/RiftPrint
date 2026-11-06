/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/gantt/misc/Utility",
		"sap/rsh/eam/lib/common/utils/utils"
	],
	function (BaseViewChildController, Constants, GanttUtility, Utils) {
		"use strict";

		return BaseViewChildController.extend("zrift.rsh.eam.ordergantts1.mvc.ordergantt.actions.OpenOrders.controller", {
			onInitMembers: function () {
				this.oOrderGantt = this.byId("idOrderGanttChartWithTable");
			},

			// before cleanup: SchedulingBoard.onOrderContextMenuOpenOrderAction
			onOpenOrderByContextMenu: function (oShape) {
				var aSelectedShapeUid = this.oOrderGantt.getSelectedShapeUid();
				var aSelectedShapeOrder = [];
				var sOrder, sOpShapePath;

				aSelectedShapeUid.forEach(
					function (sShapeUid) {
						sOpShapePath = GanttUtility.parseUid(sShapeUid).shapeDataName;
						sOrder = this.oModel.getData(sOpShapePath).MaintenanceOrder;
						aSelectedShapeOrder.push(sOrder);
					}.bind(this)
				);

				if (aSelectedShapeOrder.length > 5) {
					this.controllers.message.addMessage(this.oBundle.getText("MoreThanFiveOrdersSelected"), "Error", "Dialog");
				} else {
					var sAction = aSelectedShapeOrder.length === 1 ? "change" : "display";
					aSelectedShapeOrder.forEach(
						function (sSelectedShapeOrder) {
							var oParams = {
								MaintenanceOrder: sSelectedShapeOrder
							};
							this.controllers.navigation.navigateNewTab("MaintenanceOrder", sAction, oParams);
						}.bind(this)
					);
				}
				this.oOrderGantt.deselectShapes(aSelectedShapeUid);
			}
		});
	}
);
