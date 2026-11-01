/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/EventProvider"], function (EventProvider) {
	"use strict";

	return EventProvider.extend("sap.rsh.eam.lib.common.base.ViewChild.controller", {
		_oParentController: undefined,

		constructor: function (oParent) {
			EventProvider.prototype.constructor.apply(this, arguments);
			this._oParentController = oParent;
			this._oParentController.getView().addEventDelegate({
				onBeforeRendering: this.onBeforeRendering.bind(this),
				onAfterRendering: this.onAfterRendering.bind(this)
			});
			this.onInit();
		},

		destroy: function () {
			EventProvider.prototype.destroy.apply(this, arguments);
			this.onExit();
		},

		onInit: function () {},

		onExit: function () {},

		onBeforeRendering: function () {},

		onAfterRendering: function () {},

		byId: function (sId) {
			return this._oParentController.byId(sId);
		},

		createId: function (sId) {
			return this._oParentController.createId(sId);
		},

		getOwnerComponent: function () {
			return this._oParentController.getOwnerComponent();
		},

		getView: function () {
			return this._oParentController.getView();
		},

		getParentController: function () {
			return this._oParentController;
		}
	});
});
