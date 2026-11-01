/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/Fragment.controller"], function (FragmentController) {
	"use strict";

	return FragmentController.extend("sap.rsh.eam.lib.common.base.BaseFragment.controller", {
		/**
		 * @param {Object} oParams
		 * @param {Object} oParams.component
		 * @param {string} oParams.fragmentName
		 * @param {string} oParams.fragmentId
		 * @param {Object} oParams.dependent - optional
		 */
		constructor: function (oParams) {
			this.oComponent = oParams.component;
			this.oModel = this.oComponent.getModel();
			this.oBundle = this.oComponent.getModel("i18n").getResourceBundle();
			this.oCommonBundle = this.oComponent.getModel("i18nLib").getResourceBundle();
			this.controllers = this.oComponent.controllers;
			var oUIModel = this.oComponent.getModel("UIModel");
			if (oUIModel) {
				this.oUIModel = oUIModel;
			}
			FragmentController.call(this, oParams);
			this.onInitMembers(oParams);
		},

		onInitMembers: function () {},

		getModel: function (sName) {
			return this._oFragment.getModel(sName);
		}
	});
});
