sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/m/MessageToast"
	],
	function (BaseViewChildController, MessageToast) {
		"use strict";

		return BaseViewChildController.extend("zrsh.eam.ordergantts1.mvc.ordergantt.actions.RiftPrint.controller", {
			onInitMembers: function () {
				this._oCrossAppNav = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
			},

			// Opens the Rift Print app (ZPM_RIFT_PRINT-display) for the orders selected in the order table
			print: function () {
				var aSelectedContexts = this.controllers.orderGantt.getSelectedBindingContexts();
				var aOrderNumbers = [];

				aSelectedContexts.forEach(function (oContext) {
					var sOrder = oContext.getProperty("MaintenanceOrder");
					if (sOrder && aOrderNumbers.indexOf(sOrder) === -1) {
						aOrderNumbers.push(sOrder);
					}
				});

				if (aOrderNumbers.length === 0) {
					MessageToast.show(this.oBundle.getText("RiftPrintNoOrdersSelected"));
					return;
				}

				MessageToast.show(this.oBundle.getText("RiftPrintSelectedOrders", [aOrderNumbers.join(", ")]));

				var sHash = this._oCrossAppNav.hrefForExternal({
					target: {
						semanticObject: "ZPM_RIFT_PRINT",
						action: "display"
					},
					params: {
						P_ORDER: aOrderNumbers.join(",")
					}
				});
				// Open in a new tab so the scheduling board (filters, loaded data, selection) stays as it is
				sap.m.URLHelper.redirect(sHash, true);
			}
		});
	}
);
