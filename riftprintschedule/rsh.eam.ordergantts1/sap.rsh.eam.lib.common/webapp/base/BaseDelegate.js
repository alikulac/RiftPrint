/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * Base Delegate for all the controllers Fragments
 * common services like instantiating the fragments, Destroying & Initializing
 * @author: SAP SE
 * @extends sap.ui.base.EventProvider
 * @name sap.rsh.eam.lib.common.controller.BaseDelegate
 */
sap.ui.define(["sap/ui/base/EventProvider", "sap/base/assert", "sap/base/util/uid"], function (EventProvider, assert, uid) {
	"use strict";

	return EventProvider.extend("sap.rsh.eam.lib.common.base.BaseDelegate", {
		_oFragment: null,
		_sFragmentId: null,
		_sFragmentName: null,

		constructor: function (mParameters) {
			sap.ui.base.EventProvider.prototype.constructor.apply(this, arguments);

			if ((!mParameters || !mParameters.fragmentName) && !this._sFragmentName) {
				throw new Error("Fragment name has to be provided");
			} else if (!this._sFragmentName) {
				this._sFragmentName = mParameters.fragmentName;
			}
		},

		/**
		 * Destroys the objects and releases all object references.
		 */
		destroy: function () {
			// Invoke lifefycle hook
			this.onExit();

			// Destroy objects
			if (this._oFragment) {
				// Detach other lifecycle hooks
				this._oFragment.removeEventDelegate(this, this);
				this._oFragment.destroy();
			}

			// Reset properties
			this._oFragment = null;

			sap.ui.base.EventProvider.prototype.destroy.apply(this, arguments);
		},

		/**
		 * Hook method invoked once when the fragment is created.
		 */
		onInit: function () {
			this.onInitMembers();
		},

		onInitMembers: function () {
		},

		/**
		 * Hook method invoked before the fragment is rendered.
		 */
		onBeforeRendering: function () {
		},

		/**
		 * Hook method invoked after the fragment is rendered.
		 */
		onAfterRendering: function () {
		},

		/**
		 * Hook method invoked once when the delegate is destroyed.
		 */
		onExit: function () {
		},

		_createFragment: function (sFragmentId) {
			assert(this._sFragmentName, "Trying to instantiate fragment but fragmentName is not provided.");
			if (sFragmentId){
				this._sFragmentId = sFragmentId;
			} else {
				this._sFragmentId = uid();	
			}
			this._oFragment = sap.ui.xmlfragment(this._sFragmentId, this._sFragmentName, this);

			// Invoke lifecycle hook
			this.onInit();

			// Register other looks like onBeforeRendering, etc.
			this._oFragment.addEventDelegate(this, this);

			return this._oFragment;
		},

		/**
		 * Internal utility functionfor accessing an element inside the fragment by its id.
		 *
		 * @param {string}
		 *            sId the id of the element inside the fragment.
		 * @returns {sap.ui.core.Element} the element matching the id.
		 */
		byId: function (sId) {
			return sap.ui.core.Fragment.byId(this._sFragmentId, sId);
		},

		/**
		 * Internal utility functionfor creating an id for an element inside the fragment.
		 *
		 * @param {string}
		 *            sId the id of the element inside the fragment.
		 * @returns {string} the id.
		 */
		createId: function (sId) {
			return sap.ui.core.Fragment.createId(this._sFragmentId, sId);
		},

		getFragment: function (sFragmentId) {
			if (!this._oFragment) {
				this._createFragment(sFragmentId);
			}
			return this._oFragment;
		},

		/**
		 * Checks whether the fragment has already been created.
		 *
		 * @returns {boolean} true of fragment has been created, false otherwise.
		 */
		isFragmentCreated: function () {
			return !!this._oFragment;
		}
	});
});
