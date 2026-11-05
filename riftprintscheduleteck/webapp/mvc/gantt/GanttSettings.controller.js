/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/BaseViewChild.controller"], function (BaseViewChildController) {
	"use strict";

	return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.gantt.GanttSettings.controller", {
		openDialog: function (oEvent) {
			var oValues = this._getValues();
			this.controllers.ganttSettingsDialog.open(oValues).then(this._onDialogChange.bind(this));
		},

		_onDialogChange: function (oSettings) {
			var sPropertypath;
			var bChangedThresholdSetting = false,
				bChangedRelationshipSetting = false,
				bChangedUtilizationSetting = false,
				bChangedCondensedModeActive = false;
			//Save the changed custom setting to UIModel
			Object.keys(oSettings).forEach(
				function (sSettingName) {
					//Change UIModel for custom settings - standard gantt settings are not part of the UIModel
					//If Statement has to be kept in sync with the used standard settings of Gantt, whenerver one is added is needs to be added here as well
					if (
						sSettingName !== "enableNowLine" ||
						sSettingName !== "enableCursorLine" ||
						sSettingName !== "enableVerticalLine" ||
						sSettingName !== "enableStatusBar"
					) {
						sPropertypath = "/" + sSettingName;
						this.oUIModel.setProperty(sPropertypath, oSettings[sSettingName]);
						if (!bChangedThresholdSetting) {
							bChangedThresholdSetting = this._utilizationThresholdSettingChanged(sSettingName);
						}
						if (sSettingName === "showImpRel" || sSettingName === "showExpRel") {
							bChangedRelationshipSetting = true;
						}
						if (sSettingName === "showUtilizationIndicator") {
							bChangedUtilizationSetting = true;
						}
						if (sSettingName === "condensedModeActive") {
							bChangedCondensedModeActive = true;
						}
					}
				}.bind(this)
			);

			//Collapse is needed for Threshold setting change (value and color) as otherwise formatter are not applied
			if (bChangedThresholdSetting) {
				//TO DO check if approach for utilization gantt (bind dummy UIModel property) can be used here as well instead of collapse
				this.byId("idOrderTreeTable").collapseAll();
				this.oUIModel.setProperty("/sThresholdUpdateTime", new Date().toISOString());
			}

			this.controllers.ordergantt.binding.setModelSizeLimit();

			this.controllers.ordergantt.relationshipsBinding.bind();
			this.controllers.ordergantt.utilizationBinding.bind();
			this.controllers.ordergantt.calendarBinding.bind(false);

			if (oSettings.condensedModeActive !== undefined) {
				this.controllers.ganttContainer.setCondensed(oSettings.condensedModeActive);
			}

			this.controllers.utilizationGantt.onSettingsChange(oSettings, bChangedThresholdSetting, bChangedCondensedModeActive);

			//reapply all used standard settings at once if at least one of them has changed
			if (
				oSettings.enableNowLine !== undefined ||
				oSettings.enableCursorLine !== undefined ||
				oSettings.enableVerticalLine !== undefined ||
				oSettings.enableStatusBar !== undefined
			) {
				this.controllers.ganttContainer.applySettings(oSettings);
			}

			this._updateOrderLabelsOnChange(oSettings);
			this._updateOperationLabelsOnChange(oSettings);
			this.oUIModel.checkIfAtleastOneLabelIsActive();
			this.oUIModel.updateToggleBtnProperty(bChangedRelationshipSetting, bChangedUtilizationSetting);
			this.controllers.persGanttSettings.save();
		},

		_utilizationThresholdSettingChanged: function (sSettingName) {
			switch (sSettingName) {
				case "ilowerThreshold":
				case "iMiddleThreshold":
				case "iHigherThreshold":
				case "bShowBarBelow":
				case "bShowBarLower":
				case "bShowBarMiddle":
				case "bShowBarHigher":
				case "sUtilColorBelowThreshold":
				case "sUtilColorLowerThreshold":
				case "sUtilColorMiddleThreshold":
				case "sUtilColorHigherThreshold":
					return true;
				default:
					return false;
			}
		},

		_updateOrderLabelsOnChange: function (oSettings) {
			var bChanged = this.oUIModel.updateOrderLabels(oSettings);
			if (bChanged) {
				var bRefresh = this._refreshAfterOrderLabelChange();
				if (bRefresh) {
					this.controllers.ordergantt.binding.refreshBinding({ filtersChanged: false, force: true });
				}
			}
		},

		_updateOperationLabelsOnChange: function (oSettings) {
			var bChanged = this.oUIModel.updateOperationLabels(oSettings);
			if (bChanged) {
				var bRefresh = this._refreshAfterOperationLabelChange();
				if (bRefresh) {
					this.controllers.ordergantt.binding.refreshBinding({ filtersChanged: false, force: true });
				}
			}
		},

		// before cleanup: SchedulingBoard.handleHiddenOrderColSelectionAsLabel
		_refreshAfterOrderLabelChange: function () {
			var aFields = this.controllers.ordergantt.labelFields.getSelectedNonMandatoryOrderFields();
			for (var sField in aFields) {
				var bIsColumnsField = this.controllers.ordergantt.columnFields.hasOrderField(sField);
				if (!bIsColumnsField) {
					return true;
				}
			}
			return false;
		},

		// before cleanup: SchedulingBoard.handleHiddenOpColSelectionAsLabel
		_refreshAfterOperationLabelChange: function () {
			var aFields = this.controllers.ordergantt.labelFields.getSelectedNonMandatoryOperationFields();
			for (var sField in aFields) {
				var bIsColumnsField = this.controllers.ordergantt.columnFields.hasOperationField(sField);
				if (!bIsColumnsField) {
					return true;
				}
			}
			return false;
		},

		_getValues: function () {
			var oSettingValues = this.oUIModel.getGanttSettings();
			var oContainerSettings = this.controllers.ganttContainer.getSettings();
			Object.assign(oSettingValues, oContainerSettings);
			return oSettingValues;
		}
	});
});
