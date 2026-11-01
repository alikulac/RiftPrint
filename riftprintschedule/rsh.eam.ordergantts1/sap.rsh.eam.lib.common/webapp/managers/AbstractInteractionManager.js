/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object"], function (oSAPObject) {
	"use strict";

	return oSAPObject.extend("sap.rsh.eam.lib.common.managers.AbstractInteractionManager", {
		/**
		 * Constructor for the LIM, this sets the model that the LIM will use
		 * @param {Object} oIncomingModel Selected operations for this session
		 * @public
		 * */
		constructor: function (oIncomingModel) {
			this.oModel = oIncomingModel;
		},

		create: function (sPath, oPayload, mParameters) {
			this.oModel.create(sPath, oPayload, mParameters);
		},

		_callFunction: function (aParams, sFunctionImportName, fSuccessCallBack, fFailureCallBack, bRefreshAfterChange, eTag, bDeferRequest, sGroupID) {
			var bRefreshAfterChangeLocal = bRefreshAfterChange;
			if (bRefreshAfterChangeLocal === undefined) {
				bRefreshAfterChangeLocal = true;
			}
			// Constants
			var GROUP_ID = sFunctionImportName,
				CHANGE_SET_ID = sFunctionImportName;

			if (sGroupID) {
				GROUP_ID = sGroupID;
				CHANGE_SET_ID = sGroupID;
			}

			this.oModel.setDeferredGroups([GROUP_ID]);

			try {
				for (var i = 0; i < aParams.length; i++) {
					// Use the oModel to callFunction for a particular groupID
					this.oModel.callFunction(sFunctionImportName, {
						urlParameters: aParams[i],
						method: "POST",
						groupId: GROUP_ID,
						changeSetId: CHANGE_SET_ID,
						refreshAfterChange: bRefreshAfterChangeLocal,
						eTag: eTag
					});

					// Done loop
				}
				if (!bDeferRequest) {
					this.submitPendingChanges(GROUP_ID, fSuccessCallBack, fFailureCallBack);
				}
			} catch (ex) {
				fFailureCallBack();
			}
		},
		update: function (sPath, oData, mParameters) {
			this.oModel.update(sPath, oData, mParameters);
		},

		read: function (sPath, mParameters) {
			this.oModel.read(sPath, mParameters);
		},

		remove: function (sPath, mParameters) {
			this.oModel.remove(sPath, mParameters);
		},

		submitPendingChanges: function (GROUP_ID, fSuccessCallBack, fFailureCallBack) {
			// Now prepare to submit all queued items as one batch requests

			// Set the right batch ID to submit
			var oBatchParams = {
				groupId: GROUP_ID
			};

			// If there are success / failure callbacks then ensure they are called
			if (fSuccessCallBack) {
				oBatchParams.success = fSuccessCallBack;
			}

			if (fFailureCallBack) {
				oBatchParams.error = fFailureCallBack;
			}

			// Finally submit the changes
			this.oModel.submitChanges(oBatchParams);
		},

		setDeferredGroups: function (aDeferredGroups) {
			this.oModel.setDeferredGroups(aDeferredGroups);
		}
	});
});
