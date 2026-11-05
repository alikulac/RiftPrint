/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(function () {
	"use strict";

	var bAppHasCompactDensityClass = jQuery(document.body).hasClass("sapUiSizeCompact");
	return {
		LayoutTab: true,
		WorkCenterTab: true,
		OrderOperationTab: true,
		LabelTab: true,
		MaintenanceOrderSubTab: true,
		MaintenanceOperationSubTab: true,
		DragAndDropTab: false,
		Layoutsettings: {
			enableNowLine: true,
			enableVerticalLine: true,
			enableCursorLine: true,
			enableDeltaLine: false,
			enableStatusBar: true,
			condensedModeActive: bAppHasCompactDensityClass
		},
		WorkCenterSettings: {
			showNonWorkingTimes: true,
			showUtilizationIndicator: true,
			showColorsUtilizationBars: true
		},
		OrdersAndOperationsSettings: {
			showFinalDueDate: true,
			showImpRel: true,
			showExpRel: true,
			showMustStartRestriction: true,
			showActualDates: true
		},
		LabelSettings: {
			orderBarLeftText: true,
			orderBarInsideText: true,
			orderBarRightText: true,
			operationBarLeftText: true,
			operationBarInsideText: true,
			operationsBarRightText: true,
			orderBarLeftFields: [
				{
					key: "NoLabel-Left"
				},
				{
					key: "MaintenanceOrderDesc-Left"
				},
				{
					key: "MaintenanceOrderIdDesc-Left"
				},
				{
					key: "WorkCenter-Left"
				},
				{
					key: "MaintenanceRevision-Left"
				},
				{
					key: "OrderType-Left"
				},
				{
					key: "MaintPriorityDesc-Left"
				},
				{
					key: "OrderStartDateTime-Left"
				},
				{
					key: "OrderStartTime-Left"
				},
				{
					key: "MainWorkCenterPlant-Left"
				}
			],
			orderBarInsideFields: [
				{
					key: "NoLabel-Inside"
				},
				{
					key: "MaintenanceOrderDesc-Inside"
				},
				{
					key: "MaintenanceOrderIdDesc-Inside"
				},
				{
					key: "WorkCenter-Inside"
				},
				{
					key: "MaintenanceRevision-Inside"
				},
				{
					key: "OrderType-Inside"
				},
				{
					key: "MaintPriorityDesc-Inside"
				},
				{
					key: "MainWorkCenterPlant-Inside"
				}
			],
			orderBarRightFields: [
				{
					key: "NoLabel-Right"
				},
				{
					key: "MaintenanceOrderDesc-Right"
				},
				{
					key: "MaintenanceOrderIdDesc-Right"
				},
				{
					key: "WorkCenter-Right"
				},
				{
					key: "MaintenanceRevision-Right"
				},
				{
					key: "OrderType-Right"
				},
				{
					key: "MaintPriorityDesc-Right"
				},
				{
					key: "OrderEndDateTime-Right"
				},
				{
					key: "OrderEndTime-Right"
				},
				{
					key: "MainWorkCenterPlant-Right"
				}
			],
			operationBarLeftFields: [
				{
					key: "NoLabel-Left"
				},
				{
					key: "OperationDescription-Left"
				},
				{
					key: "MaintenanceOrderOperationIdDesc-Left"
				},
				{
					key: "PerformingWorkCenter-Left"
				},
				{
					key: "MaintOpExecutionStageName-Left"
				},
				{
					key: "NumberOfCapacities-Left"
				},
				{
					key: "OperationPersonRespName-Left"
				},
				{
					key: "OrderOperationStartDateTime-Left"
				},
				{
					key: "OrderOperationStartTime-Left"
				},
				{
					key: "MainWorkCenterPlant-Left"
				},
				{
					key: "NumberOfAssignedPersons-Left"
				},
				{
					key: "ConcatenatedAssignedPersonsTxt-Left"
				}
			],
			operationBarInsideFields: [
				{
					key: "NoLabel-Inside"
				},
				{
					key: "OperationDescription-Inside"
				},
				{
					key: "MaintenanceOrderOperationIdDesc-Inside"
				},
				{
					key: "PerformingWorkCenter-Inside"
				},
				{
					key: "MaintOpExecutionStageName-Inside"
				},
				{
					key: "NumberOfCapacities-Inside"
				},
				{
					key: "OperationPersonRespName-Inside"
				},
				{
					key: "MainWorkCenterPlant-Inside"
				},
				{
					key: "NumberOfAssignedPersons-Inside"
				},
				{
					key: "ConcatenatedAssignedPersonsTxt-Inside"
				}
			],
			operationBarRightFields: [
				{
					key: "NoLabel-Right"
				},
				{
					key: "OperationDescription-Right"
				},
				{
					key: "MaintenanceOrderOperationIdDesc-Right"
				},
				{
					key: "PerformingWorkCenter-Right"
				},
				{
					key: "MaintOpExecutionStageName-Right"
				},
				{
					key: "NumberOfCapacities-Right"
				},
				{
					key: "OperationPersonRespName-Right"
				},
				{
					key: "OrderOperationEndDateTime-Right"
				},
				{
					key: "OrderOperationEndTime-Right"
				},
				{
					key: "MainWorkCenterPlant-Right"
				},
				{
					key: "NumberOfAssignedPersons-Right"
				},
				{
					key: "ConcatenatedAssignedPersonsTxt-Right"
				}
			]
		},
		DragAndDropSettings: {
			accuracy: false,
			setStatus: false
		}
	};
});
