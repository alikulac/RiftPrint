/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * Controller for the Resource Gantt - People gantt dialog fragment(PeopleGanttDialog.fragment.xml)
 * Hook methods of view life cycle can be imeplemented for fragment life cycle.
 * @name rsh.eam.lib.common.controller.PeopleGanttDialog
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/people/PeopleGantt.controller",
		"sap/rsh/eam/lib/common/base/BaseFragment.controller",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/m/MessageBox",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/ui/Device",
		"sap/rsh/eam/lib/common/utils/GanttUtils",
		"sap/ui/core/syncStyleClass"
	],
	function (PeopleGanttController, BaseFragmentController, Utils, MessageBox, Constants, Device, GanttUtils, syncStyleClass) {
		"use strict";

		return BaseFragmentController.extend("sap.rsh.eam.lib.common.people.PeopleGanttDialog.controller", {
			constructor: function (oComponent, oDependent, sModelName) {
				var oParams = {
					component: oComponent,
					dependent: oDependent,
					fragmentName: "sap.rsh.eam.lib.common.people.PeopleGanttDialog",
					fragmentId: oComponent.createId("idPeopleGanttDialog"),
					modelName: sModelName
				};
				BaseFragmentController.call(this, oParams);
			},

			onInitMembers: function (oParams) {
				this._oPeopleGanttController = new PeopleGanttController({
					component: oParams.component,
					dependent: oParams.dependent,
					fragmentName: "sap.rsh.eam.lib.common.people.PeopleGantt",
					fragmentId: oParams.component.createId("idPeopleGantt"),
					modelName: oParams.modelName,
					rowsChangedEventHandler: this._setDialogHeight.bind(this),
					clientSideChangesEventHandler: this._enableSaveButton.bind(this)
				});
				this._oDataModel = this.oComponent.getModel(oParams.modelName);
				this._oGanttChartContainer = undefined;
			},

			onInit: function () {
				this._oGanttChartContainer = this.byId("idResourceGanttContainer");
				this._oGanttChartContainer.addGanttChart(this._oPeopleGanttController.getFragmentSync());
				this._oFragment.setBusyIndicatorDelay(0);
			},

			open: function (oTimePeriod, aOpShapePaths, oLayoutSettings) {
				return new Promise(
					function (resolve, reject) {
						this._fnResolve = resolve;
						var oDisplayWarning = this._displayMessageBox(aOpShapePaths);
						oDisplayWarning.then(this._open.bind(this, oTimePeriod, aOpShapePaths, oLayoutSettings), resolve);
					}.bind(this)
				);
			},

			_open: function (oTimePeriod, aOpShapePaths, oLayoutSettings) {
				this._oPeopleGanttController.load().then(
					function () {
						this.getFragment().then(
							function () {
								this._oPeopleGanttController.loadPeopleData(oTimePeriod, aOpShapePaths);
								this._applySettings(aOpShapePaths, oLayoutSettings);
								this._oFragment.open();
							}.bind(this)
						);
					}.bind(this)
				);
			},

			_applySettings: function (aOpShapePaths, oLayoutSettings) {
				this._applyContentDensityClass();
				this._oPeopleGanttController.applySettings();
				this._oGanttChartContainer.applySettings(oLayoutSettings);
				this._setTitle(aOpShapePaths);
				this.byId("idSaveAssignmentsButton").setEnabled(false);
				GanttUtils.setStatusBarDateTimeFormat(this._oGanttChartContainer);
			},

			_applyContentDensityClass: function () {
				syncStyleClass("sapUiSizeCompact", this._oDependent, this._oFragment);
				syncStyleClass("sapUiSizeCozy", this._oDependent, this._oFragment);
				syncStyleClass("sapUiSizeCondensed", this._oDependent, this._oFragment);
			},

			/**
			 * @param {Array} aOpShapePaths Minimum length of 1
			 */
			_setTitle: function (aOpShapePaths) {
				var sTitleKey, sOrder, sOperation, sSubOperation;
				if (aOpShapePaths.length > 1) {
					sTitleKey = "peopleGanttTitleForMultipleOp";
				} else {
					var oOpData = this._oDataModel.getProperty(aOpShapePaths[0]);
					sOrder = oOpData.MaintenanceOrder;
					sOperation = oOpData.MaintenanceOrderOperation;
					sSubOperation = oOpData.MaintenanceOrderSubOperation;

					if (sSubOperation) {
						sTitleKey = "peopleGanttTitleForOneSubop";
					} else {
						sTitleKey = "peopleGanttTitleForOneOp";
					}
				}
				this._oFragment.setTitle(this.oCommonBundle.getText(sTitleKey, [sOrder, sOperation, sSubOperation]));
			},

			_displayMessageBox: function (aOpShapePaths) {
				return new Promise(
					function (resolve, reject) {
						var oMessageType = this._getMessageType(aOpShapePaths);
						var sMessageText;
						if (oMessageType.operationWithSameStartEndDate || oMessageType.operationWithZeroWork) {
							var sTextKey = oMessageType.operationWithSameStartEndDate ? "OperationSameStartEndErrorMessage" : "OperationWorkZeroErrorMessage";
							sMessageText = this.oCommonBundle.getText(sTextKey);
							MessageBox.error(sMessageText, {
								onClose: function () {
									reject();
								}
							});
						} else if (oMessageType.differentWorkCenters) {
							sMessageText = this.oCommonBundle.getText("MultipleWorkCentersMessage");
							MessageBox.warning(sMessageText, {
								actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
								onClose: function (sAction) {
									if (sAction === "OK") {
										resolve();
									} else {
										reject();
									}
								}
							});
						} else {
							resolve();
						}
					}.bind(this)
				);
			},

			_getMessageType: function (aOpShapePaths) {
				var bDifferentWorkCenters = false,
					bOpHasZeroWork = false,
					bOpHasSameStartEndTime = false;

				var sFirstOpWorkCenter = this._oDataModel.getProperty(aOpShapePaths[0]).WorkCenter;
				aOpShapePaths.forEach(
					function (sPath) {
						var oOpData = this._oDataModel.getProperty(sPath);
						bDifferentWorkCenters = bDifferentWorkCenters || oOpData.WorkCenter !== sFirstOpWorkCenter;
						bOpHasZeroWork = bOpHasZeroWork || oOpData.OperationPlannedWork === "0.0";
						bOpHasSameStartEndTime =
							bOpHasSameStartEndTime || oOpData.OrderOperationStartDateTime.getTime() === oOpData.OrderOperationEndDateTime.getTime();
					}.bind(this)
				);

				return {
					differentWorkCenters: bDifferentWorkCenters,
					operationWithSameStartEndDate: bOpHasSameStartEndTime,
					operationWithZeroWork: bOpHasZeroWork
				};
			},

			_enableSaveButton: function (bEnable) {
				this.byId("idSaveAssignmentsButton").setEnabled(bEnable);
			},

			_setDialogHeight: function (iRows) {
				// All height units are in rem
				var fDialogHeaderHeight = 2.75,
					fTableHeaderHeight = 3.0625,
					fRowHeight = 3.0625,
					fStatusBarHeight = 2,
					fFooterHeight = 2.75,
					fExtraPadding = 1.5;

				// Convert px to rem
				var fWindowHeight = Device.resize.height / 16;

				// Maximum content height of dialog should be 50% window height
				var fMaxDialogContentHeight = 0.5 * fWindowHeight - fDialogHeaderHeight - fFooterHeight;
				var fDialogContentHeight = fTableHeaderHeight + fStatusBarHeight + fExtraPadding;

				if (iRows <= 4) {
					// Minimum height of dialog should be 5 rows
					fDialogContentHeight += 5 * fRowHeight;
				} else {
					// One extra blank row of height is added to serve as error tolerance in case there
					// are some changes to the height of standard components like row, status bar etc. in the future
					fDialogContentHeight += (iRows + 1) * fRowHeight;
				}

				fDialogContentHeight = fDialogContentHeight > fMaxDialogContentHeight ? fMaxDialogContentHeight : fDialogContentHeight;

				this._oFragment.setContentHeight(fDialogContentHeight + "rem");
			},

			_displayToastMessage: function (bRequestSucceeded) {
				if (!bRequestSucceeded) {
					Utils.addMessage(this.oCommonBundle.getText("AllErrorsMessageToast"), sap.ui.core.MessageType.Error, Constants.sDisplayTypeMessageToast);
				} else {
					Utils.addMessage(this.oCommonBundle.getText("SuccessMessageToast"), sap.ui.core.MessageType.Success, Constants.sDisplayTypeMessageToast);
				}
			},

			onSave: function (oEvent) {
				this._oFragment.setBusy(true);
				this._oPeopleGanttController.saveChanges().then(
					function (oResponse) {
						this._displayToastMessage(oResponse.success);
						this._oFragment.setBusy(false);
						this._fnResolve(oResponse.targetParams);
						this.onClose();
					}.bind(this),
					function (oReason) {
						this._oFragment.setBusy(false);
					}.bind(this)
				);
			},

			getPersonalizationChanges: function () {
				return {
					columns: this._oPeopleGanttController.getVisibleColumnIds()
				};
			},

			onClose: function (oEvent) {
				this._oFragment.close();
			},

			onAfterClose: function () {
				this._oPeopleGanttController.unload();
				this._fnResolve();
			},

			onExit: function () {
				this._oPeopleGanttController.destroy();
			}
		});
	}
);
