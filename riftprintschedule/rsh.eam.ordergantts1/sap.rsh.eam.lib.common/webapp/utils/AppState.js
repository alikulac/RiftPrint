/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/ui/base/Object", "sap/ui/generic/app/navigation/service/NavigationHandler", "sap/base/Log"],
	function (UI5Object, NavigationHandler, Log) {
		"use strict";
		var _oInstance;
		var NewInstance = UI5Object.extend("sap.rsh.eam.lib.common.utils.AppState", {
			/**
			 * Handles AppState Handler for the application.
			 * @class
			 * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
			 * @public
			 * @alias sap.rsh.eam.lib.common.utils.AppState
			 */
			constructor: function (oComponent) {
				this._oComponent = oComponent;
				this._oNavigationHandler = new NavigationHandler(oComponent);
				this._pCrossAppNav = sap.ushell.Container.getServiceAsync("CrossApplicationNavigation");
			},
			/**
			 * Sets the current app InnerAppState and navigates to the given target.
			 * @param {object} oTarget Target to the navigation
			 * @param {string} oTarget.semanticObject target Semantic Object
			 * @param {object} oTarget.action target Action
			 * @param {object} oParams Each property represents a Key/Value url parameter
			 * @param {object} oInnerAppState InnerAppState object to be saved
			 * @public
			 * */
			checkIntentAndNavigate: function (oTarget, oParams, oInnerAppState) {
				if (sap.ushell.Container) {
					//var that = this;
					// encode all URI components
					if (oParams) {
						for (var sProperty in oParams) {
							if (oParams.hasOwnProperty(sProperty)) {
								oParams[sProperty] = encodeURIComponent(oParams[sProperty]);
							}
						}
					}
					var oCrossAppNav = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
					oCrossAppNav.isNavigationSupported([oTarget.semanticObject + "-" + oTarget.action]).done(
						function (oData) {
							if (oData[0].supported) {
								this._oNavigationHandler.navigate(oTarget.semanticObject, oTarget.action, oParams, oInnerAppState);
							}
						}.bind(this)
					);
				}
			},
			/**
			 * Returns a promise that will get the AppState
			 * @returns {Promise} To retrieve appState use: .then(function(oAppData, oStartupParameters, sNavType){<success code>}) ;
			 *			For error handling use: .fail(function(oError, oURLParameters, sNavType){<error handling code>})
			 * @public
			 * */
			retrieveAppState: function () {
				return this._oNavigationHandler.parseNavigation();
			},
			/**
			 * Sets the current app InnerAppState and returns an href for the given target.
			 * @param {object} oTarget Target to the navigation
			 * @param {string} oTarget.semanticObject target Semantic Object
			 * @param {object} oTarget.action target Action
			 * @param {object} oParams Each property represents a Key/Value url parameter
			 * @param {object} oInnerAppState InnerAppState object to be saved
			 * @returns {Promise} Promise that will return an href for the target
			 * @public
			 * */
			setStateGetHref: function (oTarget, oParams, oInnerAppState) {
				var that = this;

				var oPromise = new Promise(function (fnResolve, fnRefuse) {
					if (sap.ushell.Container) {
						// encode all URI components
						if (oParams) {
							for (var sProperty in oParams) {
								if (oParams.hasOwnProperty(sProperty)) {
									oParams[sProperty] = encodeURIComponent(oParams[sProperty]);
								}
							}
						}
						var oCrossAppNav = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
						var _oParams;
						// if using shellHash, ignore oParams
						if (oTarget.shellHash) {
							_oParams = undefined;
						} else {
							_oParams = oParams;
						}
						oCrossAppNav
							.isNavigationSupported([oTarget])
							.done(function (oData) {
								if (oData[0].supported) {
									var _oInnerAppState = oInnerAppState || {};
									var oAppStatePromise = that._oNavigationHandler.storeInnerAppStateWithImmediateReturn(_oInnerAppState, true);
									if (oAppStatePromise && oAppStatePromise.appStateKey) {
										that._oNavigationHandler.replaceHash(oAppStatePromise.appStateKey);
									}
									var sHref = oCrossAppNav.hrefForExternal({
										target: oTarget,
										params: _oParams
									});
									fnResolve(sHref);
								} else {
									// navigation not supported
									fnRefuse();
								}
							})
							.fail(function (sErrorMessage) {
								Log.error(sErrorMessage, "Navigation not supported");
								// navigation not supported, propagate the error
								fnRefuse(sErrorMessage);
							});
					} else {
						fnRefuse();
					}
				});
				return oPromise;
			},

			isNavigationSupported: function (sSemanticObject, sAction, oParams) {
				return new Promise(
					function (resolve, reject) {
						this._pCrossAppNav.then(function (oCrossAppNav) {
							var aIntents = [
								{
									target: {
										semanticObject: sSemanticObject,
										action: sAction
									},
									params: oParams
								}
							];
							oCrossAppNav.isNavigationSupported(aIntents).done(
								function (oData) {
									var bResult = !!oData[0].supported;
									resolve(bResult);
								}.bind(this)
							);
						});
					}.bind(this)
				);
			}
		});
		return {
			/**
			 * Gets the AppState instance.
			 * @returns {sap.rsh.eam.lib.common.utils.AppState} AppState instance
			 * @public
			 */
			getInstance: function () {
				return _oInstance;
			},

			/**
			 * Creates a new singleton instance of the AppState, should be only called in the App Component.
			 * @param {sap.ui.core.UIComponent} oComponent id of the outbound
			 * @returns {sap.rsh.eam.lib.common.utils.AppState} AppState instance
			 * @public
			 */
			createInstance: function (oComponent) {
				_oInstance = new NewInstance(oComponent);
				return _oInstance;
			}
		};
	}
);
