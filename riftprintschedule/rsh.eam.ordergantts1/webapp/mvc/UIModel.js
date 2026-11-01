/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/model/json/JSONModel"], function (JSONModel) {
	"use strict";

	return JSONModel.extend("zrsh.eam.ordergantts1.mvc.UIModel", {
		// previously SchedulingBoard.onInit
		constructor: function () {
			var oData = {
				bDataOutdated: false,
				rowCount: 0,
				showImpRel: false,
				showExpRel: false,
				showNonWorkingTimes: false,
				showCriticalPath: false,
				condensedModeActive: false,
				showFinalDueDate: false,
				// thresholds settings
				sThresholdUpdateTime: new Date().toISOString(),
				ilowerThreshold: "0",
				iMiddleThreshold: "75",
				iHigherThreshold: "100",
				sUtilColorBelowThreshold: "#D4D6D7",
				sUtilColorLowerThreshold: "#ACE1C2",
				sUtilColorMiddleThreshold: "#F8B67D",
				sUtilColorHigherThreshold: "#FF8888",
				bShowBarBelow: false,
				bShowBarLower: true,
				bShowBarMiddle: true,
				bShowBarHigher: true
			};
			JSONModel.call(this, oData);
		},

		// previously SchedulingBoard._getThresholdSettingsFromUIModel
		getThresholdSettings: function () {
			var oThresholdSettings = {};
			var oData = this.getData();
			oThresholdSettings.ilowerThreshold = oData.ilowerThreshold;
			oThresholdSettings.iMiddleThreshold = oData.iMiddleThreshold;
			oThresholdSettings.iHigherThreshold = oData.iHigherThreshold;
			oThresholdSettings.sUtilColorBelowThreshold = oData.sUtilColorBelowThreshold;
			oThresholdSettings.sUtilColorLowerThreshold = oData.sUtilColorLowerThreshold;
			oThresholdSettings.sUtilColorMiddleThreshold = oData.sUtilColorMiddleThreshold;
			oThresholdSettings.sUtilColorHigherThreshold = oData.sUtilColorHigherThreshold;
			return oThresholdSettings;
		},

		// previously SchedulingBoard.getGanttSettingValues
		getGanttSettings: function () {
			var oSettings = {};

			// Layout Tab
			oSettings.bCondensedModeActive = this.getProperty("/condensedModeActive");

			// WorkCenter Tab
			oSettings.bShowNonWorkingTimes = this.getProperty("/showNonWorkingTimes");
			oSettings.bShowUtilizationIndicator = this.getProperty("/showUtilizationIndicator");
			oSettings.ilowerThreshold = this.getProperty("/ilowerThreshold");
			oSettings.iMiddleThreshold = this.getProperty("/iMiddleThreshold");
			oSettings.iHigherThreshold = this.getProperty("/iHigherThreshold");
			oSettings.bShowBarBelow = this.getProperty("/bShowBarBelow");
			oSettings.bShowBarLower = this.getProperty("/bShowBarLower");
			oSettings.bShowBarMiddle = this.getProperty("/bShowBarMiddle");
			oSettings.bShowBarHigher = this.getProperty("/bShowBarHigher");
			oSettings.sUtilColorBelowThreshold = this.getProperty("/sUtilColorBelowThreshold");
			oSettings.sUtilColorLowerThreshold = this.getProperty("/sUtilColorLowerThreshold");
			oSettings.sUtilColorMiddleThreshold = this.getProperty("/sUtilColorMiddleThreshold");
			oSettings.sUtilColorHigherThreshold = this.getProperty("/sUtilColorHigherThreshold");

			// OrderAndOperationTab
			oSettings.bShowFinalDueDate = this.getProperty("/showFinalDueDate");
			oSettings.bShowImpRel = this.getProperty("/showImpRel");
			oSettings.bShowExpRel = this.getProperty("/showExpRel");
			oSettings.bShowRestrictions = this.getProperty("/showRestrictions");
			oSettings.bShowActualDates = this.getProperty("/showActualDates");

			// LabelsTab
			oSettings.sOperationLabelLeft = this.getProperty("/operationLabelLeft");
			oSettings.sOperationLabelInside = this.getProperty("/operationLabelInside");
			oSettings.sOperationLabelRight = this.getProperty("/operationLabelRight");
			oSettings.sOrderLabelLeft = this.getProperty("/orderLabelLeft");
			oSettings.sOrderLabelInside = this.getProperty("/orderLabelInside");
			oSettings.sOrderLabelRight = this.getProperty("/orderLabelRight");

			return oSettings;
		},

		// previously SchedulingBoard._updateUiModelFromGanttSettings
		setGanttSettings: function (oSettings) {
			if (oSettings && oSettings.bShowImpRel !== null && oSettings.bShowImpRel !== undefined) {
				this.setProperty("/showImpRel", oSettings.bShowImpRel);
				this.setProperty("/showExpRel", oSettings.bShowExpRel);
				this.setProperty("/showCriticalPath", false);
				this.setProperty("/showNonWorkingTimes", oSettings.bShowNonWorkingTimes);
				this.setProperty("/condensedModeActive", oSettings.bCondensedModeActive);
				this.setProperty("/showFinalDueDate", oSettings.bShowFinalDueDate);
				this.setProperty("/showRestrictions", oSettings.bShowRestrictions);
				this.setProperty("/showActualDates", oSettings.bShowActualDates);
				this.setProperty("/showUtilizationIndicator", oSettings.bShowUtilizationIndicator);
				this.setProperty("/bAtleastOneLabelIsActive", oSettings.bAtleastOneLabelIsActive);
				this.setProperty("/bLabelsToggleBtnOn", oSettings.bLabelsToggleBtnOn !== undefined ? oSettings.bLabelsToggleBtnOn : true);
				this.setProperty(
					"/bRelationshipsToggleBtnOn",
					oSettings.bRelationshipsToggleBtnOn !== undefined ? oSettings.bRelationshipsToggleBtnOn : true
				);
				this.setProperty("/bUtilizationsToggleBtnOn", oSettings.bUtilizationsToggleBtnOn !== undefined ? oSettings.bUtilizationsToggleBtnOn : true);
				if (oSettings.iHigherThreshold && oSettings.iMiddleThreshold && oSettings.ilowerThreshold) {
					this.setProperty("/bShowBarBelow", oSettings.bShowBarBelow);
					this.setProperty("/bShowBarHigher", oSettings.bShowBarHigher);
					this.setProperty("/bShowBarLower", oSettings.bShowBarLower);
					this.setProperty("/bShowBarMiddle", oSettings.bShowBarMiddle);
					this.setProperty("/iHigherThreshold", oSettings.iHigherThreshold);
					this.setProperty("/iMiddleThreshold", oSettings.iMiddleThreshold);
					this.setProperty("/ilowerThreshold", oSettings.ilowerThreshold);
				}
			} else {
				this.setProperty("/showImpRel", false);
				this.setProperty("/showExpRel", false);
				this.setProperty("/showCriticalPath", false);
				this.setProperty("/showNonWorkingTimes", false);
				this.setProperty("/condensedModeActive", false);
				this.setProperty("/showFinalDueDate", false);
				this.setProperty("/showRestrictions", false);
				this.setProperty("/showActualDates", false);
				this.setProperty("/showUtilizationIndicator", false);
				this.setProperty("/bAtleastOneLabelIsActive", false);
				this.setProperty("/bLabelsToggleBtnOn", true);
				this.setProperty("/bRelationshipsToggleBtnOn", true);
				this.setProperty("/bUtilizationsToggleBtnOn", true);
			}

			this.setProperty("/operationLabelLeft", oSettings.sOperationLabelLeft !== undefined ? oSettings.sOperationLabelLeft : "NoLabel-Left");
			this.setProperty("/operationLabelInside", oSettings.sOperationLabelInside !== undefined ? oSettings.sOperationLabelInside : "NoLabel-Inside");
			this.setProperty("/operationLabelRight", oSettings.sOperationLabelRight !== undefined ? oSettings.sOperationLabelRight : "NoLabel-Right");

			this.setProperty("/orderLabelLeft", oSettings.sOrderLabelLeft !== undefined ? oSettings.sOrderLabelLeft : "NoLabel-Left");
			this.setProperty("/orderLabelInside", oSettings.sOrderLabelInside !== undefined ? oSettings.sOrderLabelInside : "NoLabel-Inside");
			this.setProperty("/orderLabelRight", oSettings.sOrderLabelRight !== undefined ? oSettings.sOrderLabelRight : "NoLabel-Right");
			this.setProperty(
				"/sUtilColorBelowThreshold",
				oSettings.sUtilColorBelowThreshold !== undefined ? oSettings.sUtilColorBelowThreshold : "#D4D6D7"
			);
			this.setProperty(
				"/sUtilColorLowerThreshold",
				oSettings.sUtilColorLowerThreshold !== undefined ? oSettings.sUtilColorLowerThreshold : "#ACE1C2"
			);
			this.setProperty(
				"/sUtilColorMiddleThreshold",
				oSettings.sUtilColorMiddleThreshold !== undefined ? oSettings.sUtilColorMiddleThreshold : "#F8B67D"
			);
			this.setProperty(
				"/sUtilColorHigherThreshold",
				oSettings.sUtilColorHigherThreshold !== undefined ? oSettings.sUtilColorHigherThreshold : "#FF8888"
			);
		},

		// previously SchedulingBoard.persistSettingsP13n
		getP13NSettings: function () {
			var oSettings = this.getGanttSettings();

			oSettings.bShowCriticalPath = this.getProperty("/showCriticalPath");
			oSettings.bLabelsToggleBtnOn = this.getProperty("/bLabelsToggleBtnOn");
			oSettings.bRelationshipsToggleBtnOn = this.getProperty("/bRelationshipsToggleBtnOn");
			oSettings.bUtilizationsToggleBtnOn = this.getProperty("/bUtilizationsToggleBtnOn");
			oSettings.bAtleastOneLabelIsActive = this.getProperty("/bAtleastOneLabelIsActive");

			return oSettings;
		},

		updateToggleBtnProperty: function (bChangedRelationshipSetting, bChangedUtilizationSetting) {
			if (bChangedRelationshipSetting && !this.getProperty("/showImpRel") && !this.getProperty("/showExpRel")) {
				this.setProperty("/bRelationshipsToggleBtnOn", true);
			}
			if (bChangedUtilizationSetting && !this.getProperty("/showUtilizationIndicator")) {
				this.setProperty("/bUtilizationsToggleBtnOn", true);
			}
			if (!this.getProperty("/bAtleastOneLabelIsActive")) {
				this.setProperty("/bLabelsToggleBtnOn", true);
			}
		},

		checkIfAtleastOneLabelIsActive: function () {
			if (
				this.getProperty("/orderLabelLeft").includes("NoLabel") &&
				this.getProperty("/orderLabelInside").includes("NoLabel") &&
				this.getProperty("/orderLabelRight").includes("NoLabel") &&
				this.getProperty("/operationLabelLeft").includes("NoLabel") &&
				this.getProperty("/operationLabelInside").includes("NoLabel") &&
				this.getProperty("/operationLabelRight").includes("NoLabel")
			) {
				this.setProperty("/bAtleastOneLabelIsActive", false);
			} else {
				this.setProperty("/bAtleastOneLabelIsActive", true);
			}
		},

		updateOrderLabels: function (oSettings) {
			var bOrderBarLabelChanged = false;

			Object.keys(oSettings).forEach(
				function (settingName) {
					if (settingName === "OrderLeftComboBox" || settingName === "OrderInsideComboBox" || settingName === "OrderRightComboBox") {
						bOrderBarLabelChanged = true;
						var sKey = oSettings[settingName].split("-");
						if (sKey[1] === "Left") {
							this.setProperty("/orderLabelLeft", oSettings[settingName]);
						} else if (sKey[1] === "Inside") {
							this.setProperty("/orderLabelInside", oSettings[settingName]);
						} else {
							this.setProperty("/orderLabelRight", oSettings[settingName]);
						}
					}
				}.bind(this)
			);

			return bOrderBarLabelChanged;
		},

		updateOperationLabels: function (oSettings) {
			var bOpBarLabelChanged = false;

			Object.keys(oSettings).forEach(
				function (settingName) {
					if (settingName === "OperationLeftComboBox" || settingName === "OperationInsideComboBox" || settingName === "OperationRightComboBox") {
						bOpBarLabelChanged = true;
						var sKey = oSettings[settingName].split("-");
						if (sKey[1] === "Left") {
							this.setProperty("/operationLabelLeft", oSettings[settingName]);
						} else if (sKey[1] === "Inside") {
							this.setProperty("/operationLabelInside", oSettings[settingName]);
						} else {
							this.setProperty("/operationLabelRight", oSettings[settingName]);
						}
					}
				}.bind(this)
			);

			return bOpBarLabelChanged;
		}
	});
});
