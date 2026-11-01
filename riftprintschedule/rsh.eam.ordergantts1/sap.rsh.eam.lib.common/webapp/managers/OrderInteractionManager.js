/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/managers/AbstractInteractionManager"], function (AbstractInteractionManager) {
	"use strict";

	return AbstractInteractionManager.extend("sap.rsh.eam.lib.common.managers.OrderInteractionManager", {
		/**
		 * Constructor for the AIM, this sets the model that the AIM will use
		 * @param {Object} oIncomingModel Selected operations for this session
		 * @public
		 * */
		constructor: function (oIncomingModel) {
			AbstractInteractionManager.prototype.constructor.apply(this, [oIncomingModel]);

			this.base = this; // To clarify where the AIM is used we simply prefix the calls with 'base'

			this.oOrderActions = {
				CHANGE_ORDER_SCHEDULING: "/C_ObjPgMaintOrderChangescheduling"
			};
		},

		changeOrderScheduling: function (aPayload, fSuccessCallBack, fFailureCallBack, bDeferRequest) {
			var bRefreshAfterChange = false;
			this.base._callFunction(
				aPayload,
				this.oOrderActions.CHANGE_ORDER_SCHEDULING,
				fSuccessCallBack,
				fFailureCallBack,
				bRefreshAfterChange,
				null,
				bDeferRequest
			);
		}
	});
});
