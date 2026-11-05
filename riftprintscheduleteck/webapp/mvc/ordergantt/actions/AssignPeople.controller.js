/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/BaseViewChild.controller"], function (BaseViewChildController) {
	"use strict";

	return BaseViewChildController.extend("zrsh.eam.ordergantts1.mvc.ordergantt.actions.AssignPeople.controller", {
		onInitMembers: function () {
			this.oGanttChartContainer = this.byId("idOrderGanttContainer");
		},

		assign: function (aMenuShapePaths) {
			var oContainerSettings = this.controllers.ganttContainer.getSettings();
			var oTimePeriod = this.controllers.timePeriod.get();
			var bCondensedModeActive = this.controllers.ganttContainer.isCondensed();
			this.controllers.ordergantt.peopleGanttDialog.open(oTimePeriod, aMenuShapePaths, oContainerSettings, bCondensedModeActive).then(
				function (oRefreshParams) {
					if (oRefreshParams) {
						this.controllers.deltaRefresh.refresh(oRefreshParams);
					}
				}.bind(this)
			);
		},

		unassign: function (aMenuShapePaths) {
			this.oGanttChartContainer.setBusy(true);
			this.controllers.ordergantt.unassignPeople.unassignSplits(aMenuShapePaths).then(
				function (oRefreshParams) {
					if (oRefreshParams) {
						this.controllers.deltaRefresh.refresh(oRefreshParams);
					}
				}.bind(this)
			);
		}
	});
});
