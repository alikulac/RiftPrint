/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["jquery.sap.global", "sap/ui/comp/config/condition/DateRangeType"],
	function (jQuery, DateRangeType) {
		"use strict";
		var oDateRange = DateRangeType.extend("custom.oDateRange", {
			constructor: function (sFieldName, oFilterProvider, oFieldViewMetadata) {
				DateRangeType.apply(this, [sFieldName, oFilterProvider, oFieldViewMetadata]);
				this.setAsync(false);
				this.setPending(false);
			}
		});
		oDateRange.Operations = {};
		oDateRange.initializeOperations = function () {
			// var reuseResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rsh.eam.lib.common");
			// var Next = reuseResourceBundle.getText("Next4Week");
			// var Past = reuseResourceBundle.getText("Past6Month");

			var oCategory = {
				bundle: "sap.rsh.eam.lib.common",
				key: "DateRangeGroupName"
			};

			var oKeys = ["Next4Week", "Past6Month"];

			for (var i = 0; i < 2; i++) {
				oDateRange.Operations["FISCALPERIOD" + i] = DateRangeType.getFixedRangeOperation(
					"FISCALPERIOD" + i,
					{
						key: oKeys[i],
						bundle: "sap.rsh.eam.lib.common"
					},
					oCategory
				);
			}
		};
		oDateRange.initializeOperations();

		oDateRange.prototype.providerDataUpdated = function (aFieldNames) {
			DateRangeType.prototype.providerDataUpdated.apply(this, arguments);

			var sField = aFieldNames[0];
			if (aFieldNames.indexOf(sField) > -1) {
				var oStartDateNext = new Date();
				var oEndDateNext = new Date();
				var oStartDatePast = new Date();
				var oEndDatePast = new Date();
				oEndDatePast.setDate(oEndDatePast.getDate() - 1);
				oEndDateNext.setDate(oEndDateNext.getDate() + 28);
				oEndDateNext.setDate(oEndDateNext.getDate() - ((oEndDateNext.getDay() + 7) % 7));
				oStartDatePast.setMonth(oStartDatePast.getMonth() - 6);
				this.updateFiscalPeriods([
					[oStartDateNext, oEndDateNext],
					[oStartDatePast, oEndDatePast]
				]);
				this.setPending(false);
				// jQuery.sap.delayedCall(0, this, "updateFiscalPeriods", [
				// 	[
				// 		[oStartDateNext, oEndDateNext],
				// 		[oStartDatePast, oEndDatePast]
				// 	]
				// ]);
			}
		};
		oDateRange.prototype.updateFiscalPeriods = function (aRanges) {
			for (var i = 0; i < 2; i++) {
				var oFiscalPeriodOperation = oDateRange.Operations["FISCALPERIOD" + i];
				oFiscalPeriodOperation.defaultValues = aRanges && aRanges[i] ? aRanges[i] : null;
			}
			// method of the control which is being extended
			this.updateOperations();
			this.setPending(false);
		};
		oDateRange.prototype.getOperations = function () {
			var aOperations = DateRangeType.prototype.getOperations();
			var aOp;
			//If there are three operations, retain them
			if (aOperations.length === 3) {
				aOp = null;
			} else {
				aOp = aOperations.length;
			}
			//Removing all the operations accept DateRange
			if (aOp) {
				var aUpdatedOperation = [];
				for (var i = 0; i < aOp; i++) {
					if (
						aOperations[i].key === "DATERANGE" ||
						aOperations[i].key === "TODAYFROMTO" ||
						aOperations[i].key === "THISWEEK" ||
						aOperations[i].key === "NEXTWEEK"
					) {
						aUpdatedOperation.push(aOperations[i]);
					}
				}
				aOperations = aUpdatedOperation;
			}
			for (var sFiscalPeriodOperation in oDateRange.Operations) {
				if ({}.hasOwnProperty.call(oDateRange.Operations, sFiscalPeriodOperation)) {
					var oFiscalPeriodOperation = oDateRange.Operations[sFiscalPeriodOperation];
					if (oFiscalPeriodOperation.defaultValues) {
						aOperations.push(oFiscalPeriodOperation);
					}
				}
			}
			return aOperations;
		};

		return oDateRange;
	},
	true
);
