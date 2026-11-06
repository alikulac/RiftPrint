/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/rsh/eam/lib/common/quickviews/ScheduleQuickView.controller",
		"sap/rsh/eam/lib/common/quickviews/MaintenanceEventQuickView.controller"
	],
	function (BaseViewChildController, ScheduleQuickViewController, MaintenanceEventQuickViewController) {
		"use strict";

		return BaseViewChildController.extend("zrift.rsh.eam.ordergantts1.mvc.ordergantt.QuickViews.controller", {
			onInitMembers: function () {
				var oReadModel = this.oComponent.getModel("readModel");
				this.controllers.scheduleQuickView = new ScheduleQuickViewController({
					component: this.oComponent,
					dependent: this.getView(),
					readModel: oReadModel
				});
				this.controllers.maintenanceEventQuickView = new MaintenanceEventQuickViewController({
					component: this.oComponent,
					dependent: this.getView(),
					readModel: oReadModel
				});
			},

			openSchedules: function (oEvent) {
				var oLink = oEvent.getSource();
				var oOrderOp = oLink.getBindingContext().getObject();
				var bOpenSchedulesApp = oOrderOp.NumberOfMaintSchedSimulations === 0;
				if (bOpenSchedulesApp) {
					var oParams = {
						MaintSchedSimlnUUID: oOrderOp.MaintSchedSimlnUUID
					};
					this.controllers.navigation.navigate("WorkCenterUtilization", "operationsLeveling", oParams, undefined);
				} else {
					this.controllers.scheduleQuickView.open(oEvent);
				}
			},

			openMaintEvent: function (oEvent) {
				var oLink = oEvent.getSource();
				var oOrderOp = oLink.getBindingContext().getObject();
				this.controllers.maintenanceEventQuickView.open(oLink, oOrderOp);
			}
		});
	}
);
