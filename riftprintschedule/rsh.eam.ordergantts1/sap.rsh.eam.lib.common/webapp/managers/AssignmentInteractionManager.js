/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/rsh/eam/lib/common/managers/AbstractInteractionManager", "sap/ui/model/Filter", "sap/ui/model/FilterOperator"],
	function (AbstractInteractionManager, Filter, FilterOperator) {
		"use strict";

		return AbstractInteractionManager.extend("sap.rsh.eam.lib.common.managers.AssignmentInteractionManager", {
			/**
			 * Constructor for the LIM, this sets the model that the LIM will use
			 * @param {Object} oIncomingModel Selected operations for this session
			 * @public
			 * */
			constructor: function (oIncomingModel) {
				AbstractInteractionManager.prototype.constructor.apply(this, [oIncomingModel]);

				this.base = this; // To clarify where the AIM is used we simply prefix the calls with 'base'

				this.oAssignmentActions = {
					CREATE_DRAFT_ASSIGNMENT: "/AF8DF0DE597CD9BF354AA1C976BCreate_drafts",
					SAVE_ORDERS: "/C_RSHMaintOperationAssignmentSave_orders"
				};
			},

			createDraftAssignment: function (aPayload, fSuccessCallBack, fFailureCallBack, bRefreshAfterChange) {
				this.base._callFunction(aPayload, this.oAssignmentActions.CREATE_DRAFT_ASSIGNMENT, fSuccessCallBack, fFailureCallBack, bRefreshAfterChange);
			},

			saveOrders: function (aPayload, fSuccessCallBack, fFailureCallBack) {
				this.base._callFunction(aPayload, this.oAssignmentActions.SAVE_ORDERS, fSuccessCallBack, fFailureCallBack, false);
			},

			reset: function (aKeysToReset, fSuccessCallBack, fFailureCallBack) {
				if (!(aKeysToReset && aKeysToReset.length > 0)) {
					fFailureCallBack();
					return;
				}

				// Set this group to deferred
				var GROUP_ID = "RESET_ASSIGNMENTS",
					CHANGE_SET_ID = "RESET_ASSIGNMENTS";

				this.base.setDeferredGroups([GROUP_ID]);

				for (var i = 0; i < aKeysToReset.length; i++) {
					this.base.remove(aKeysToReset[i], {
						groupId: GROUP_ID,
						changeSetId: CHANGE_SET_ID,
						refreshAfterChange: false
					});
				}

				this.base.submitPendingChanges(GROUP_ID, fSuccessCallBack, fFailureCallBack);
			}
		});
	}
);
