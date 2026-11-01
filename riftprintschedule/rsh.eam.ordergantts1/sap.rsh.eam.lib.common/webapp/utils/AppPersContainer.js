/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object", "sap/ui/model/json/JSONModel"], function (UI5Object, JSONModel) {
	"use strict";

	var _oInstance;
	var _sPersContainerId = "RSH.EAM";

	var NewInstance = UI5Object.extend("sap.rsh.eam.lib.common.utils.AppPersContainer", {
		_oComponent: undefined,
		_oContainer: undefined,
		_pInitialized: undefined,
		_mFeatureModels: {},

		// TODO switch to getServiceAsync once all apps are waiting for the initialized promise
		constructor: function (oComponent) {
			this._oComponent = oComponent;
			var oPersService = sap.ushell.Container.getService("Personalization");
			var pGetContainer = oPersService.getContainer(_sPersContainerId);
			this._pInitialized = pGetContainer.then(
				function (oContainer) {
					this._oContainer = oContainer;
					return this;
				}.bind(this)
			);
		},

		initialized: function () {
			return this._pInitialized;
		},

		getFeatureModel: function (sFeatureName) {
			var oJsonModel = this._mFeatureModels[sFeatureName];

			if (!oJsonModel) {
				oJsonModel = this._createFeatureModel(sFeatureName);
			}

			return oJsonModel;
		},

		_createFeatureModel: function (sFeatureName) {
			var oJsonModel = this._createJsonModel();
			var that = this;

			oJsonModel.attachPropertyChange(
				{
					featureName: sFeatureName
				},
				this._onJsonModelPropertyChange,
				this
			);

			if (this._oContainer) {
				oJsonModel.setData(this._getFeatureData(sFeatureName));
				oJsonModel.bIsDataLoaded = true;
			} else {
				var fnResolveDataLoaded;
				// Promise that will be resolved when the model data is loaded
				oJsonModel._pWhenDataLoaded = new Promise(function (fnResolve) {
					fnResolveDataLoaded = fnResolve;
				});

				this._pInitialized.then(function () {
					oJsonModel.setData(that._getFeatureData(sFeatureName));
					oJsonModel.bIsDataLoaded = true;
					fnResolveDataLoaded();
				});
			}

			this._mFeatureModels[sFeatureName] = oJsonModel;

			return oJsonModel;
		},

		_createJsonModel: function () {
			var oJsonModel = new JSONModel();
			oJsonModel.bIsDataLoaded = false;

			oJsonModel.setProperty = function (sPath, oValue) {
				var ret = JSONModel.prototype.setProperty.apply(oJsonModel, arguments);

				oJsonModel.firePropertyChange({
					reason: sap.ui.model.ChangeReason.Change,
					path: sPath,
					value: oValue
				});
				return ret;
			};
			return oJsonModel;
		},

		_getFeatureData: function (sFeatureName) {
			var oValue = this._oContainer.getItemValue(sFeatureName);
			return oValue !== undefined ? oValue : {};
		},

		_onJsonModelPropertyChange: function (oEvent, oContext) {
			var sFeatureName = oContext.featureName;
			var oJsonModel = oEvent.getSource();

			this._oContainer.setItemValue(sFeatureName, oJsonModel.getProperty("/"));
			this._oContainer.save(); // should we save to the gateway on every setProperty??
		},

		saveContainer: function () {
			if (this._oContainer) {
				this._oContainer.save();
			} else {
				this._pInitialized.then(
					function () {
						this._oContainer.save();
					}.bind(this)
				);
			}
		}
	});

	return {
		getInstance: function () {
			return _oInstance;
		},

		createInstance: function (oComponent) {
			_oInstance = new NewInstance(oComponent);
			return _oInstance;
		}
	};
});
