/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([], function () {
	"use strict";

	return {
		getTooltipForUtilization: function (fWorkCenterUtilization, sWorkCenterRequiredCapacity, sWorkCenterAvailableCapacity, sWorkCenterCapacityUnit) {
			var sRoundedRequiredCapa = parseFloat(sWorkCenterRequiredCapacity).toFixed(1);
			var sRoundedAvailableCapa = parseFloat(sWorkCenterAvailableCapacity).toFixed(1);
			return this.oCommonBundle.getText("UtilizationTooltip", [
				Math.round(fWorkCenterUtilization),
				sRoundedRequiredCapa,
				sRoundedAvailableCapa,
				sWorkCenterCapacityUnit
			]);
		},

		getTitleForUtilization: function (
			fWorkCenterUtilization,
			sWorkCenterRequiredCapacity,
			sWorkCenterAvailableCapacity,
			sWorkCenterCapacityUnit,
			iUtilizationTitleLevel
		) {
			var sRoundedRequiredCapa = parseFloat(sWorkCenterRequiredCapacity).toFixed(0);
			var sRoundedAvailableCapa = parseFloat(sWorkCenterAvailableCapacity).toFixed(0);
			if (iUtilizationTitleLevel === 2) {
				return this.oCommonBundle.getText("UtilizationTitle", [
					Math.round(fWorkCenterUtilization),
					sRoundedRequiredCapa,
					sRoundedAvailableCapa,
					sWorkCenterCapacityUnit
				]);
			} else if (iUtilizationTitleLevel === 1) {
				return this.oCommonBundle.getText("UtilizationPercTitle", Math.round(fWorkCenterUtilization).toString());
			}
			return "";
		},

		// the parameter sThresholdUpdateTime is not used in formatting
		// but re-triggers the formatter even if work center utilization is not changed
		getUtilizationColor: function (fWorkCenterUtilization, sThresholdUpdateTime) {
			var iWorkCenterUtilization = Math.round(fWorkCenterUtilization);
			var oUIModel = this.getModel("UIModel");
			var oColorsUtilizationBarsScale = oUIModel.getData();
			if (iWorkCenterUtilization >= 0 && iWorkCenterUtilization < Number(oColorsUtilizationBarsScale.ilowerThreshold)) {
				return oUIModel.getProperty("/sUtilColorBelowThreshold");
			}
			if (
				iWorkCenterUtilization >= Number(oColorsUtilizationBarsScale.ilowerThreshold) &&
				iWorkCenterUtilization <= Number(oColorsUtilizationBarsScale.iMiddleThreshold)
			) {
				return oUIModel.getProperty("/sUtilColorLowerThreshold");
			}
			if (
				iWorkCenterUtilization > Number(oColorsUtilizationBarsScale.iMiddleThreshold) &&
				iWorkCenterUtilization <= Number(oColorsUtilizationBarsScale.iHigherThreshold)
			) {
				return oUIModel.getProperty("/sUtilColorMiddleThreshold");
			}
			if (iWorkCenterUtilization > Number(oColorsUtilizationBarsScale.iHigherThreshold)) {
				return oUIModel.getProperty("/sUtilColorHigherThreshold");
			}
			return "";
		},

		getVisibilityForUtilization: function (sWorkCenterAvailableCapacity, sWorkCenterRequiredCapacity) {
			if (Number(sWorkCenterAvailableCapacity) <= 0 && Number(sWorkCenterRequiredCapacity) <= 0) {
				return false;
			}
			return true;
		}
	};
});
