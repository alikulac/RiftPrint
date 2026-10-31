/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/BaseViewChild.controller"], function (BaseViewChildController) {
	"use strict";

	return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.ordergantt.binding.LabelFields.controller", {
		// before cleanup: SchedulingBoard.handleHiddenOrderColSelectionAsLabel
		getSelectedNonMandatoryOrderFields: function () {
			var oOptionalFieldsSelection = {
				MainWorkCenter: false,
				MainWorkCenterPlant: false
			};

			var aFieldsInLabels = [];
			aFieldsInLabels.push(this.oUIModel.getProperty("/orderLabelInside").split("-")[0]);
			aFieldsInLabels.push(this.oUIModel.getProperty("/orderLabelRight").split("-")[0]);
			aFieldsInLabels.push(this.oUIModel.getProperty("/orderLabelLeft").split("-")[0]);

			aFieldsInLabels.forEach(function (sField) {
				if (oOptionalFieldsSelection[sField] !== undefined) {
					oOptionalFieldsSelection[sField] = true;
				}
				if (sField === "MainWorkCenterPlant" || sField === "WorkCenter") {
					oOptionalFieldsSelection.MainWorkCenter = true;
				}
			});

			var aResult = [];
			for (var sField in oOptionalFieldsSelection) {
				if (oOptionalFieldsSelection[sField]) {
					aResult.push(sField);
				}
			}

			return aResult;
		},
		
		// before cleanup: SchedulingBoard.handleHiddenOpColSelectionAsLabel
		getSelectedNonMandatoryOperationFields: function () {
			var oOptionalFieldsSelection = {
				MaintOpExecutionStageName: false,
				MainWorkCenterPlant: false
			};

			var aFieldsInLabels = [];
			aFieldsInLabels.push(this.oUIModel.getProperty("/operationLabelInside").split("-")[0]);
			aFieldsInLabels.push(this.oUIModel.getProperty("/operationLabelRight").split("-")[0]);
			aFieldsInLabels.push(this.oUIModel.getProperty("/operationLabelLeft").split("-")[0]);

			aFieldsInLabels.forEach(function (sField) {
				if (oOptionalFieldsSelection[sField] !== undefined) {
					oOptionalFieldsSelection[sField] = true;
				}
			});

			var aResult = [];
			for (var sField in oOptionalFieldsSelection) {
				if (oOptionalFieldsSelection[sField]) {
					aResult.push(sField);
				}
			}

			return aResult;
		}
	});
});
