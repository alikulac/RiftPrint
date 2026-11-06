sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/m/MessageToast"
	],
	function (BaseViewChildController, MessageToast) {
		"use strict";

		return BaseViewChildController.extend("zrift.rsh.eam.ordergantts1.mvc.ordergantt.actions.SelectRows.controller", {
			onInitMembers: function () {
				this._oSelectionPlugin = this.byId("idMultiSelectionPlugin");
			},

			// Selects all rows loaded in the order table (all orders and the operations of expanded orders)
			selectAll: function () {
				var oBinding = this.byId("idOrderTreeTable").getBinding("rows");
				if (!oBinding || oBinding.getLength() === 0) {
					MessageToast.show(this.oBundle.getText("SelectAllNoRows"));
					return;
				}

				Promise.resolve()
					.then(this._oSelectionPlugin.selectAll.bind(this._oSelectionPlugin))
					.catch(function () {
						MessageToast.show(this.oBundle.getText("SelectAllNoRows"));
					}.bind(this));
			},

			deselectAll: function () {
				this.controllers.orderGantt.clearSelection();
			}
		});
	}
);
