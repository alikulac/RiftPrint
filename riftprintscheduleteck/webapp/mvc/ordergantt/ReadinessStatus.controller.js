/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/order/status/OrderReadinessStatus.controller"], function (OrderReadinessStatus) {
	"use strict";
	return OrderReadinessStatus.extend("rsh.eam.ordergantts1.mvc.ordergantt.OrderReadinessStatus.controller", {
		displayInfoDialog: function () {
			this.controllers.message
				.showConfirmationDialog({ titleKey: "InfoIcon", msgKey: "ReadinessStatusCannotBeDisplayedInCondensed", actionKey: "Confirm" })
				.then(
					function () {
						this.oUIModel.setProperty("/condensedModeActive", false);
						this.controllers.ganttContainer.setCondensed(false);
						this.controllers.persGanttSettings.save();
					}.bind(this)
				);
		}
	});
});
