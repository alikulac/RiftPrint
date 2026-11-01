/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/BaseViewChild.controller", "sap/ui/Device"], function (BaseViewChildController, Device) {
	"use strict";

	return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.ContentDensity.controller", {
		onInit: function () {
			BaseViewChildController.prototype.onInit.apply(this, arguments);
			this._applyToAppView();
			this._init();
		},

		onInitMembers: function () {
			this._sContentDensityClass = undefined;
			this._sContentDensityAdditionalClass = undefined;
		},

		_applyToAppView: function () {
			var sContentDensityClass = this.getContentDensityClass();
			var oAppView = this.oComponent.getRootControl();
			oAppView.addStyleClass(sContentDensityClass);
		},

		// before cleanup: SchedulingBoard._setCondensedMode
		_init: function () {
			this.controllers.persGanttSettings.initialized().then(
				function () {
					if (this.oUIModel.getProperty("/condensedModeActive")) {
						this.getView().addStyleClass(this._getContentDensityAdditionalClass());
						this.byId("idOrderGanttContainer").rerender();
					}
				}.bind(this)
			);
		},

		// before cleanup: SchedulingBoard.activateCondensedMode
		activateCondensedMode: function () {
			if (this.oUIModel.getProperty("/condensedModeActive")) {
				this.getView().addStyleClass(this._getContentDensityAdditionalClass());
			} else {
				this.getView().removeStyleClass(this._getContentDensityAdditionalClass());
			}
		},

		// before cleanup: Component.getContentDensityClass
		getContentDensityClass: function () {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
					//if compact mode is set, remember condensed mode class name as additional option based on user settings in Gantt
					if (jQuery(document.body).hasClass("sapUiSizeCompact")) {
						this._sContentDensityAdditionalClass = "sapUiSizeCondensed";
						this._sContentDensityClass = "";
					} else {
						this._sContentDensityClass = "";
					}
				} else if (!Device.support.touch) {
					// apply "compact" mode if touch is not supported
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		},

		// before cleanup: Component.getContentDensityAdditionalClass
		_getContentDensityAdditionalClass: function () {
			if (this._sContentDensityAdditionalClass === undefined) {
				if (jQuery(document.body).hasClass("sapUiSizeCompact")) {
					//if compact mode is set, add condensed mode in addition based on user settings
					this._sContentDensityAdditionalClass = "sapUiSizeCondensed";
				}
			}
			return this._sContentDensityAdditionalClass;
		}
	});
});
