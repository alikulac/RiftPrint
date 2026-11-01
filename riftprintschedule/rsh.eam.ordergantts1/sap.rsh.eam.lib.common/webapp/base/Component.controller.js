/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/EventProvider"], function (EventProvider) {
	"use strict";

	return EventProvider.extend("sap.rsh.eam.lib.common.base.Component.controller", {
		oComponent: undefined,

		constructor: function (oComponent) {
			EventProvider.prototype.constructor.apply(this, arguments);
			this.oComponent = oComponent;
			this.onInit();
		},

		destroy: function () {
			EventProvider.prototype.destroy.apply(this, arguments);
			this.onExit();
		},

		onInit: function () {},

		onExit: function () {},

		byId: function (sId) {
			return this.oComponent.byId(sId);
		},

		createId: function (sId) {
			return this.oComponent.createId(sId);
		},

		getOwnerComponent: function () {
			return this.oComponent;
		}
	});
});
