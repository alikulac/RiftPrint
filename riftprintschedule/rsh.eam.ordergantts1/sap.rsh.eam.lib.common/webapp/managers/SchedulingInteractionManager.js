/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/managers/AbstractInteractionManager",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/model/Sorter",
		"sap/ui/model/odata/type/DateTimeOffset"
	],
	function (AbstractInteractionManager, DateUtils, Filter, FilterOperator, Sorter, DateTimeOffset) {
		"use strict";

		return AbstractInteractionManager.extend("sap.rsh.eam.lib.common.managers.SchedulingInteractionManager", {
			/**
			 * Constructor for the LIM, this sets the model that the LIM will use
			 * @param {Object} oIncomingModel Selected operations for this session
			 * @public
			 * */
			constructor: function (oIncomingModel) {
				AbstractInteractionManager.prototype.constructor.apply(this, [oIncomingModel]);

				this.base = this; // To clarify where the AIM is used we simply prefix the calls with 'base'

				this.oLevelingOperations = {
					FIND_START_DAY_FOR_SESSION: "/C_RSHMaintSchedSmltdOpFind_start_day",
					SAVE_AND_DISPATCH: "/ABC3F14AA125636065E1BC5Save_and_dispatch",
					FREEZE: "/C_RSHMaintSchedSimulationFreeze"
				};

				this.SCHEDULING_STATUS = {
					DAILY: "D",
					WEEKLY: "W",
					FROZEN: "F"
				};

				this.OPERATION_PROCESSING_STATUS = {
					DUE: 20,
					SCHEDULED: 25
				};
			},

			/**
			 * Initializes a levelling session for the passes in operation ID set
			 * @param {Object} oScheduleInfo information about schedule (like dates and description)
			 * @param {Array} aIncomingOperationIds Selected operations for this session
			 * @param {Function} fSuccessCallBack Success callback
			 * @param {Function} fFailureCallBack Failure callback
			 * @public
			 * */
			initializeLevellingSession: function (oScheduleInfo, aIncomingOperationIds, fSuccessCallBack, fFailureCallBack) {
				var oHeaderInformation = {},
					oDateTimeOffsetType = new DateTimeOffset();

				if (!oScheduleInfo) {
					fFailureCallBack();
					return;
				}
				//Selection from DateRangeControl will set 999 for milliseconds which will cause wrong behavior and round to 00:00:00 but it needs to be 23:59:59
				oScheduleInfo.endDate.setMilliseconds(0);
				
				oHeaderInformation.MaintSchedSimlnDescription = oScheduleInfo.description;
				oHeaderInformation.MaintSchedSimStartDateTime = oDateTimeOffsetType.getModelValue(oScheduleInfo.startDate);
				oHeaderInformation.MaintSchedSimEndDateTime = oDateTimeOffsetType.getModelValue(oScheduleInfo.endDate);
				oHeaderInformation.MaintSchedSimulationTimeZone = oScheduleInfo.sIANATimezone;

				oHeaderInformation.SimulationSessionState = this.SCHEDULING_STATUS.WEEKLY;

				// Add the deep create
				if (aIncomingOperationIds && aIncomingOperationIds.length > 0) {
					var sExpandName = "to_MaintSchedSmltdOp";
					oHeaderInformation[sExpandName] = aIncomingOperationIds;
				}

				// No need to explicity batch this; just trigger a create on the root entity -

				this.base.create("/C_RSHMaintSchedSimulation", oHeaderInformation, {
					success: fSuccessCallBack,
					error: fFailureCallBack
				});
			},

			addOrdersToExistingLevelingSession: function (sSimulationId, aOrders, fSuccessCallBack, fFailureCallBack) {
				var GROUP_ID = "ADD_OPERATIONS_TO_SESSION",
					CHANGE_SET_ID = "ADD_OPERATIONS_TO_SESSION";

				// Set this group to deferred
				this.base.setDeferredGroups([GROUP_ID]);

				// Batch all the insert calls -
				for (var i = 0; i < aOrders.length; i++) {
					var oPayload = {
						MaintSchedSimlnUUID: sSimulationId,
						MaintOrderConfirmation: aOrders[i].MaintOrderConfirmation,
						MaintOrderRoutingNumber: aOrders[i].MaintOrderRoutingNumber,
						MaintOrderOperationCounter: aOrders[i].MaintOrderOperationCounter
					};

					// Note here that the create is referencing the simulation that it should belong to - this helps the backend autogenereated BOPF code handling the insert
					this.base.create("/C_RSHMaintSchedSimulation(guid'" + sSimulationId + "')/to_MaintSchedSmltdOp", oPayload, {
						changeSetId: CHANGE_SET_ID,
						groupId: GROUP_ID
					});
				}

				// Fire in the hole!
				this.base.submitPendingChanges(GROUP_ID, fSuccessCallBack, fFailureCallBack);
			},

			findStartDayForSchedulingSession: function (
				sMaintSchedSimlnUUID,
				fSuccessCallBack,
				fFailureCallBack,
				bRefreshAfterChange,
				eTag,
				bIsCacheSwitchActive
			) {
				this.base._callFunction(
					[
						{
							SimulationUuid: sMaintSchedSimlnUUID,
							MaintSchedCacheIsActive: bIsCacheSwitchActive
						}
					],
					this.oLevelingOperations.FIND_START_DAY_FOR_SESSION,
					fSuccessCallBack,
					fFailureCallBack,
					bRefreshAfterChange,
					eTag
				);
			},

			findStartDayForOperations: function (
				aChosenOperationODataKeys,
				fSuccessCallBack,
				fFailureCallBack,
				sSimulationSessionState,
				bIsCacheSwitchActive
			) {
				if (!(aChosenOperationODataKeys && aChosenOperationODataKeys.length > 0)) {
					fFailureCallBack();
					return;
				}

				// Set this group to deferred
				var GROUP_ID = "FIND_START_DAY",
					CHANGE_SET_ID = "FIND_START_DAY";

				// In the first version of scheduling all the user can change is the Simulated Start Date
				var oPayload = {
					MaintOrdOpHasToScheduleAutom: true, // From the daily view we trigger find start day
					MaintOrdOpHasToRespectSetStart: false, // And we don't want to remember the manually set start day
					SimulationSessionState: sSimulationSessionState,
					MaintSchedCacheIsActive: bIsCacheSwitchActive
				};

				this.base.setDeferredGroups([GROUP_ID]);
				for (var i = 0; i < aChosenOperationODataKeys.length; i++) {
					this.base.update("/" + aChosenOperationODataKeys[i], oPayload, {
						groupId: GROUP_ID,
						changeSetId: CHANGE_SET_ID,
						refreshAfterChange: false
					});
				}

				this.base.submitPendingChanges(GROUP_ID, fSuccessCallBack, fFailureCallBack);
			},

			changeSelectedOperations: function (aChosenOperationODataKeys, oPayload, fSuccessCallBack, fFailureCallBack) {
				if (!(aChosenOperationODataKeys && aChosenOperationODataKeys.length > 0)) {
					fFailureCallBack();
					return;
				}

				// Set this group to deferred
				var GROUP_ID = "CHANGE_OPERATIONS",
					CHANGE_SET_ID = "CHANGE_OPERATIONS";

				this.base.setDeferredGroups([GROUP_ID]);
				for (var i = 0; i < aChosenOperationODataKeys.length; i++) {
					this.base.update("/" + aChosenOperationODataKeys[i], oPayload, {
						groupId: GROUP_ID,
						changeSetId: CHANGE_SET_ID,
						refreshAfterChange: false
					});
				}

				this.base.submitPendingChanges(GROUP_ID, fSuccessCallBack, fFailureCallBack);
			},

			getCountOfScheduledOperationsForSchedule: function (sMaintSchedSimlnUUID, fSuccessCallBack, fFailureCallBack) {
				var oFilter = new Filter("MaintSchedSimlnUUID", FilterOperator.EQ, sMaintSchedSimlnUUID);
				var oProcessStatusFilter = new Filter("ProcessingStatus", FilterOperator.EQ, this.OPERATION_PROCESSING_STATUS.SCHEDULED);

				this.base.read("/C_RSHMaintSchedSmltdOp/$count", {
					filters: [oFilter, oProcessStatusFilter],
					success: fSuccessCallBack,
					error: fFailureCallBack
				});
			},

			saveAndDispatchOperations: function (sMaintSchedSimlnUUID, fSuccessCallBack, fFailureCallBack, eTag, ExecuteFreeze, sSimulationSessionState, bDeferRequest, sGroupID) {
				this.base._callFunction(
					[
						{
							MaintSchedSimlnUUID: sMaintSchedSimlnUUID,
							ExecuteFreeze: ExecuteFreeze,
							SimulationSessionState: sSimulationSessionState
						}
					],
					this.oLevelingOperations.SAVE_AND_DISPATCH,
					fSuccessCallBack,
					fFailureCallBack,
					null,
					eTag,
					bDeferRequest,
					sGroupID
				);
			},

			freezeSchedule: function (sMaintSchedSimlnUUID, sSimulationSessionState, fSuccessCallBack, fFailureCallBack, bDeferRequest, sGroupID) {
				this.base._callFunction(
					[
						{
							MaintSchedSimlnUUID: sMaintSchedSimlnUUID,
							SimulationSessionState: sSimulationSessionState
						}
					],
					this.oLevelingOperations.FREEZE,
					fSuccessCallBack,
					fFailureCallBack,
					null,
					null,
					bDeferRequest,
					sGroupID
				);
			},

			fetchSchedulingSessions: function (oDates, fSuccessCallBack, fFailureCallBack) {
				var aFilters = [];
				var oFilter = new Filter("MaintSchedSimStartDateTime", FilterOperator.GE, oDates.startDate);
				aFilters.push(oFilter);
				oFilter = new Filter("MaintSchedSimEndDateTime", FilterOperator.LE, oDates.endDate);
				aFilters.push(oFilter);

				this.base.read("/C_RSHMaintSchedSimulation", {
					filters: aFilters,
					success: fSuccessCallBack,
					error: fFailureCallBack,
					urlParameters: {
						$top: "1"
					}
				});
			},

			fetchSchedulingSessionsExceptCurrent: function (oDates, sMaintSchedSimlnUUID, fSuccessCallBack, fFailureCallBack) {
				var aFilters = [];
				var oFilter = new Filter("MaintSchedSimStartDateTime", FilterOperator.GE, oDates.startDate);
				aFilters.push(oFilter);
				oFilter = new Filter("MaintSchedSimEndDateTime", FilterOperator.LE, oDates.endDate);
				aFilters.push(oFilter);
				oFilter = new Filter("MaintSchedSimlnUUID", FilterOperator.NE, sMaintSchedSimlnUUID);
				aFilters.push(oFilter);

				this.base.read("/C_RSHMaintSchedSimulation", {
					filters: aFilters,
					success: fSuccessCallBack,
					error: fFailureCallBack
				});
			},

			/**
			 * Fetch exact one schedule based on its UUID
			 * Select and Expand parameters are needed no have the correct information to build up a schedulign object for Schedule APP
			 * Should be in Sync with the select parameters of table in operationslevelings UserSchedule View
			 * @param {string} sMaintSchedSimlnUUID - UUID of schedule to be fetched
			 * @param {function} fSuccessCallBack - Success Callback Function
			 * @param {function} fFailureCallBack - Error Callback Function
			 */
			fetchExistingSchedulingSession: function (sMaintSchedSimlnUUID, fSuccessCallBack, fFailureCallBack) {
				var oFilter = new Filter("MaintSchedSimlnUUID", FilterOperator.EQ, sMaintSchedSimlnUUID);

				var aSelectParameters = [
					"MaintSchedSimlnDescription",
					"MaintSchedSimlnLongText",
					"MaintSchedSimlnUUID",
					"MaintOrdSchedExecutionStatus",
					"MaintSchedSimStartDateTime",
					"MaintSchedSimEndDateTime",
					"MaintSchedSimulationTimeZone",
					"SimulationSessionState",
					"ScheduleFreezingIsActive",
					"LastChangeDateTime",
					"CreatedByUserName",
					"MaintSchedCollaboratorType",
					"MaintOrdSchedExecutionStatTxt",
					"MaintSchedCacheIsActive",
					"PreviousMaintSchedSimlnUUID",
					"NextMaintSchedSimlnUUID",
					"to_AttainmentPercent",
					"to_UtilizationKPI",
					"to_MaintSchedCollaborators",
					"to_MaintSchedReviewers"
				];

				var aExpandParameters = ["to_AttainmentPercent", "to_UtilizationKPI", "to_MaintSchedCollaborators", "to_MaintSchedReviewers"];

				this.base.read("/C_RSHMaintSchedSimulation", {
					filters: [oFilter],
					success: fSuccessCallBack,
					error: fFailureCallBack,
					urlParameters: {
						$select: aSelectParameters.join(","),
						$expand: aExpandParameters.join(","),
						$top: "1"
					}
				});
			},

			removeOperationsFromSchedulingSession: function (aChosenOperationODataKeys, fSuccessCallBack, fFailureCallBack, bIsCacheSwitchActive) {
				if (!(aChosenOperationODataKeys && aChosenOperationODataKeys.length > 0)) {
					fFailureCallBack();
					return;
				}

				// Set this group to deferred
				var GROUP_ID = "REMOVE_OPERATIONS_FROM_SESSION",
					CHANGE_SET_ID = "REMOVE_OPERATIONS_FROM_SESSION";

				this.base.setDeferredGroups([GROUP_ID]);

				for (var i = 0; i < aChosenOperationODataKeys.length; i++) {
					this.base.remove("/" + aChosenOperationODataKeys[i], {
						groupId: GROUP_ID,
						changeSetId: CHANGE_SET_ID,
						urlParameters: {
							MaintSchedCacheIsActive: bIsCacheSwitchActive
						}
					});
				}

				this.base.submitPendingChanges(GROUP_ID, fSuccessCallBack, fFailureCallBack);
			},

			setSchedulingStatus: function (sMaintSchedSimlnUUID, sSchedulingStatus, eTag, fSuccessCallBack, fFailureCallBack) {
				var oPayload = {
					SimulationSessionState: sSchedulingStatus
				};

				this.base.update("/C_RSHMaintSchedSimulation(guid'" + sMaintSchedSimlnUUID + "')", oPayload, {
					success: fSuccessCallBack,
					error: fFailureCallBack,
					eTag: eTag,
					groupId: "StatusUpdate"
				});
			},

			getCacheStatus: function (sMaintSchedSimlnUUID, fSuccessCallBack, fFailureCallBack) {
				this.base.read("/C_RSHMaintSchedSimulation(guid'" + sMaintSchedSimlnUUID + "')", {
					success: fSuccessCallBack,
					async: false,
					error: fFailureCallBack,
					groupId: "CacheStatusCheck",
					urlParameters: {
						$select: "MaintSchedCacheIsActive"
					}
				});
			},

			setOptimizeDataAccess: function (sMaintSchedSimlnUUID, bActivateCache, eTag, fSuccessCallBack, fFailureCallBack, sSimulationSessionState) {
				var oPayload = {
					MaintSchedCacheIsActive: bActivateCache,
					SimulationSessionState: sSimulationSessionState
				};

				this.base.update("/C_RSHMaintSchedSimulation(guid'" + sMaintSchedSimlnUUID + "')", oPayload, {
					success: fSuccessCallBack,
					error: fFailureCallBack,
					eTag: eTag
				});
			},

			setSchedulingDescription: function (sMaintSchedSimlnUUID, sNewSchedDescription, eTag, sNewSchedLongText, fSuccessCallBack, fFailureCallBack) {
				var oPayload = {
					MaintSchedSimlnDescription: sNewSchedDescription,
					MaintSchedSimlnLongText: sNewSchedLongText
				};

				this.base.update("/C_RSHMaintSchedSimulation(guid'" + sMaintSchedSimlnUUID + "')", oPayload, {
					success: fSuccessCallBack,
					error: fFailureCallBack,
					eTag: eTag
				});
			},
			/**
			 * Posting a new comment/reply to Activity Log
			 * @param {string} sMaintSchedSimlnUUID - UUID of Schedule for which comment was added
			 * @param {string} sNewComment - Comment or Reply text
			 * @param {string} sReplyToActivityLogUUID - UUID of parent comment, only filled for replies otherwise null
			 * @param {function} fSuccessCallBack function for success handling of request
			 * @param {function} fFailureCallBack funtion for handling error cases
			 */
			postNewComment: function (sMaintSchedSimlnUUID, sNewComment, sReplyToActivityLogUUID, fSuccessCallBack, fFailureCallBack) {
				var oPayload = {
					MaintSchedActivityLogText: sNewComment,
					MaintSchedActivityLogType: "C", //It's a comment, silly,
					ReplyToActivityLogUUID: sReplyToActivityLogUUID
				};

				this.base.create("/C_RSHMaintSchedSimulation(guid'" + sMaintSchedSimlnUUID + "')/to_MaintSchedActivityLog", oPayload, {
					success: fSuccessCallBack,
					error: fFailureCallBack
				});
			},

			/**
			 * Deleting a comment from activity log
			 * @param {string} sPath Binding path to activity log item
			 * @param {function} fSuccessCallback function for success handling of request
			 * @param {function} fFailureCallback funtion for handling error cases
			 */
			deleteComment: function (sPath, fSuccessCallback, fFailureCallback) {
				this.base.remove(sPath, {
					success: fSuccessCallback,
					error: fFailureCallback
				});
			},

			getScheduleAndDemandInformation: function (
				aOperationKeys,
				oScheduleStartDate,
				bAlsoFrozen,
				fSuccessCallback,
				fFailureCallback,
				aFilters,
				bAdjustFilterForOrderList
			) {
				// Set this group to deferred
				var GROUP_ID = "SCHED_DEM_INFO",
					CHANGE_SET_ID = "SCHED_DEM_INFO";

				this.base.setDeferredGroups([GROUP_ID]);

				this._batchRequestForSchedules(oScheduleStartDate, bAlsoFrozen, GROUP_ID, CHANGE_SET_ID, aFilters);

				if (aOperationKeys && aOperationKeys.length > 0) {
					this._batchRequestForOpInfo(aOperationKeys, GROUP_ID, CHANGE_SET_ID, bAdjustFilterForOrderList);
				}

				this.base.submitPendingChanges(GROUP_ID, fSuccessCallback, fFailureCallback);
			},

			getAssignedWorkCenters: function (fSuccessCallback, fFailureCallback) {
				var aSorters = new Sorter("WorkCenter");

				this.base.read("/C_RSHEditWorkCenterVH", {
					sorters: [aSorters],
					success: fSuccessCallback,
					error: fFailureCallback
				});
			},

			deleteSchedule: function (sMaintSchedSimlnUUID, fSuccessCallBack, fFailureCallBack, eTag) {
				this.base.remove("/C_RSHMaintSchedSimulation(guid'" + sMaintSchedSimlnUUID + "')", {
					success: fSuccessCallBack,
					error: fFailureCallBack,
					eTag: eTag
				});
			},

			_batchRequestForOpInfo: function (aOperationKeys, sGroupID, sChangeSetID, bAdjustFilterForOrderList) {
				if (bAdjustFilterForOrderList) {
					var aFilters = aOperationKeys.map(function (oOperation) {
						var oFilterForMaintenanceOrder = new Filter("MaintenanceOrder", FilterOperator.EQ, oOperation.MaintenanceOrder);
						return new Filter({
							filters: [oFilterForMaintenanceOrder],
							and: true
						});
					});
				} else {
					aFilters = aOperationKeys.map(function (oOperation) {
						var oFilterForMaintenanceOrder = new Filter("MaintenanceOrder", FilterOperator.EQ, oOperation.MaintenanceOrder);
						var oFilterForMaintenanceOrderOperation = new Filter(
							"MaintenanceOrderOperation",
							FilterOperator.EQ,
							oOperation.MaintenanceOrderOperation
						);
						var oFilterForMaintenanceOrderSubOperation = new Filter(
							"MaintenanceOrderSubOperation",
							FilterOperator.EQ,
							oOperation.MaintenanceOrderSubOperation
						);

						return new Filter({
							filters: [oFilterForMaintenanceOrder, oFilterForMaintenanceOrderOperation, oFilterForMaintenanceOrderSubOperation],
							and: true
						});
					});
				}

				var oOperationFilter = new Filter({
					filters: aFilters,
					and: false
				});

				// Select everything that is needed for us to correctly validate the requests -
				var aSelectParameters = [
					"MaintenanceOrder",
					"MaintenanceOrderOperation",
					"MaintenanceOrderSubOperation",
					"ProcessingStatus",
					"OperationHasSubOperations",
					"OperationPersonResponsible",
					"MaintOrderRoutingNumber",
					"MaintOrderConfirmation",
					"MaintOrderOperationCounter"
				];

				this.base.read("/C_RSHOperations", {
					filters: [oOperationFilter],
					groupId: sGroupID,
					changeSetId: sChangeSetID,
					urlParameters: {
						$select: aSelectParameters.join(",")
					}
				});
			},

			_batchRequestForSchedules: function (oScheduleStartDate, bAlsoFrozenSchedules, sGroupID, sChangeSetID, aIncomingFilters) {
				var aFilters = [];
				var oFrozenSchedulesFilter = null;
				var bAnd = true;
				var oURLParameters = {};

				var oFilter = new Filter("MaintSchedSimStartDateTime", FilterOperator.GE, oScheduleStartDate);

				if (bAlsoFrozenSchedules) {
					oFrozenSchedulesFilter = new Filter("SimulationSessionState", FilterOperator.EQ, this.SCHEDULING_STATUS.FROZEN);
					bAnd = false;
					oURLParameters = {
						$expand: "to_AttainmentPercent,to_UtilizationKPI"
					};
				} else {
					oFrozenSchedulesFilter = new Filter("SimulationSessionState", FilterOperator.NE, this.SCHEDULING_STATUS.FROZEN);
				}

				oFilter = new Filter({
					filters: [oFilter, oFrozenSchedulesFilter],
					and: bAnd
				});

				aFilters.push(oFilter);
				if (aIncomingFilters) {
					aFilters.push(aIncomingFilters);
				}

				var aSorters = [new Sorter("MaintSchedSimEndDateTime", true), new Sorter("MaintOrdSchedExecutionStatus", false)];

				this.base.read("/C_RSHMaintSchedSimulation", {
					filters: aFilters,
					sorters: aSorters,
					urlParameters: oURLParameters,
					groupId: sGroupID,
					changeSetId: sChangeSetID
				});
			},

			postWorkCenterCapacityChange: function (fSuccessCallBack, fFailureCallBack) {
				var GROUP_ID = "iDBatchWorkCenterRequest";
				//CHANGE_SET_ID = "iDBatchWorkCenterRequest";

				// Fire in the hole!
				this.base.submitPendingChanges(GROUP_ID, fSuccessCallBack, fFailureCallBack);
			}
		});
	}
);
