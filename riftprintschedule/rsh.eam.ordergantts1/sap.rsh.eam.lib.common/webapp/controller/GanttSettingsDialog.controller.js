/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseFragment.controller",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/ui/core/Fragment",
		"sap/ui/model/json/JSONModel",
		"sap/ui/Device",
		"sap/ui/core/ValueState"
	],
	function (BaseFragmentController, Constants, Fragment, JSONModel, Device, ValueState) {
		"use strict";
		return BaseFragmentController.extend("sap.rsh.eam.lib.common.controller.GanttSettingsDialog.controller", {
			_oSettingConfigurationModel: undefined,
			_oChangedSettings: undefined,
			_oUtilTHValueStateModel: undefined,
			_fnResolve: undefined,
			_oSettingValues: undefined,
			_oOriginalSettings: undefined,

			constructor: function (oComponent, oDependent, oSettingConfiguration) {
				BaseFragmentController.call(this, {
					component: oComponent,
					dependent: oDependent,
					fragmentName: "sap.rsh.eam.lib.common.view.GanttSettingsDialog",
					fragmentId: oDependent.getId()
				});
				this._oSettingConfigurationModel = new JSONModel(oSettingConfiguration);
			},

			onInit: function () {
				this._oFragment.setModel(this._oSettingConfigurationModel, "SettingConfiguration");
				this._oSettingValues = new JSONModel();
				this._oFragment.setModel(this._oSettingValues, "SettingValues");
				this._oUtilTHValueStateModel = new JSONModel();
				this._oFragment.setModel(this._oUtilTHValueStateModel, "utilizationThresholdValueStateModel");
				if (Device.system.phone) {
					this._oFragment.setStretch(true);
				}
			},

			open: function (oSettingValues) {
				return new Promise(
					function (resolve, reject) {
						this.getFragment().then(
							function (oDialog) {
								this._fnResolve = resolve;
								this._oChangedSettings = {}; //holds list of actual changed settings
								this._oSettingValues.setData(oSettingValues); // Actual Value setting - changed during setting execution
								this._oOriginalSettings = JSON.parse(JSON.stringify(oSettingValues)); //Read-only copy of the setting values when starting the dialog
								this._resetThresholdValueStateModel();
								oDialog.open();
							}.bind(this)
						);
					}.bind(this)
				);
			},

			onSave: function () {
				//Check if a setting that is changed twice is not present in _oChangedSettings
				for (var sProperty in this._oChangedSettings) {
					if (this._oOriginalSettings[sProperty] === this._oChangedSettings[sProperty]) {
						delete this._oChangedSettings[sProperty];
					}
				}

				if (JSON.stringify(this._oChangedSettings) !== "{}") {
					this._fnResolve(this._oChangedSettings);
				}
				this._oFragment.close();
			},

			onCheckBoxSelect: function (oEvent) {
				var sChangedSetting = oEvent.getSource().getName();
				this._oChangedSettings[sChangedSetting] = oEvent.getSource().getSelected();
			},

			onCancel: function () {
				this._oFragment.close();
			},

			onTHInputLiveChange: function (oEvent) {
				var sInputValue = oEvent.getParameter("value");
				var bValidInput = /^\d{1,3}$/.test(sInputValue);
				if (!bValidInput) {
					oEvent.getSource().setValueState(ValueState.Error);
					oEvent.getSource().setValueStateText(this.oCommonBundle.getText("InvalidNumberInput"));
				} else {
					var sChangedThreshold = oEvent.getSource().getName();
					this._oChangedSettings[sChangedThreshold] = sInputValue;
					this._validateChangedThreshold(sInputValue, sChangedThreshold);
					this._oSettingValues.setProperty("/" + sChangedThreshold, sInputValue);
				}
			},

			_validateChangedThreshold: function (sThresholdValue, sThresholdName) {
				var oChangedValues = Object.assign({}, this._oSettingValues.getData(), this._oChangedSettings);
				var iChangedThreshold = Number(sThresholdValue),
					iLowerThreshold = Number(oChangedValues.ilowerThreshold),
					iMiddleThreshold = Number(oChangedValues.iMiddleThreshold),
					iHigherThreshold = Number(oChangedValues.iHigherThreshold);
				if (sThresholdName === "ilowerThreshold") {
					this._validateLowerThreshold(iChangedThreshold, iMiddleThreshold, iHigherThreshold);
				} else if (sThresholdName === "iMiddleThreshold") {
					this._validateMiddleThreshold(iChangedThreshold, iLowerThreshold, iHigherThreshold);
				} else if (sThresholdName === "iHigherThreshold") {
					this._validateHigherThreshold(iChangedThreshold, iLowerThreshold, iMiddleThreshold);
				}
			},

			_validateLowerThreshold: function (iChangedThreshold, iMiddleThreshold, iHigherThreshold) {
				if (iChangedThreshold < iMiddleThreshold && iChangedThreshold < iHigherThreshold && iMiddleThreshold < iHigherThreshold) {
					this._resetThresholdValueStateModel();
				} else {
					this._setFullThresholdValueErrorStateAscendingOrder();
				}
			},

			_validateMiddleThreshold: function (iChangedThreshold, iLowerThreshold, iHigherThreshold) {
				if (iLowerThreshold < iChangedThreshold && iChangedThreshold < iHigherThreshold) {
					this._resetThresholdValueStateModel();
				}

				if (iChangedThreshold <= iLowerThreshold) {
					this._oUtilTHValueStateModel.setProperty("/lowerThresholdValueState", "Error");
					this._oUtilTHValueStateModel.setProperty("/MiddleThresholdValueState", "Error");
					this._oUtilTHValueStateModel.setProperty("/HigherThresholdValueState", "None");
					this._oUtilTHValueStateModel.setProperty("/errorValueStateText", this.oCommonBundle.getText("AscendingOrderValuesError"));
				}

				if (iChangedThreshold >= iHigherThreshold) {
					this._oUtilTHValueStateModel.setProperty("/lowerThresholdValueState", "None");
					this._oUtilTHValueStateModel.setProperty("/HigherThresholdValueState", "Error");
					this._oUtilTHValueStateModel.setProperty("/MiddleThresholdValueState", "Error");
					this._oUtilTHValueStateModel.setProperty("/errorValueStateText", this.oCommonBundle.getText("AscendingOrderValuesError"));
				}
			},

			_validateHigherThreshold: function (iChangedThreshold, iLowerThreshold, iMiddleThreshold) {
				if (iChangedThreshold > iMiddleThreshold && iChangedThreshold > iLowerThreshold && iLowerThreshold < iMiddleThreshold) {
					this._resetThresholdValueStateModel();
				} else {
					this._setFullThresholdValueErrorStateAscendingOrder();
				}
			},

			_resetThresholdValueStateModel: function () {
				this._oUtilTHValueStateModel.setData({
					errorValueStateText: "",
					lowerThresholdValueState: "None",
					MiddleThresholdValueState: "None",
					HigherThresholdValueState: "None"
				});
			},

			_setFullThresholdValueErrorStateAscendingOrder: function () {
				this._oUtilTHValueStateModel.setData({
					errorValueStateText: this.oCommonBundle.getText("AscendingOrderValuesError"),
					lowerThresholdValueState: "Error",
					MiddleThresholdValueState: "Error",
					HigherThresholdValueState: "Error"
				});
			},

			_getStartThresholdText: function (sThreshold) {
				if (sThreshold && sThreshold.length > 0) {
					var sFormattedThreshold = " ".repeat(3 - sThreshold.length) + sThreshold;
					return this.oCommonBundle.getText("EnhancedSettingsTextFromTo", [sFormattedThreshold]);
				}
				return "";
			},

			formatStartThresholdValue: function (sThreshold) {
				if (sThreshold && sThreshold.length > 0) {
					var sIncreasedThreshold = (Number(sThreshold) + 1).toString();
					return this._getStartThresholdText(sIncreasedThreshold);
				}
				return "";
			},

			formatStartandEndThresholdValue: function (sStartThreshold, sEndThreshold) {
				var sIncreasedStartThreshold = "";
				var sEndThresholdVal = "";
				if (sStartThreshold && sStartThreshold.length > 0 && sEndThreshold && sEndThreshold.length > 0) {
					sIncreasedStartThreshold = (Number(sStartThreshold) + 1).toString();
					sEndThresholdVal = Number(sEndThreshold).toString();
					return this.oCommonBundle.getText("EnhancedSettingsTextFromAndTo", [sIncreasedStartThreshold, sEndThresholdVal]);
				} else if (sStartThreshold && sStartThreshold.length > 0 && !sEndThreshold) {
					sIncreasedStartThreshold = (Number(sStartThreshold) + 1).toString();
					sEndThresholdVal = Number(999).toString();
					return this.oCommonBundle.getText("EnhancedSettingsTextFromAndTo", [sIncreasedStartThreshold, sEndThresholdVal]);
				}
				return "";
			},

			formatStartLowerThresholdValue: function (sThreshold) {
				return this._getStartThresholdText(sThreshold);
			},

			formatShowLowThresholdText: function (sStartThreshold, sEndThreshold) {
				return this.oCommonBundle.getText("EnhancedSettingsTextFromAndTo", [sStartThreshold, sEndThreshold]);
			},

			getItemText: function (sKey) {
				return this.oCommonBundle.getText(sKey.split("-")[0]);
			},

			onLabelSelectionChange: function (oEvent) {
				var sChangedLabel = oEvent.getSource().getName();
				this._oChangedSettings[sChangedLabel] = oEvent.getSource().getSelectedItem().getKey();

				if (sChangedLabel === "OrderLeftComboBox" || sChangedLabel === "OrderInsideComboBox" || sChangedLabel === "OrderRightComboBox") {
					var oOrderLeftComboBox = this.byId("idOrderLeftComboBox"),
						oOrderInsideComboBox = this.byId("idOrderInsideComboBox"),
						oOrderRightComboBox = this.byId("idOrderRightComboBox");

					this._validationsOnLabelSelection(oOrderLeftComboBox, oOrderInsideComboBox, oOrderRightComboBox);
				} else if (
					sChangedLabel === "OperationLeftComboBox" ||
					sChangedLabel === "OperationInsideComboBox" ||
					sChangedLabel === "OperationRightComboBox"
				) {
					var oOpLeftComboBox = this.byId("idOperationLeftComboBox"),
						oOpInsideComboBox = this.byId("idOperationInsideComboBox"),
						oOpRightComboBox = this.byId("idOperationRightComboBox");

					this._validationsOnLabelSelection(oOpLeftComboBox, oOpInsideComboBox, oOpRightComboBox);
				} else {
					var oMaintEventLeftComboBox = this.byId("idMaintEventLeftComboBox"),
						oMaintEventRightComboBox = this.byId("idMaintEventRightComboBox");

					this._validationsOnLabelSelection(oMaintEventLeftComboBox, undefined, oMaintEventRightComboBox);
				}
			},

			_validationsOnLabelSelection: function (oLeftComboBox, oInsideComboBox, oRightComboBox) {
				var sLeftLabelSelected = oLeftComboBox.getSelectedKey().split("-")[0],
					sInsideLabelSelected = oInsideComboBox ? oInsideComboBox.getSelectedKey().split("-")[0] : undefined,
					sRightLabelSelected = oRightComboBox.getSelectedKey().split("-")[0];
				var sWarningMsg = this.oCommonBundle.getText("ErrorMessageOnSameFieldSelection");

				oLeftComboBox.setValueState(ValueState.None);
				oLeftComboBox.setValueStateText("");
				if (oInsideComboBox) {
					oInsideComboBox.setValueState(ValueState.None);
					oInsideComboBox.setValueStateText("");
				}
				oRightComboBox.setValueState(ValueState.None);
				oRightComboBox.setValueStateText("");

				if (
					oInsideComboBox &&
					sLeftLabelSelected !== "NoLabel" &&
					sInsideLabelSelected !== "NoLabel" &&
					sLeftLabelSelected === sInsideLabelSelected
				) {
					oLeftComboBox.setValueState(ValueState.Warning);
					oLeftComboBox.setValueStateText(sWarningMsg);
					oInsideComboBox.setValueState(ValueState.Warning);
					oInsideComboBox.setValueStateText(sWarningMsg);
				}

				if (
					oInsideComboBox &&
					sInsideLabelSelected !== "NoLabel" &&
					sRightLabelSelected !== "NoLabel" &&
					sInsideLabelSelected === sRightLabelSelected
				) {
					oInsideComboBox.setValueState(ValueState.Warning);
					oInsideComboBox.setValueStateText(sWarningMsg);
					oRightComboBox.setValueState(ValueState.Warning);
					oRightComboBox.setValueStateText(sWarningMsg);
				}

				if (sRightLabelSelected !== "NoLabel" && sLeftLabelSelected !== "NoLabel" && sRightLabelSelected === sLeftLabelSelected) {
					oRightComboBox.setValueState(ValueState.Warning);
					oRightComboBox.setValueStateText(sWarningMsg);
					oLeftComboBox.setValueState(ValueState.Warning);
					oLeftComboBox.setValueStateText(sWarningMsg);
				}
			},

			onPressColorChangeThreshold: function (oEvent) {
				this._sThresholdColorValueUnderChange = this._determineColorThresholdSettingName(oEvent.getSource().getId());
				if (!this.oColorPalettePopoverUtilThreshold) {
					this.oColorPalettePopoverUtilThreshold = new sap.m.ColorPalettePopover({
						showDefaultColorButton: false,
						colors: ["#FF8888", "#F8B67D", "#ACE1C2", "#D4D6D7"],
						displayMode: "Simplified",
						colorSelect: this.onColorSelectForUtilThreshold.bind(this)
					});
				}
				this.oColorPalettePopoverUtilThreshold.setColorPickerSelectedColor(
					this._oSettingValues.getProperty("/" + this._sThresholdColorValueUnderChange)
				);
				this.oColorPalettePopoverUtilThreshold.openBy(oEvent.getSource());
			},

			onColorSelectForUtilThreshold: function (oEvent) {
				if (this._sThresholdColorValueUnderChange) {
					var sNewColor = oEvent.getParameter("value");
					this._oChangedSettings[this._sThresholdColorValueUnderChange] = sNewColor;
					this._oSettingValues.setProperty("/" + this._sThresholdColorValueUnderChange, sNewColor);
				}
			},

			_determineColorThresholdSettingName: function (sColorChangeLinkId) {
				var iIndexStableId = sColorChangeLinkId.search("idLinkChange");
				var sStableId = sColorChangeLinkId.slice(iIndexStableId);
				var sColorThresholdSettingName = "";
				switch (sStableId) {
					case "idLinkChangeBelowTHColor":
						sColorThresholdSettingName = "sUtilColorBelowThreshold";
						break;
					case "idLinkChangeLowerTHColor":
						sColorThresholdSettingName = "sUtilColorLowerThreshold";
						break;
					case "idLinkChangeMiddleTHColor":
						sColorThresholdSettingName = "sUtilColorMiddleThreshold";
						break;
					case "idLinkChangeHigherTHColor":
						sColorThresholdSettingName = "sUtilColorHigherThreshold";
						break;
				}
				return sColorThresholdSettingName;
			}
		});
	}
);
