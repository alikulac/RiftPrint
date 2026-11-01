/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/Component.controller"], function (ComponentController) {
	"use strict";

	return ComponentController.extend("sap.rsh.eam.lib.common.base.BaseComponent.controller", {
		constructor: function (oComponent) {
			this.oComponent = oComponent;
			this.oModel = this.oComponent.getModel();
			this.oBundle = this.oComponent.getModel("i18n").getResourceBundle();
			this.oCommonBundle = this.oComponent.getModel("i18nLib").getResourceBundle();
			this.controllers = this.oComponent.controllers;
			var oUIModel = this.oComponent.getModel("UIModel");
			if (oUIModel) {
				this.oUIModel = oUIModel;
			}
			ComponentController.call(this, oComponent);
		},

		onInit: function () {
			this.onInitMembers();
		},

		onInitMembers: function () {},

		getModel: function (sName) {
			return this.oComponent.getModel(sName);
		}
	});
});
