/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/BaseViewChild.controller"], function (BaseViewChildController) {
	"use strict";

	return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.Submit.controller", {
		// combines the POST call and subsequent GET calls into a single batch request by using a common GroupId
		submitAndRefresh: function (sGroupId, oTargetParams) {
			// refresh
			oTargetParams.parameters = {
				bRefreshOfSourceAppRequired: true,
				sGroupId: sGroupId
			};
			this.controllers.deltaRefresh.refresh(oTargetParams);

			// submit
			this.controllers.modelPromises.submitChanges({ groupId: sGroupId }).then(
				function () {
					this.byId("idOrderGanttContainer").setBusy(false);
				}.bind(this)
			);
		}
	});
});
