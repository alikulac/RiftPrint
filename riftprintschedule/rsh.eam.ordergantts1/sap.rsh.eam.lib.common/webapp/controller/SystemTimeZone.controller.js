/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/rsh/eam/lib/common/base/BaseViewChild.controller", "sap/rsh/eam/lib/common/utils/AppPersContainer", "sap/base/util/UriParameters"],
	function (BaseViewChildController, AppPersContainer, UriParameters) {
		"use strict";

		return BaseViewChildController.extend("sap.rsh.eam.lib.common.controller.SystemTimeZone.controller", {
			onInit: function () {
				BaseViewChildController.prototype.onInit.apply(this, arguments);
				this._pLoaded = new Promise(
					function (resolve, reject) {
						this._fnResolve = resolve;
						this._fnReject = reject;
						this._readUrlParameter();
					}.bind(this)
				);
			},

			onInitMembers: function () {
				this._sFeatureModelKey = "SystemTimeZone";
				this._sTimeZoneID = null;
				this._pLoaded = undefined;
			},

			loaded: function () {
				return this._pLoaded;
			},

			get: function () {
				if (this._sTimeZoneID) {
					return this._sTimeZoneID;
				} else {
					throw new Error("system time zone not loaded yet");
				}
			},

			_readUrlParameter: function () {
				var sUrlParameter = UriParameters.fromQuery(window.location.search).get("sap-rsh-system-timezone");
				if (sUrlParameter) {
					this._sTimeZoneID = sUrlParameter;
					this._fnResolve(sUrlParameter);
				} else {
					this._readPers();
				}
			},

			_readPers: function () {
				var oPersContainer = AppPersContainer.getInstance();
				oPersContainer.initialized().then(
					function () {
						var oFeatureModel = oPersContainer.getFeatureModel(this._sFeatureModelKey);
						var oData = oFeatureModel.getData();
						if (oData.id) {
							this._sTimeZoneID = oData.id;
							this._fnResolve(oData.id);
						} else {
							this._readBackend();
						}
					}.bind(this)
				);
			},

			_readBackend: function () {
				this.controllers.modelPromises
					.read({
						path: "/C_RSHUserVariantWithTeam",
						urlParameters: {
							$top: "1",
							$skip: "0",
							$select: "TimeZoneID"
						}
					})
					.then(
						function (oResponse) {
							var sSystemTimeZone = oResponse && oResponse.results && oResponse.results.length > 0 && oResponse.results[0].TimeZoneID;
							if (sSystemTimeZone) {
								this._sTimeZoneID = sSystemTimeZone;
								this._storeInPers(sSystemTimeZone);
								this._fnResolve(sSystemTimeZone);
							} else {
								this._sTimeZoneID = "Etc/UTC";
								this._fnResolve(this._sTimeZoneID);
							}
						}.bind(this)
					);
			},

			_storeInPers: function (sSystemTimeZone) {
				var oContainer = AppPersContainer.getInstance();
				var oFeatureModel = oContainer.getFeatureModel(this._sFeatureModelKey);
				oFeatureModel.setProperty("/id", sSystemTimeZone);
				oContainer.saveContainer();
			}
		});
	}
);
