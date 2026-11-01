/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * Constants Class
 * Used to define literals as constants which can be used across the app
 * @name rsh.eam.details1.utils.Constants
 */

sap.ui.define("sap/rsh/eam/lib/common/utils/Constants", [], function () {
	"use strict";

	var Constants = {
		sChannel: "rsh.eam.detail",
		sLibraryChannel: "rsh.eam.lib.common",
		sBackendCallPerformed: "backendCallPerformed",
		sAfterMassChangesPerformedInStatusCommon: "afterMassChangesPerformedInStatusCommon",
		sAfterMassChangesPerformedInChangeOperations: "afterMassChangesPerformedInChangeOperations",
		sAfterOperationMassChangeFinalized: "afterOperationMassChangeFinalizied",
		sAfterStatusChangesFinalizedDetailsApp: "afterStatusChangesFinaliziedDetailsApp",
		sAfterStatusChangesFinalizedGanttApp: "afterStatusChangesFinaliziedGanttApp",
		sAfterDragAndDropFinalizedGanttApp: "afterDragAndDropFinalizedGanttApp",
		sAfterMassChangeDialogClosed: "afterMassChangeDialogClosed",
		sScheduleDialogIsOpened: "afterAddToScheduleDialogOpened",
		sAllMassChangesPerformed: "allMassChangesPerformed",
		sServerMessageToUpdateEntity: "serverMessageToUpdateEntity",
		sServerMessageToUpdateFullEntity: "serverMessageToUpdateFullEntity",
		sChartFilter: "setChartFilter",
		sWorkcenterFilter: "setWorkcenterFilter",
		sClearFilter: "clearSmartFilter",
		sUpdateWorkCenter: "updateWorkCenter",
		Hour0to23: "HH:mm:ss",
		Hour0to11: "hh:mm:ss a",
		Hour1to12: "KK:mm:ss a",
		TimePeriodFuture: "FUTURE",
		sUpdateProcessingStatusChart: "updateProcessingStatus",
		sUpdateChartsAfterChange: "updateChartsAfterChange",
		sChartRemoveFilter: "RemoveFilters",
		sTargetUtilization: "TargetUtilization",
		functionCallPrepared: "Prepared",
		functionCallRequested: "Requested",
		functionCallSucessfull: "Successfull",
		functionCallSuccessfulWithWarning: "SuccessfulWithWarning",
		functionCallFailed: "Failed",
		schedulingOperationAction: "RescheduleOperation",
		workcenterAction: "ReassignWorkcenter",
		setDispatchStatusAction: "SetDispatchStatus",
		cancelDispatchStatusAction: "CancelDispatchStatus",
		reassignWorkCenterAction: "ReassignOperationToDifWorkCenter",
		removeConstraintsAction: "RemoveStartAndEndConstraintsOfOperation",
		createRelationshipAction: "CreateRelationship",
		deleteRelationshipAction: "DeleteRelationship",
		unassignPeopleAction: "UnassignPeople",
		scheduleOrderAction: "ScheduleOrder",
		moveOrder: "moveOrder",
		dispatchedStatusCode: 30,
		dueStatusCode: 20,
		inProcessCode: 40,
		orderMassChange: "OrderMassChange",
		operationMassChange: "OperationMassChange",
		sOrderByWorkCenterWeek: "YearWeek,Plant,WorkCenter",
		sSelectWorkCenterWeek:
			"YearWeek,CalendarWeek,WorkCenter,WorkCenterUtilization,WorkCenterRequiredCapacity,WorkCenterAvailableCapacity,WorkCenterCapacityUnit,Plant",

		sOrderByWorkCenterMonth: "YearMonth,Plant,WorkCenter",

		sSelectWorkCenterMonth:
			"YearMonth,CalendarMonth,WorkCenter,WorkCenterUtilization,WorkCenterRequiredCapacity,WorkCenterAvailableCapacity,WorkCenterCapacityUnit,Plant",

		sOrderByPriorityWeek: "YearWeek,MaintPriority",

		sSelectPriorityWeek:
			"YearWeek,CalendarWeek,MaintPriority,MaintPriorityColorCode,WorkCenterUtilization,MaintPriorityDesc," +
			"WorkCenterRequiredCapacity,WorkCenterAvailableCapacity,WorkCenterCapacityUnit",

		sOrderByPriorityMonth: "YearMonth,MaintPriority",
		sSelectPriorityMonth:
			"YearMonth,CalendarMonth,MaintPriority,MaintPriorityColorCode,WorkCenterUtilization,MaintPriorityDesc," +
			"WorkCenterRequiredCapacity,WorkCenterAvailableCapacity,WorkCenterCapacityUnit",

		sOrderByOrderTypeWeek: "YearWeek,OrderType",
		sSelectOrderTypeWeek:
			"YearWeek,OrderType,WorkCenterUtilization,CalendarWeek,WorkCenterRequiredCapacity,WorkCenterAvailableCapacity,WorkCenterCapacityUnit",

		sOrderByOrderTypeMonth: "YearMonth,OrderType",
		sSelectOrderTypeMonth:
			"YearMonth,OrderType,WorkCenterUtilization,CalendarMonth,WorkCenterRequiredCapacity,WorkCenterAvailableCapacity,WorkCenterCapacityUnit",

		sOrderByActivityTypeWeek: "YearWeek,MaintenanceActivityType",
		sSelectActivityTypeWeek:
			"YearWeek,MaintenanceActivityType,WorkCenterUtilization,CalendarWeek,MaintenanceActivityTypeName," +
			"WorkCenterRequiredCapacity,WorkCenterAvailableCapacity,WorkCenterCapacityUnit",

		sOrderByActivityTypeMonth: "YearMonth,MaintenanceActivityType",
		sSelectActivityTypeMonth:
			"YearMonth,MaintenanceActivityType,WorkCenterUtilization,CalendarMonth,MaintenanceActivityTypeName," +
			"WorkCenterRequiredCapacity,WorkCenterAvailableCapacity,WorkCenterCapacityUnit",

		sOrderByProcessingStatusWeek: "YearWeek,ProcessingStatus",
		sSelectProcessingStatusWeek:
			"YearWeek,ProcessingStatus,WorkCenterUtilization,CalendarWeek,ProcessingStatusText," +
			"WorkCenterRequiredCapacity,WorkCenterAvailableCapacity,WorkCenterCapacityUnit",

		sOrderByProcessingStatusMonth: "YearMonth,ProcessingStatus",
		sSelectProcessingStatusMonth:
			"YearMonth,ProcessingStatus,WorkCenterUtilization,CalendarMonth,ProcessingStatusText," +
			"WorkCenterRequiredCapacity,WorkCenterAvailableCapacity,WorkCenterCapacityUnit",

		sOrderByControlKeyWeek: "YearWeek,OperationControlKey",
		sSelectControlKeyWeek:
			"YearWeek,OperationControlKey,WorkCenterUtilization,CalendarWeek,WorkCenterRequiredCapacity,WorkCenterAvailableCapacity,WorkCenterCapacityUnit",

		sOrderByControlKeyMonth: "YearMonth,OperationControlKey",
		sSelectControlKeyMonth:
			"YearMonth,OperationControlKey,WorkCenterUtilization,CalendarMonth,WorkCenterRequiredCapacity,WorkCenterAvailableCapacity,WorkCenterCapacityUnit",
		referenceLineValue: 75,
		linesOfWrapValue: 5,
		sDetailsOperationViewName: "rsh.eam.details1.view.Operations",
		sTestAppReuseLib: "rsh.eam.lib.common.view.testPage",
		sChartSettings: "setChartSettings",
		idUnassignedPersonResponsible: "00000000",
		sKeepAliveRestore: "OnKeepAliveRestore",
		// Personalization Key parameters
		sShowFilterSetDialogLeveling: "ShowFilterSetDialogLeveling",
		sShowFilterSetDialogForDetails: "ShowFilterSetDialogForDetails",
		sShowImplicitFilterSetDialogForChart: "ShowImplicitFilterSetDialogForChart",
		sShowFindStartDayDialogForWeeklyLeveling: "ShowFindStartDayDialogForWeeklyLeveling",
		sShowFindStartDayDialogForDailyLeveling: "ShowFindStartDayDialogForDailyLeveling",
		sShowDueDraftsNotSaved: "sShowDueDraftsNotSaved",
		sChartP13nSettings: "DetailsUtilizationChartP13nSettings",
		sGraphScale: "GraphScale",
		sGraphValue: "GraphValue",
		sChartType: "ChartType",
		sChartFilteredWorkCenters: "ChartFilteredWorkCenters",
		sToggleFullScreen: "ToggleUtilChartFullScreen",
		sInfoOnNavFromMBO: "ShowInfoOnNavFromMBO",
		sInfoOnNavFromAssetView: "ShowInfoOnNavFromAssetView",
		sInfoToSwitchFromPersonalizationToVariant: "ShowInfoToSwitchFromPersToVariant",
		sInfoToSwitchFromPersonalizationToVariantInAsset: "ShowInfoToSwitchFromPersToVariantInAsset",

		//MessageHandling related constants
		sDisplayTypeMessagePopover: 1,
		sDisplayTypeMessageBox: 2,
		sDisplayTypeMessageToast: 3,
		sDisplayTypeMessageFooter: 4,
		sDisplayTypeNone: 5,
		sDraftMessageCode: "RSH_EAM_ASSGN_DRAFT",
		sPopoverNameMain: "DEFAULT",
		sPopoverNameMassChangeOperations: "CHANGEOPERATIONS",
		sLevelingChanel: "rsh.eam.operationleveling",
		sLevelingAddNavigation: "levelingAddAndNavigation",

		sErrorSeveritySuccess: "success",
		sErrorSeverityError: "error",
		sErrorSeverityWarning: "warning",

		idEmptyUUID: "00000000-0000-0000-0000-000000000000",

		//Gantt related constants
		sGanttP13nSettings: "OrderGanttP13nSettings",
		sSchedulingGanttP13nSettings: "SchedulingGanttP13nSettings",
		sAssetGanttP13nSettings: "AssetGanttP13nSettings",
		//Feature model app state
		sSchedulingGanttAppState: "LevellingGanttAppState",
		sAssetGanttAppState: "AssetBoardGanttAppState",
		sGanttAppState: "SchedulingBoardGanttAppState",
		sAssignAppState: "AssignDialogAppState",
		//Delete relationship
		sRelationshipDeleteInGantt: "DeleteRelationshipInGantt",
		//Relationship context menu
		sRelationshipDeleteContextMenuClose: "DeleteRelationshipContextMenuClose",
		sEditRelationshipOffsetClose: "EditOffsetRelationshipClose",
		sDateTimePopupClose: "DateTimePopupClose",
		sDateTimePopupSubmit: "DateTimePopupSubmit",
		sRelationshipOffsetSubmit: "RelationshipOffsetUpdateSubmit",
		sRelationshipOffsetDelete: "RelationshipOffsetDelete",
		sFinalRelationshipOffsetClose: "FinalCloseRelPopOvers",
		sPropsFetchedFrmMetadata: "PropsFetchedFrmMetadata",

		//Test Gantt Chart Settings in TestApp of common library
		sTestGanttP13nSettings: "TestGanttP13nSettings",

		//Work Center Capacity Change constants
		sShiftChangeErrorCode: "RSH_EAM_WRK_CTR_CHNG/003",

		//Operations Levelings Weekly Utilization Forecast Chart
		sChartDeselectionState: "deselectData",
		sOrderByProcessingStatus: "Plant,WorkCenter,ProcessingStatus",
		sOrderByPriority: "Plant,WorkCenter,MaintPriority",
		sOrderByOrderType: "Plant,WorkCenter,OrderType",
		sOrderByActivityType: "Plant,WorkCenter,MaintenanceActivityType",
		sOrderByControlKey: "Plant,WorkCenter,OperationControlKey",
		sSelectProcessingStatus:
			"WorkCenter,ProcessingStatus,ProcessingStatusText,WorkCenterRequiredCapacity,WorkCenterUtilization,WorkCenterAvailableCapacity,Plant",
		sSelectPriority:
			"WorkCenter,MaintPriority,MaintPriorityDesc,WorkCenterRequiredCapacity,WorkCenterAvailableCapacity,WorkCenterUtilization,Plant,MaintPriorityColorCode",
		sSelectOrderType: "WorkCenter,OrderType,WorkCenterRequiredCapacity,WorkCenterAvailableCapacity,WorkCenterUtilization,Plant",
		sSelectActivityType:
			"WorkCenter,MaintenanceActivityType,MaintenanceActivityTypeName,WorkCenterRequiredCapacity,WorkCenterAvailableCapacity,WorkCenterUtilization,Plant",
		sSelectControlKey: "WorkCenter,OperationControlKey,WorkCenterRequiredCapacity,WorkCenterAvailableCapacity,WorkCenterUtilization,Plant",

		//Work Center Assignement related Constants
		sNoWorkCenterAssigned: "noWorkCentersAssigned",
		sRelationshipOffsetUpdateAction: "RelationshipOffsetUpdateAction",
		sAddOffsetBtn: "Add Offset",
		sEditOffsetBtn: "Edit Offset",
		sDeleteOffsetBtn: "Delete Offset",
		sDateTimeBtn: "Edit Date",

		//Order Context Menu related Constants
		sExpandOrderCntxtMnuActn: "OrderContextMenuActionItemToExpandTheOrderRow",
		sCollapseOrderCntxtMnuActn: "OrderContextMenuActionItemToCollapseTheOrderRow",
		sTriggerSchedulingForOrderCntxtMnuActn: "OrderContextMenuActionItemToTriggerShedulingForTheOrder",
		sOpenOrderCntxtMnuActn: "OrderContextMenuActionItemToOpenOrderInNewTab",
		sOrderContextMenuClose: "OrderContextMenuClosed",
		sOpenGanttBoardOrderCntxtMnuActn: "OpenContextMenuActionItemToOpenGanttBoard",
		sOpenAssignEventOrderCntxtMnuActn: "OpenContextMenuActionItemToAssignEvent",
		sUnAssignMaintEventAction: "UnassignMainteanceEvent",

		//Assign Person Dialog related constants
		sAssignWrkCenterPersonResp: "AssignPersonRespInAssignDialog",

		//P13n Settings Popup related constants
		sColumnSettingsChanged: "ColumnSettingsChanged",
		UnAssign: "UnAssign",
		Assign: "Assign"
	};

	return Constants;
});
