/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
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

		return BaseViewChildController.extend("zrsh.eam.ordergantts1.mvc.ordergantt.actions.OpenOrders.controller", {
			onInitMembers: function () {
				this.oOrderGantt = this.byId("idOrderGanttChartWithTable");
				this._oCrossAppNav = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
			},

			// before cleanup: SchedulingBoard.onOrderContextMenuOpenOrderAction
			onOpenOrderByContextMenu: function (oShape) {
				var aSelectedShapeUid = this.oOrderGantt.getSelectedShapeUid();
				var aSelectedShapeOrder = [];
				var sOrder, sOpShapePath;
				var bRightClickedShapeOnly = aSelectedShapeUid.length === 0;
				if (bRightClickedShapeOnly) {
					sOrder = oShape.getBindingContext().getObject().MaintenanceOrder;
					aSelectedShapeOrder.push(sOrder);
				} else {
					aSelectedShapeUid.forEach(
						function (sShapeUid) {
							sOpShapePath = GanttUtility.parseUid(sShapeUid).shapeDataName;
							var bSelectedShapeIsOrder = this.oModel.getData(sOpShapePath).OrderOperationRowLevel === 0;
							if (bSelectedShapeIsOrder) {
								sOrder = this.oModel.getData(sOpShapePath).MaintenanceOrder;
								aSelectedShapeOrder.push(sOrder);
							}
						}.bind(this)
					);
				}
				if (aSelectedShapeOrder.length > 5) {
					Utils.addMessage(this.oBundle.getText("MoreThanFiveOrdersSelected"), sap.ui.core.MessageType.Error, Constants.sDisplayTypeMessageBox);
				} else {
					var sAction = aSelectedShapeOrder.length === 1 ? "change" : "display";
					aSelectedShapeOrder.forEach(
						function (sSelectedShapeOrder) {
							var oArgs = {
								target: {
									semanticObject: "MaintenanceOrder",
									action: sAction
								},
								params: {
									MaintenanceOrder: sSelectedShapeOrder
								}
							};
							var sHash = this._oCrossAppNav.hrefForExternal(oArgs);
							sap.m.URLHelper.redirect(sHash, true);
						}.bind(this)
					);
				}

				this.oOrderGantt.deselectShapes(aSelectedShapeUid);
			}
		});
	}
);
