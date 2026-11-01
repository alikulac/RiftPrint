/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/ViewChild.controller"], function (ViewChildController) {
	"use strict";

	return ViewChildController.extend("sap.rsh.eam.lib.common.base.BaseViewChild.controller", {
		constructor: function (oParent) {
			this.oComponent = oParent.getOwnerComponent();
			this.oModel = this.oComponent.getModel();
			this.oBundle = this.oComponent.getModel("i18n").getResourceBundle();
			this.oCommonBundle = this.oComponent.getModel("i18nLib").getResourceBundle();
			this.controllers = this.oComponent.controllers;
			var oUIModel = this.oComponent.getModel("UIModel");
			if (oUIModel) {
				this.oUIModel = oUIModel;
			}
			ViewChildController.call(this, oParent);
		},

		onInit: function () {
			this.onInitMembers();
		},

		onInitMembers: function () {},

		getModel: function (sName) {
			return this.getView().getModel(sName);
		}
	});
});
