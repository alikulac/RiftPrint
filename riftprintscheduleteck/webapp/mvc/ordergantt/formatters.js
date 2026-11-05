/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/utils/formatter",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/ui/core/format/DateFormat",
		"sap/gantt/library",
		"sap/base/strings/formatMessage"
	],
	function (commonFormatter, Constants, Utils, DateFormat, GanttLib, formatMessage) {
		"use strict";

		var oFormatters;
		var oDateFormatTZInstance = DateFormat.getDateTimeWithTimezoneInstance({ showTimezone: false }),
			oDateFormatDateInstance = DateFormat.getDateInstance(),
			oDateFormatTimeInstance = DateFormat.getTimeInstance();

		oFormatters = {
			formatMessage: formatMessage,

			getShowActualDatesVisibility: function (iRowLevel, sProcessingStatus, bShowActualDates) {
				if (iRowLevel && sProcessingStatus === Constants.inProcessCode && bShowActualDates) {
					return true;
				}
				return false;
			},

			formatOrderOpsLink: function (iOrderOperationRowLevel, sMaintenanceOrder, sMaintenanceOrderOperation, sMaintenanceOrderSubOperation) {
				if (iOrderOperationRowLevel === 0) {
					return sMaintenanceOrder;
				} else {
					if (sMaintenanceOrderSubOperation) {
						return sMaintenanceOrderOperation + " / " + sMaintenanceOrderSubOperation;
					} else {
						return sMaintenanceOrderOperation;
					}
				}
			},

			getOrderOpsSemanticObject: function (iOrderOperationRowLevel) {
				return iOrderOperationRowLevel === 0 ? "MaintenanceOrder" : "MaintenanceOrderOperation";
			},

			getOrderOpsAdditionalSemanticObject: function (iOrderOperationRowLevel) {
				return iOrderOperationRowLevel === 0 ? undefined : "MaintenanceOrder";
			},

			getOrderOpsFieldName: function (iOrderOperationRowLevel) {
				return iOrderOperationRowLevel === 0 ? "MaintenanceOrder" : "MaintenanceOrderOperation";
			},

			formatOrderOpsText: function (iOrderOperationRowLevel, sMaintenanceOrderDesc, sOperationDescription, sMaintenanceOrderSubOperation) {
				if (iOrderOperationRowLevel === 0) {
					return sMaintenanceOrderDesc;
				} else {
					return sOperationDescription;
				}
			},

			// for concatenating Duration and its Unit
			formatWork: function (sDuration, sUnit) {
				if (sDuration && sUnit) {
					return commonFormatter.formatDuration(sDuration) + " " + sUnit;
				} else {
					return "";
				}
			},

			formatActivityType: function (formatActivityType, activityTypeName) {
				if (formatActivityType && activityTypeName) {
					return activityTypeName + " (" + formatActivityType + ")";
				} else {
					return undefined;
				}
			},

			formatCombinedDateTime: function (iOrderOperationRowLevel, dOrderOpDateTime, dOrderDateTime) {
				if (iOrderOperationRowLevel === 0) {
					return dOrderDateTime ? oDateFormatTZInstance.format(dOrderDateTime) : dOrderDateTime;
				} else if (iOrderOperationRowLevel === 1) {
					return dOrderOpDateTime ? oDateFormatTZInstance.format(dOrderOpDateTime) : dOrderOpDateTime;
				}
				return "";
			},

			getCriticalPathHight: function (iOrderOperationRowLevel, bCondensedModeActive) {
				if (iOrderOperationRowLevel === 1 && bCondensedModeActive) {
					return 1;
				} else if (iOrderOperationRowLevel === 1 && bCondensedModeActive === false) {
					return 2;
				} else {
					return 0;
				}
			},

			// determine the critical path yBias Value
			getCPyBiasValue: function (iOrderOperationRowLevel, bCondensedModeActive) {
				if (iOrderOperationRowLevel === 1 && bCondensedModeActive) {
					return 8;
				} else if (iOrderOperationRowLevel === 1 && bCondensedModeActive === false) {
					return 15;
				} else {
					return 0;
				}
			},

			constraintTimeFormatter: function (dTime, sOpConstraintType) {
				if (sOpConstraintType === "1") {
					return dTime;
				} else {
					return null;
				}
			},

			getOpConstraintVisibility: function (bShowRestrictions, iOrderOperationRowLevel, dOpStartConstraintDateTime) {
				if (bShowRestrictions && iOrderOperationRowLevel === 1 && dOpStartConstraintDateTime) {
					return true;
				}
				return false;
			},

			getStartConstraintTypeText: function (sStartConstraintType, dOpStartConstraintDateTime, dOpStartDateTime) {
				var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
				if (dOpStartConstraintDateTime) {
					var sOpStartConstraintDate = oDateFormatDateInstance.format(dOpStartConstraintDateTime);
					var sOpStartConstraintTime = oDateFormatTimeInstance.format(dOpStartConstraintDateTime);
				}
				//Check Tooltip violation
				if (oFormatters.getOpConstraintFill(sStartConstraintType, dOpStartConstraintDateTime, dOpStartDateTime) === "@sapNegativeColor") {
					return oResourceBundle.getText("bscStartDateConstraintViolatedTooltip", [sOpStartConstraintDate, sOpStartConstraintTime]);
				}
				switch (sStartConstraintType) {
					case "1":
						return oResourceBundle.getText("bscStartDateConstraintType1Tooltip", [sOpStartConstraintDate, sOpStartConstraintTime]);
					case "2":
						return oResourceBundle.getText("bscStartDateConstraintType2Tooltip", [sOpStartConstraintDate, sOpStartConstraintTime]);
					case "3":
						return oResourceBundle.getText("bscStartDateConstraintType3Tooltip", [sOpStartConstraintDate, sOpStartConstraintTime]);
					case "4":
						return oResourceBundle.getText("bscStartDateConstraintType4Tooltip");
					default:
						return "";
				}
			},

			getOpConstraintFill: function (sConstraintType, dOpConstraintDateTime, dOpStarOrEndtDateTime) {
				switch (sConstraintType) {
					case "1":
						//"Must start on" or "Must finish on"
						if (JSON.stringify(dOpConstraintDateTime) === JSON.stringify(dOpStarOrEndtDateTime)) {
							return "@sapTextColor";
						} else {
							return "@sapNegativeColor";
						}
					case "2":
						//"Cannot start before" or "Cannot finish before"
						if (dOpConstraintDateTime < dOpStarOrEndtDateTime) {
							return "@sapTextColor";
						} else {
							return "@sapNegativeColor";
						}
					case "3":
						//"Cannot start later" or "Finish not later"
						if (dOpConstraintDateTime > dOpStarOrEndtDateTime) {
							return "@sapTextColor";
						} else {
							return "@sapNegativeColor";
						}
					case "4":
						return "@sapTextColor";
					default:
						return "@sapTextColor";
				}
			},

			getShowActualDatesYBias: function (bShowUtilizationIndicator, bCondensedModeActive) {
				if (bShowUtilizationIndicator) {
					if (bCondensedModeActive) {
						return 9;
					} else {
						return 11;
					}
				} else {
					if (bCondensedModeActive) {
						return 8;
					} else {
						return 10;
					}
				}
			},

			getShowActualDatesHeight: function (bCondensedModeActive) {
				if (bCondensedModeActive) {
					return 4;
				} else {
					return 6;
				}
			},

			getColor: function (sProcessingStatus) {
				switch (sProcessingStatus) {
					case 30:
						// DISPATCHED
						//green color
						return "@sapPositiveColor";
					case 20:
						// DUE
						//yellow color
						return "@sapCriticalColor";
					default:
						// INPROCESS
						//gray color
						return "@sapNeutralColor";
				}
			},

			// Enable/Disable DND for SubOperation &  In process
			isDNDPossible: function (sSubOperation, sProcessingStatus) {
				if (
					(sSubOperation && sSubOperation === "" && sProcessingStatus !== Constants.inProcessCode) ||
					(!sSubOperation && sProcessingStatus !== Constants.inProcessCode)
				) {
					return true;
				} else {
					return false;
				}
			},

			// Enable/Disable Selection for Orders & Operations
			isSelectable: function (sProcessingStatus) {
				if (sProcessingStatus !== Constants.inProcessCode) {
					return true;
				} else {
					return false;
				}
			},

			// Enable/Disable Connector Points for Operations depending on the setting is on/off
			isConnectable: function (bRelationshipsToggleBtnOn, bShowExpRel, sSubOperation, sProcessingStatus) {
				if (bRelationshipsToggleBtnOn && bShowExpRel && sSubOperation === "" && sProcessingStatus !== Constants.inProcessCode) {
					return true;
				} else {
					return false;
				}
			},

			getUtilizationColor: function (fWorkCenterUtilization) {
				var iWorkCenterUtilization = Math.round(fWorkCenterUtilization);
				var oColorsUtilizationBarsScale = this.oUIModel.getData();
				if (iWorkCenterUtilization >= 0 && iWorkCenterUtilization < Number(oColorsUtilizationBarsScale.ilowerThreshold)) {
					return this.oUIModel.getProperty("/sUtilColorBelowThreshold");
					//return "@sapUiShellNeutralColor";
				}
				if (
					iWorkCenterUtilization >= Number(oColorsUtilizationBarsScale.ilowerThreshold) &&
					iWorkCenterUtilization <= Number(oColorsUtilizationBarsScale.iMiddleThreshold)
				) {
					return this.oUIModel.getProperty("/sUtilColorLowerThreshold");
					//	return "@sapUiShellPositiveColor";
				}
				if (
					iWorkCenterUtilization > Number(oColorsUtilizationBarsScale.iMiddleThreshold) &&
					iWorkCenterUtilization <= Number(oColorsUtilizationBarsScale.iHigherThreshold)
				) {
					return this.oUIModel.getProperty("/sUtilColorMiddleThreshold");
					//	return "@sapUiShellCriticalColor";
				}
				if (iWorkCenterUtilization > Number(oColorsUtilizationBarsScale.iHigherThreshold)) {
					return this.oUIModel.getProperty("/sUtilColorHigherThreshold");
					//	return "@sapUiShellNegativeColor";
				}
				return "";
			},

			getVisibilityForUtilization: function (
				sWorkCenterUtilization,
				sWorkCenterAvailableCapacity,
				sWorkCenterRequiredCapacity,
				bUtilizationsToggleBtnOn
			) {
				if (!bUtilizationsToggleBtnOn) {
					return false;
				}

				var iWorkCenterUtilization = Math.round(sWorkCenterUtilization);
				var oColorsUtilizationBarsScale = this.oUIModel.getData();
				if (Number(sWorkCenterAvailableCapacity) <= 0 && Number(sWorkCenterRequiredCapacity) <= 0) {
					return false;
				} else {
					if (iWorkCenterUtilization >= 0 && iWorkCenterUtilization < Number(oColorsUtilizationBarsScale.ilowerThreshold)) {
						return oColorsUtilizationBarsScale.bShowBarBelow;
					}
					if (
						iWorkCenterUtilization >= Number(oColorsUtilizationBarsScale.ilowerThreshold) &&
						iWorkCenterUtilization <= Number(oColorsUtilizationBarsScale.iMiddleThreshold)
					) {
						return oColorsUtilizationBarsScale.bShowBarLower;
					}
					if (
						iWorkCenterUtilization > Number(oColorsUtilizationBarsScale.iMiddleThreshold) &&
						iWorkCenterUtilization <= Number(oColorsUtilizationBarsScale.iHigherThreshold)
					) {
						return oColorsUtilizationBarsScale.bShowBarMiddle;
					}
					if (iWorkCenterUtilization > Number(oColorsUtilizationBarsScale.iHigherThreshold)) {
						return oColorsUtilizationBarsScale.bShowBarHigher;
					}
					return false;
				}
			},

			getTooltipForUtilization: function (
				fWorkCenterUtilization,
				sWorkCenterRequiredCapacity,
				sWorkCenterAvailableCapacity,
				sWorkCenterCapacityUnit
			) {
				var sRoundedRequiredCapa = parseFloat(sWorkCenterRequiredCapacity).toFixed(1);
				var sRoundedAvailableCapa = parseFloat(sWorkCenterAvailableCapacity).toFixed(1);
				var oBundle = this.getView().getModel("i18n").getResourceBundle();
				return oBundle.getText("UtilizationTooltip", [
					Math.round(fWorkCenterUtilization),
					sRoundedRequiredCapa,
					sRoundedAvailableCapa,
					sWorkCenterCapacityUnit
				]);
			},

			// unique shape id for a relationship
			getShapeId: function (sPredecessorOrderOperationRowID, sSuccessorOrderOperationRowID, sNetworkActivityRelationType) {
				return sPredecessorOrderOperationRowID + "" + sSuccessorOrderOperationRowID + "" + sNetworkActivityRelationType;
			},

			getStrokeFill: function (sExplicit, sViolation) {
				if (sViolation === "X") {
					return "@sapNegativeColor";
				} else if (sExplicit === "X") {
					return "@sapTextColor"; //Fiori Black is not defined (but it is universal)
				} else {
					return "@sapNeutralColor";
				}
			},

			getRelationToolTip: function (
				sNetworkActivityRelationType,
				sPredecessorOrder,
				sPredecessorOrderOperation,
				sSuccessorOrder,
				sSuccessorOrderOperation,
				sRelationshipIsViolated
			) {
				var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
				if (sRelationshipIsViolated === "X") {
					switch (sNetworkActivityRelationType) {
						case GanttLib.simple.RelationshipType.StartToStart:
							return oResourceBundle.getText("violatedS2SRelTooltip", [
								sPredecessorOrder,
								sPredecessorOrderOperation,
								sSuccessorOrder,
								sSuccessorOrderOperation
							]);
						case GanttLib.simple.RelationshipType.StartToFinish:
							return oResourceBundle.getText("violatedS2FRelTooltip", [
								sPredecessorOrder,
								sPredecessorOrderOperation,
								sSuccessorOrder,
								sSuccessorOrderOperation
							]);
						case GanttLib.simple.RelationshipType.FinishToStart:
							return oResourceBundle.getText("violatedF2SRelTooltip", [
								sPredecessorOrder,
								sPredecessorOrderOperation,
								sSuccessorOrder,
								sSuccessorOrderOperation
							]);
						case GanttLib.simple.RelationshipType.FinishToFinish:
							return oResourceBundle.getText("violatedF2FRelTooltip", [
								sPredecessorOrder,
								sPredecessorOrderOperation,
								sSuccessorOrder,
								sSuccessorOrderOperation
							]);
						default:
							return "";
					}
				} else {
					switch (sNetworkActivityRelationType) {
						case GanttLib.simple.RelationshipType.StartToStart:
							return oResourceBundle.getText("normalS2SRelTooltip", [
								sPredecessorOrder,
								sPredecessorOrderOperation,
								sSuccessorOrder,
								sSuccessorOrderOperation
							]);
						case GanttLib.simple.RelationshipType.StartToFinish:
							return oResourceBundle.getText("normalS2FRelTooltip", [
								sPredecessorOrder,
								sPredecessorOrderOperation,
								sSuccessorOrder,
								sSuccessorOrderOperation
							]);
						case GanttLib.simple.RelationshipType.FinishToStart:
							return oResourceBundle.getText("normalF2SRelTooltip", [
								sPredecessorOrder,
								sPredecessorOrderOperation,
								sSuccessorOrder,
								sSuccessorOrderOperation
							]);
						case GanttLib.simple.RelationshipType.FinishToFinish:
							return oResourceBundle.getText("normalF2FRelTooltip", [
								sPredecessorOrder,
								sPredecessorOrderOperation,
								sSuccessorOrder,
								sSuccessorOrderOperation
							]);
						default:
							return "";
					}
				}
			},

			getRelVisibility: function (sExplicit, bShowImpRel, bShowExpRel, bRelationshipsToggleBtnOn) {
				if (!bRelationshipsToggleBtnOn) {
					return 0;
				}

				if (sExplicit === "X") {
					return bShowExpRel ? 1 : 0;
				} else {
					return bShowImpRel ? 1 : 0;
				}
			},

			// Based on user settings and whether the operation is on critical path, shows or hides the red bottom line below operation
			getOnCriticalVisibility: function (sOperationIsOnCriticalPath, bShowCriticalPath) {
				if (sOperationIsOnCriticalPath === "X" && bShowCriticalPath) {
					return true;
				} else {
					return false;
				}
			},

			// Final Due Date Milestone - shown when hovering over the shape
			getFFDMilestoneTitle: function (dFinalDueDate) {
				var sFinalDueDateText = "";
				if (dFinalDueDate) {
					var sFinalDueDate = oDateFormatDateInstance.format(dFinalDueDate, true);
					var oBundle = this.getView().getModel("i18n").getResourceBundle();
					sFinalDueDateText = oBundle.getText("FinalDueDateTooltip", [sFinalDueDate]);
				}
				return sFinalDueDateText;
			},

			fetchScheduleLinkState: function (sMaintSchedSimlnUUID, iNumberOfMaintSchedSimulations, bNavToSchedulesSupported) {
				return (
					(iNumberOfMaintSchedSimulations === 0 &&
						sMaintSchedSimlnUUID !== Constants.idEmptyUUID &&
						(bNavToSchedulesSupported || Utils.isMockRun())) ||
					(iNumberOfMaintSchedSimulations > 0 && sMaintSchedSimlnUUID !== Constants.idEmptyUUID)
				);
			},

			formatScheduleText: function (sFirstSchedule, iNumberOfSchedules) {
				var oBundle = this.getView().getModel("i18n").getResourceBundle();
				var sScheduleListText;
				if (sFirstSchedule) {
					sScheduleListText = iNumberOfSchedules === 0 ? sFirstSchedule : oBundle.getText("ScheduleListText", [sFirstSchedule, iNumberOfSchedules]);
				} else {
					sScheduleListText = oBundle.getText("ScheduleListNoText");
				}
				return sScheduleListText;
			},

			getXBiasForOpBarLeftLabel: function (sMaintenanceOrderSubOperation, bRelationshipsToggleBtnOn, bShowImpRel, bShowExpRel) {
				if (bRelationshipsToggleBtnOn && (bShowImpRel || bShowExpRel)) {
					if (sMaintenanceOrderSubOperation !== "") {
						return -14;
					}
					return -20;
				}
				return -14;
			},

			getXBiasForOpBarRightLabel: function (sMaintenanceOrderSubOperation, bRelationshipsToggleBtnOn, bShowImpRel, bShowExpRel) {
				if (bRelationshipsToggleBtnOn && (bShowImpRel || bShowExpRel)) {
					if (sMaintenanceOrderSubOperation !== "") {
						return 14;
					}
					return 20;
				}
				return 14;
			},

			getYBiasForOpBarLabel: function (
				sMaintenanceOrderSubOperation,
				bRelationshipsToggleBtnOn,
				bShowImpRel,
				bShowExpRel,
				bUtilizationsToggleBtnOn,
				bShowUtilizationIndicator
			) {
				if (bRelationshipsToggleBtnOn && (bShowImpRel || bShowExpRel)) {
					if (sMaintenanceOrderSubOperation !== "") {
						if (bUtilizationsToggleBtnOn && bShowUtilizationIndicator) {
							return 0;
						}
						return -2;
					}
					return -4;
				} else {
					if (bUtilizationsToggleBtnOn && bShowUtilizationIndicator) {
						return 0;
					}
					return -2;
				}
			},

			getFinalDueDateVisibility: function (bShowFinalDueDate, iOrderOperationRowLevel, dLatestAcceptableCompletionDate) {
				if (bShowFinalDueDate && iOrderOperationRowLevel === 0 && dLatestAcceptableCompletionDate) {
					return true;
				}
				return false;
			}
		};

		return oFormatters;
	}
);
