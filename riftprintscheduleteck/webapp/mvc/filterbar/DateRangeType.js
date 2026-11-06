/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/comp/config/condition/DateRangeType","sap/ui/core/date/UI5Date"], function (DateRangeType, UI5Date) {
	"use strict";

	var oDateRange = DateRangeType.extend("zrift.rsh.eam.ordergantts1.mvc.filterbar.DateRangeType", {
		constructor: function (sFieldName, oFilterProvider, oFieldViewMetadata) {
			DateRangeType.apply(this, [sFieldName, oFilterProvider, oFieldViewMetadata]);
			this.setAsync(false);
			this.setPending(false);
		}
	});

	oDateRange.Operations = {};

	oDateRange.initializeOperations = function () {
		var oCategory = {
			bundle: "sap.rsh.eam.lib.common",
			key: "DateRangeGroupName"
		};

		oDateRange.Operations.FISCALPERIOD0 = DateRangeType.getFixedRangeOperation(
			"FISCALPERIOD0",
			{
				key: "Next4Week",
				bundle: "sap.rsh.eam.lib.common"
			},
			oCategory
		);
	};
	oDateRange.initializeOperations();

	oDateRange.prototype.providerDataUpdated = function (aFieldNames) {
		DateRangeType.prototype.providerDataUpdated.apply(this, arguments);

		var sField = aFieldNames[0];
		if (aFieldNames.indexOf(sField) > -1) {
			var oStartDateNext = UI5Date.getInstance();
			var oEndDateNext = UI5Date.getInstance();
			oEndDateNext.setDate(oEndDateNext.getDate() + 28);
			oEndDateNext.setDate(oEndDateNext.getDate() - ((oEndDateNext.getDay() + 7) % 7));
			this.updateFiscalPeriods([[oStartDateNext, oEndDateNext]]);
			this.setPending(false);
		}
	};

	oDateRange.prototype.updateFiscalPeriods = function (aRanges) {
		var oFiscalPeriodOperation = oDateRange.Operations.FISCALPERIOD0;
		oFiscalPeriodOperation.defaultValues = aRanges && aRanges[0] ? aRanges[0] : null;

		// method of the control which is being extended
		this.updateOperations();
		this.setPending(false);
	};

	oDateRange.prototype.getOperations = function () {
		var aOperations = DateRangeType.prototype.getOperations();
		var aOp;
		//If there are two operations, retain them
		if (aOperations.length === 2) {
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
					aOperations[i].key === "NEXTWEEK" ||
				  	aOperations[i].key === "NEXTDAYSINCLUDED" ||
				  	aOperations[i].key === "NEXTWEEKSINCLUDED" ||
				  	aOperations[i].key === "NEXTMONTHSINCLUDED" ||
				  	aOperations[i].key === "NEXTDAYS" ||
				  	aOperations[i].key === "NEXTWEEKS" ||
				  	aOperations[i].key === "NEXTMONTHS"
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
});
