/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * Parent Controller for the Mass Change of Operations OR Orders
 * @author: D053364
 * @name sap.rsh.eam.lib.common.controller.MyDialogDelegate
 */
sap.ui.define(
	["sap/rsh/eam/lib/common/controller/BaseDelegate", "sap/rsh/eam/lib/common/utils/Constants", "sap/rsh/eam/lib/common/utils/utils"],
	function (BaseDelegate, Constants, Utils) {
		"use strict";
		return BaseDelegate.extend("sap.rsh.eam.lib.common.controller.MyDialogDelegate", {
			_utils: Utils,

			/**
			 * Fragment Initialization method
			 *
			 */
			onInit: function () {
				this._oResourceModel = sap.ui.getCore().getLibraryResourceBundle("sap.rsh.eam.lib.common");
			},

			/**
			 * Called to remove the operations/orders from the table in Mass Change Dialog
			 * @public
			 * @param {string} sPath path
			 * @param {string} sParameterName parameter name
			 * @param {string} sTableName table name
			 * @param {string} sMassChangeDialogName dialog name
			 * @param {string} sItemModelName item model name
			 * @returns {boolean} true or false
			 */
			deleteMassChangeRows: function (sPath, sParameterName, sTableName, sMassChangeDialogName, sItemModelName) {
				var idx = parseInt(sPath.substring(sPath.lastIndexOf("/") + 1), 0);
				var oSelectedItemsList = this.byId(sTableName);

				if (oSelectedItemsList.getItems().length === 1) {
					if (sMassChangeDialogName === Constants.operationMassChange) {
						this._utils.addMessage(
							this._oResourceModel.getText("DeletingLastOperationInChangeDialog"),
							sap.ui.core.MessageType.Error,
							Constants.sDisplayTypeMessageBox
						);
					} else {
						this._utils.addMessage(
							this._oResourceModel.getText("DeletingLastOrderInChangeDialog"),
							sap.ui.core.MessageType.Error,
							Constants.sDisplayTypeMessageBox
						);
					}
					return false;
				} else {
					var dataModel = oSelectedItemsList.getModel(sItemModelName);
					var data = dataModel.getData();
					data.splice(idx, 1);
					dataModel.setData(data);
					return true;
				}
			},

			/**
			 * Close the Change Popup e.g. after press the Cancel Button
			 * @public
			 * @param {string} [oEvent]   Event   event bus parameter
			 */
			onCloseDialog: function (oEvent) {
				if (this._oDatePopOver) {
					this._oDatePopOver.destroy();
				}
				this._oFragment.destroy();
				//Accessibility - putting lost focus back at Change button
				setTimeout(
					function () {
						this._oButton.focus();
					}.bind(this),
					0
				);
				var oEventBus = sap.ui.getCore().getEventBus();
				oEventBus.publish(Constants.sLibraryChannel, Constants.sAfterMassChangeDialogClosed, this);
			}
		});
	}
);
