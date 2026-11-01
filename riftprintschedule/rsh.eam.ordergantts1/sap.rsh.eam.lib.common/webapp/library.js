/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * Initialization Code and shared classes of library sap.rsh.eam.lib.common.
 */
sap.ui.define(
	["jquery.sap.global", "sap/ui/core/library"], // library dependency
	function () {
		"use strict";

		/**
		 * RSH EAM Reuse Library
		 *
		 * @namespace
		 * @name sap.rsh.eam.lib.common
		 * @author SAP SE
		 * @version ${version}
		 * @public
		 */

		// delegate further initialization of this library to the Core
		sap.ui.getCore().initLibrary({
			name: "sap.rsh.eam.lib.common",
			version: "${version}",
			dependencies: ["sap.ui.core"],
			types: [],
			interfaces: [],
			controls: [
				"sap.rsh.eam.lib.common.controller.FilterDialog",
				"sap.rsh.eam.lib.common.controller.AssignMyWorkCenters",
				"sap.rsh.eam.lib.common.controller.ChangeOperations",
				//Code Coverage: Comment Change Orders Logic
				//"sap.rsh.eam.lib.common.controller.ChangeOrders",
				"sap.rsh.eam.lib.common.controller.OperationPopup",
				"sap.rsh.eam.lib.common.controller.OrderPopup"
				// "sap.rsh.eam.lib.common.controller.UtilizationGantt"
			],
			elements: []
		});

		return sap.rsh.eam.lib.common;
	},
	/* bExport= */ false
);
