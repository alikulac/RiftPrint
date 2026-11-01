/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/rsh/eam/lib/common/base/BaseViewChild.controller", "sap/rsh/eam/lib/common/utils/utils", "sap/rsh/eam/lib/common/utils/Constants"],
	function (BaseViewChildController, Utils, Constants) {
		"use strict";

		return BaseViewChildController.extend("zrsh.eam.ordergantts1.mvc.ordergantt.Messages.controller", {
			onInitMembers: function () {
				this.oTreeTable = this.byId("idOrderTreeTable");
				this.oMessageManager = sap.ui.getCore().getMessageManager();
			},

			removeAll: function () {
				this.oMessageManager.removeAllMessages();
			},

			// before cleanup: SchedulingBoard.selectTableRows
			removeMessagesByRow: function (aRowIndices) {
				for (var i = 0; i < aRowIndices.length; i++) {
					var oContext = this.oTreeTable.getContextByIndex(aRowIndices[i]);
					var sPath = decodeURIComponent(oContext.getPath());
					if (sPath) {
						var sTarget = sPath;
						if (sPath.substring(0, 1) === "/") {
							sTarget = sPath.substring(1);
						}
						var aMessages = this._getMessagesFromTarget(sTarget);
						this.oMessageManager.removeMessages(aMessages);
					}
				}
			},

			_getMessagesFromTarget: function (sTarget) {
				var oMessageModel = this.oMessageManager.getMessageModel();
				var aMessages = oMessageModel.getProperty("/");
				var aMessagesFromTarget = [];
				aMessages.forEach(function (oMessage) {
					if (oMessage.target === sTarget) {
						aMessagesFromTarget.push(oMessage);
					}
				});
				return aMessagesFromTarget;
			}
		});
	}
);
