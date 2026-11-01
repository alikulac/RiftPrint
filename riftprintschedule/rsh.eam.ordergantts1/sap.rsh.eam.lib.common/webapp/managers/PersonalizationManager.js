/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * NOT REQUIRED AT THE MOMENT: COMMENTING OUT TO INCREASE CODE COVERAGE
 * PersonalizationManager,singleton class will provide an API to manage
 * the Unified Shell's personalization service to store and retrieve data.
 * @author: SAP SE
 * @extends sap.ui.base.Object
 * @name sap.rsh.eam.lib.common.managers.PersonalizationManager
 */
/*sap.ui.define([
		"sap/ui/base/Object",
		"sap/rsh/eam/lib/common/utils/Constants"
	],
	function (UI5Object, Constants) {
		"use strict";
		var oPersonalizationManager;
		var PersonalizationManager = UI5Object.extend("sap/rsh/eam/lib/common/managers/PersonalizationManager", {
			/** 
			 * Get the Personalization service from the {sap.ushell.services.Personalization} 
			 * and retrive the data stored in the container.
			 */
/*
			constructor: function () {
				// this object will hold all the personalization settings defined for the applicataio, based on future
				// scalability can be moved to a json file. 
				this._oLocalSettings = {};
				this._oLocalSettings[Constants.sShowFilterSetDialogLeveling] = true;
				//Display Filter Information Dialog in Details app.
				this._oLocalSettings[Constants.sShowFilterSetDialogForDetails] = true;
				//Details App chart settings.
				this._oLocalSettings[Constants.sGraphScale] = "Week";
				this._oLocalSettings[Constants.sGraphValue] = true;
				this._oLocalSettings[Constants.sChartType] = "WorkCenter";
				//Get the personalization service.
				var oPersonalizationService = sap.ushell.Container.getService("Personalization");
				//Define personalization scope.
				var oScope = {
					keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY,
					writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
					clientStorageAllowed: true
				};
				// Static PersId to create a container.
				var oPersId = {
					container: "sap.rsh.eam.UserLocalSettings",
					item: "p13nSettings"
				};
				//Get the Personalizer.
				this._oPersonalizer = sap.ushell.Container.getService("Personalization").getPersonalizer(oPersId, oScope);
				// Read the personalization data( returns promise) for the persId.
				this._oPromise = new Promise(function (success) {
					this._oPersonalizer.getPersData().then(function (oP13nData) {
						if (oP13nData) {
							//jQuery.extend(this._oLocalSettings, oP13nData);
							for (var key in oP13nData) {
								this._oLocalSettings[key] = oP13nData[key];
							}
						}
						success();
					}.bind(this));
				}.bind(this));
			},
			/** 
			 * Stores the personalization value in the Unified Shell service.
			 * @param sKey
			 * @param dValue
			 * @returns {Promise} return the promise object 
			 
			saveP13nData: function (sKey, dValue) {
				//update the local settings
				return new Promise(function (success) {
					this._oPromise.then(function () {
						this._oLocalSettings[sKey] = dValue;
						this._oPersonalizer.setPersData(this._oLocalSettings).done(function () {
							jQuery.sap.log.info("Personalization data stored");
							success();
						});
					}.bind(this));
				}.bind(this));
			},
			*/
/** 
			 * Get the value from the personalization service.
			 * @param sKey
			 * @returns {Promise}
			
			getP13nData: function (sKey) {
				// if the personalization data not yet persisted for the user,
				// return the default value for local settings.
				return new Promise(function (success) {
					this._oPromise.then(function () {
						success(this._oLocalSettings[sKey]);
					}.bind(this));
				}.bind(this));
			}
		});
		//return the singleton instance
		return {
			getPersonalizationManager: function () {
				if (!oPersonalizationManager) {
					oPersonalizationManager = new PersonalizationManager();
				}
				return oPersonalizationManager;
			}
		};

	});*/
