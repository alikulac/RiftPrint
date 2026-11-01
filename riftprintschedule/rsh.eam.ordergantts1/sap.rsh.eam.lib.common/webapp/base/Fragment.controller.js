/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/EventProvider", "sap/ui/core/Fragment"], function (EventProvider, Fragment) {
	"use strict";

	return EventProvider.extend("sap.rsh.eam.lib.common.base.Fragment.controller", {
		_pLoad: undefined,
		_oComponent: undefined,
		_sFragmentName: undefined,
		_sFragmentId: undefined,
		_oDependent: undefined,
		_oFragment: undefined,

		/**
		 * @param {Object} oParams
		 * @param {Object} oParams.component
		 * @param {string} oParams.fragmentName
		 * @param {string} oParams.fragmentId
		 * @param {Object} oParams.dependent - optional
		 */
		constructor: function (oParams) {
			this._oComponent = oParams.component;
			this._oDependent = oParams.dependent;
			this._sFragmentName = oParams.fragmentName;
			this._sFragmentId = oParams.fragmentId;
		},

		getFragment: function () {
			if (!this._pLoad) {
				this._pLoad = new Promise(
					function (resolve, reject) {
						Fragment.load({
							id: this._sFragmentId,
							name: this._sFragmentName,
							controller: this
						}).then(
							function (oFragment) {
								this._oFragment = oFragment;
								if (this._oDependent) {
									this._oDependent.addDependent(this._oFragment);
								}
								// a reference on the fragment to the controller (used by getController)
								this._oFragment.__oFragmentController = this;
								this._oFragment.addEventDelegate({
									onBeforeRendering: this.onBeforeRendering.bind(this),
									onAfterRendering: this.onAfterRendering.bind(this)
								});
								this.onInit(oFragment);
								resolve(this._oFragment);
							}.bind(this),
							reject
						);
					}.bind(this)
				);
			}
			return this._pLoad;
		},

		getFragmentSync: function () {
			if (!this._oFragment) {
				throw new Error("fragment has not been loaded yet");
			}
			return this._oFragment;
		},

		destroy: function () {
			EventProvider.prototype.destroy.apply(this, arguments);
			this.onExit();
			if (this._oFragment) {
				this._oFragment.destroy();
			}
		},

		getFragmentId: function () {
			return this._sFragmentId;
		},

		getOwnerComponent: function () {
			return this._oComponent;
		},

		byId: function (sId) {
			return Fragment.byId(this._sFragmentId, sId);
		},

		createId: function (sId) {
			return Fragment.createId(this._sFragmentId, sId);
		},

		onInit: function () {},

		onExit: function () {},

		onBeforeRendering: function () {},

		onAfterRendering: function () {},
	});
});
