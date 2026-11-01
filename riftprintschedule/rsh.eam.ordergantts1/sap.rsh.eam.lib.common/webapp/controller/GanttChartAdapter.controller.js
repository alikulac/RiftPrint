/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/controller/GanttChart.controller"], function (GanttChartController) {
	"use strict";

	// The GanttChart controller is a subclass of FragmentController which loads the gantt from a fragment asynchronously.
	// But for historical reasons our apps have gantt's that are loaded as part of the view synchronously.
	// To anyway make the GanttChart controller reusable for these cases we extend it and reimplement most the functions from fragment controller.
	// Instead of loading the fragment asynchronously it will be passed into the constructor.
	return GanttChartController.extend("sap.rsh.eam.lib.common.controller.GanttChartAdapter.controller", {
		constructor: function (oParams) {
			this._oViewController = oParams.controller; // before apply which triggers onInitMembers
			GanttChartController.apply(this, arguments);
			this._oFragment = oParams.gantt; // "loading" the fragment now
			this._oFragment.addEventDelegate({
				onBeforeRendering: this.onBeforeRendering.bind(this),
				onAfterRendering: this.onAfterRendering.bind(this)
			});
			this.onInit();
		},

		getFragment: function () {
			return this._oFragment;
		},

		getFragmentSync: function () {
			return this._oFragment;
		},

		destroy: function () {
			this.onExit();
			// don't destroy the fragment as the super does
			// this must be handled by the provider of the fragment
		},

		getFragmentId: function () {
			throw new Error("not allowed");
		},

		getOwnerComponent: function () {
			return this._oViewController.getOwnerComponent();
		},

		byId: function (sId) {
			return this._oViewController.byId(sId);
		},

		createId: function (sId) {
			return this._oViewController.createId(sId);
		}
	});
});
