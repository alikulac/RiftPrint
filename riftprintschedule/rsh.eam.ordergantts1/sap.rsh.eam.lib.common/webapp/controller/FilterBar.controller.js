/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/BaseViewChild.controller", "sap/m/MessageBox"], function (BaseViewChildController, MessageBox) {
	"use strict";

	return BaseViewChildController.extend("sap.rsh.eam.lib.common.controller.FilterBar.controller", {
		onInit: function () {
			BaseViewChildController.prototype.onInit.apply(this, arguments);
			this.oModel.attachBatchRequestCompleted(this._onBatchRequestCompleted, this);
			this._oFilterBar.attachEvent("initialized", this._onInitialized, this);
		},

		onInitMembers: function () {
			this._oFilterBar = this._getFilterBar();
			this._bInitialized = false;
			this._bPlantsRequested = undefined;
			this._bWorkCentersRequested = undefined;
		},

		_onInitialized: function (oEvent) {
			this._bInitialized = true;
		},

		_getFilterBar: function () {
			throw new Error("not implemented");
		},

		_onWorkCenterRequested: function () {
			// can be overridden by sub controllers (details app, ...)
		},

		initialized: function () {
			return new Promise(
				function (resolve, reject) {
					if (this._bInitialized) {
						resolve();
					} else {
						this._oFilterBar.attachEvent("initialized", resolve);
					}
				}.bind(this)
			);
		},

		_onBatchRequestCompleted: function (oEvent) {
			var aRequests = oEvent.getParameter("requests");
			if (aRequests && aRequests.length > 0) {
				this._checkRequests(aRequests);
			}
		},

		_checkRequests: function (aRequests) {
			for (var i = 0; i < aRequests.length; i++) {
				// Check for work center requested
				if (aRequests[i].url.startsWith("C_RSHEAMUserVariant") && aRequests[i].url.includes("$orderby=WorkCenter")) {
					this._bWorkCentersRequested = true;
					this._onWorkCenterRequested();
				}
				// Check for plant requested
				if (aRequests[i].url.startsWith("C_RSHEAMUserVariant") && aRequests[i].url.includes("$orderby=Plant")) {
					this._bPlantsRequested = true;
				}
			}

			this.initialized().then(
				function () {
					// Check if WC or Plant filter is set.
					var oFilterData = this._oFilterBar.getFilterData();
					var bPlantFilterPresent = oFilterData.hasOwnProperty("Plant");
					var bWCFilterPresent = oFilterData.hasOwnProperty("WorkCenter");

					// If WC filter is set, check if WC data is available
					var bWCDataReqmntsSatisfied = true;
					if (bWCFilterPresent) {
						bWCDataReqmntsSatisfied = this._bWorkCentersRequested === true;
					}

					// If Plant filter is set, check if Plant data is available
					var bPlantDataReqmntsSatisfied = true;
					if (bPlantFilterPresent) {
						bPlantDataReqmntsSatisfied = this._bPlantsRequested === true;
					}

					// If WC and Plant data is availbale, then execute the function to show warning message
					if (bWCDataReqmntsSatisfied && bPlantDataReqmntsSatisfied && (this._bPlantsRequested || this._bWorkCentersRequested)) {
						this._bPlantsRequested = false;
						this._bWorkCentersRequested = false;
						this._checkAndRemoveWCFilterNotInMyWC();
					}
				}.bind(this)
			);
		},

		_checkAndRemoveWCFilterNotInMyWC: function () {
			var oFilterData = this._oFilterBar.getFilterData();

			var bWCFilterNeedsAdjustment, bPlantFilterNeedsAdjustment;
			var aDeletedWorkcenters = [],
				aDeletedPlants = [];

			if (oFilterData.hasOwnProperty("WorkCenter")) {
				aDeletedWorkcenters = this._adjustFilterData("WorkCenter");
				bWCFilterNeedsAdjustment = aDeletedWorkcenters.length > 0;
			}
			if (oFilterData.hasOwnProperty("Plant")) {
				aDeletedPlants = this._adjustFilterData("Plant");
				bPlantFilterNeedsAdjustment = aDeletedPlants.length > 0;
			}

			if (bWCFilterNeedsAdjustment || bPlantFilterNeedsAdjustment) {
				var sWarningMessageText;
				this._oFilterBar.setFilterData(oFilterData, true);

				if (bWCFilterNeedsAdjustment) {
					if (bPlantFilterNeedsAdjustment) {
						sWarningMessageText = this.oCommonBundle.getText("WarningForDeleteWCPlantFromFilter");
					} else {
						sWarningMessageText = this.oCommonBundle.getText("WarningForDeleteWorkCenterFromFilter", aDeletedWorkcenters.toString());
					}
				} else {
					if (aDeletedPlants.length === 1) {
						sWarningMessageText = this.oCommonBundle.getText("WarningForDeletePlantFromFilter", aDeletedPlants.toString());
					} else {
						sWarningMessageText = this.oCommonBundle.getText("WarningForDeletePlantsFromFilter", aDeletedPlants.toString());
					}
				}

				MessageBox.warning(sWarningMessageText);

				// Only search if 'Apply automatically is set in the variant'
				if (this._oFilterBar.isCurrentVariantExecuteOnSelectEnabled()) {
					this._oFilterBar.search();
				}
			}
		},

		_adjustFilterData: function (sFilterKey) {
			// Populate the list of WC/Plant
			var aValues = [];
			this._oFilterBar
				.getControlByKey(sFilterKey)
				.getAggregation("items")
				.forEach(function (item) {
					aValues.push(item.getKey());
				});

			// Iterate on the filter values in reverse so that we can delete the filter not in value list without messing the iterator index
			var aDeletedValues = [];
			var oFilterData = this._oFilterBar.getFilterData();
			oFilterData[sFilterKey].items
				.slice()
				.reverse()
				.forEach(function (item, index, object) {
					if (item.key !== undefined && aValues.indexOf(item.key) === -1) {
						//check if the filter Value is in ValueList
						aDeletedValues.push(item.key);
						//we need to remove the filter value from the WC, but careful - splice the precise Object element and not the current index
						//it would work since we don't expect to have more than 1 occurrence of a filter key
						oFilterData[sFilterKey].items.splice(object.length - 1 - index, 1);
					}
				});

			return aDeletedValues;
		}
	});
});
