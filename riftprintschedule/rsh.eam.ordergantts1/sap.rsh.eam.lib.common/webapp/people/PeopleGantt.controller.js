/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * Controller for People Gantt - People gantt fragment(PeopleGantt.fragment.xml)
 * Hook methods of view life cycle can be imeplemented for fragment life cycle.
 * @name rsh.eam.lib.common.controller.PeopleGanttAdapter.controller
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/controller/GanttChart.controller",
		"sap/rsh/eam/lib/common/utils/GanttUtils",
		"sap/rsh/eam/lib/common/formatters/formatter",
		"sap/rsh/eam/lib/common/people/PeopleGanttFormatter",
		"sap/gantt/def/cal/Calendar",
		"sap/gantt/def/cal/TimeInterval",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/gantt/simple/DeltaLine",
		"sap/ui/dom/includeStylesheet",
		"sap/gantt/misc/Format",
		"sap/rsh/eam/lib/common/utils/ItemHashMap",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/ui/core/date/UI5Date",
		"sap/ui/core/format/DateFormat",
		"sap/rsh/eam/lib/common/people/AssignmentContextMenu.controller",
		"sap/rsh/eam/lib/common/utils/utils"
	],
	function (
		GanttChartController,
		GanttUtils,
		Formatter,
		PeopleGanttFormatter,
		Calendar,
		TimeInterval,
		Filter,
		FilterOperator,
		DeltaLine,
		includeStylesheet,
		GanttFormatter,
		ItemHashMap,
		Constants,
		UI5Date,
		DateFormat,
		AssignmentContextMenuController,
		Utils
	) {
		"use strict";

		return GanttChartController.extend("sap.rsh.eam.lib.common.people.PeopleGantt.controller", {
			commonFormatter: Formatter,
			formatter: PeopleGanttFormatter,
			ganttUtils: GanttUtils,

			onInitMembers: function (oParams) {
				GanttChartController.prototype.onInitMembers.apply(this, arguments);
				this._oOrderGanttTimePeriod = {};
				this._oDataResourceDetails = {
					results: []
				};
				this._oContextMenuController = new AssignmentContextMenuController(oParams.component, oParams.dependent);
				this._oDeletedSplits = {};
				this._oPeopleModel = this.oComponent.getModel("peopleGanttModel");
				this._oDataModel = this.oComponent.getModel(oParams.modelName);
				this._aOrderOperation = [];
				this._aOpShapePaths = undefined;
				this._aOperations = [];
				this._oExpandedRows = {};
				this._fnOnRowsChanged = oParams.rowsChangedEventHandler;
				this._fnOnClienSideChanges = oParams.clientSideChangesEventHandler;
			},

			onInit: function () {
				GanttChartController.prototype.onInit.apply(this, arguments);
				this._applyPersonalizationSettings();
				this._oPeopleModel.setDeferredGroups(this._oPeopleModel.getDeferredGroups().concat(["idBatchSplit", "idBatchSplitClient"]));

				// The resource Gantt has no hierarchy, hence set the flat mode on tree table!
				this.getTable().setUseFlatMode("true");
				// Fetch custom css file for adjusting avatar's margin
				includeStylesheet(sap.ui.require.toUrl("sap/rsh/eam/lib/common/css/style.css"));
			},

			_attachModelEventHandlers: function () {
				this._oPeopleModel.attachBatchRequestSent(this._onRequestSent, this);
				this._oPeopleModel.attachBatchRequestCompleted(this._onRequestComplete, this);
			},

			loadPeopleData: function (oTimePeriod, aOpShapePaths) {
				this._saveOperationData(aOpShapePaths);
				this._updateCache(oTimePeriod).then(
					function () {
						this.bind();
						this.bindCalendar();
					}.bind(this)
				);
			},

			_updateCache: function (oTimePeriod) {
				var oParams = this._getCacheUpdateParameters(oTimePeriod);
				if (oParams.update) {
					var oDateFilter = this._getCacheDateFilters(oParams);
					var oReadParams = {
						modelName: "peopleGanttModel",
						path: "/C_RSHPersonDetail",
						filters: [oDateFilter]
					};
					var oUpdateCacheCall = this.controllers.modelPromises.read(oReadParams).then(
						function (oData) {
							Object.assign(this._oDataResourceDetails, oData);
						}.bind(this)
					);
					return oUpdateCacheCall;
				} else {
					return Promise.resolve();
				}
			},

			_getCacheDateFilters: function (oParams) {
				var oDateFilter = new Filter({
					filters: [
						new Filter({
							path: "RequestedStartDate",
							operator: FilterOperator.EQ,
							value1: oParams.startDate
						}),
						new Filter({
							path: "RequestedEndDate",
							operator: FilterOperator.EQ,
							value1: oParams.endDate
						})
					],
					and: true
				});

				return oDateFilter;
			},

			_getCacheUpdateParameters: function (oOrderGanttTimePeriod) {
				var oTimePeriod = this._getTimePeriod();

				// Check if the time period filter was changed
				var bOrderGanttTimePeriodChanged =
					this._oOrderGanttTimePeriod.ganttStartTime !== oOrderGanttTimePeriod.ganttStartTime ||
					this._oOrderGanttTimePeriod.ganttEndTime !== oOrderGanttTimePeriod.ganttEndTime;

				// Check if the Operation start time is beyond time period filter start time
				var bUpdateCacheStartDate = oTimePeriod.startDate < this._oOrderGanttTimePeriod.startDate;

				// Check if the Operation end time is beyond time period filter end time
				var bUpdateCacheEndDate = oTimePeriod.endDate > this._oOrderGanttTimePeriod.endDate;

				this._oOrderGanttTimePeriod = oOrderGanttTimePeriod;
				var dCacheLoadStartDate = bUpdateCacheStartDate ? oTimePeriod.startDate : this._oOrderGanttTimePeriod.startDate;
				var dCacheLoadEndDate = bUpdateCacheEndDate ? oTimePeriod.endDate : this._oOrderGanttTimePeriod.endDate;

				var bCacheNeedsUpdate = bOrderGanttTimePeriodChanged || bUpdateCacheStartDate || bUpdateCacheEndDate;

				return {
					update: bCacheNeedsUpdate,
					startDate: dCacheLoadStartDate,
					endDate: dCacheLoadEndDate
				};
			},

			applySettings: function () {
				// Reset the state of "Assign" button in "Action" column
				this.byId("idActionColumn").setTemplate(this.byId("idAssignActionHL"));
				this.byId("idExpandRowColumn").setTemplate(this.byId("idExpandActionHL"));
				this.setTimeAxis();
				this.setNoDataText(false);
				this._setDeltaLines();
			},

			_applyPersonalizationSettings: function () {
				var pPersAppStateInitialized = this.controllers.persAppState.initialized();
				pPersAppStateInitialized.then(
					function () {
						var oAppState = this._oComponent.controllers.persAppState.get();
						var aVisibleColumnFullIds = oAppState.peopleGantt ? oAppState.peopleGantt.columns : undefined;

						if (aVisibleColumnFullIds) {
							var aAllColumns = this.getTable().getColumns();
							var aVisibleColumnIds = aVisibleColumnFullIds.map(function (sColumnId) {
								return GanttUtils.getControlId(sColumnId);
							});
							// Parse and compare only the exclusive column id and not the full id
							aAllColumns.forEach(function (oColumn) {
								var sColumnID = GanttUtils.getControlId(oColumn.getId());
								var bVisible = aVisibleColumnIds.includes(sColumnID);
								oColumn.setVisible(bVisible);
							});
						}
					}.bind(this)
				);
			},

			setNoDataText: function (bDataLoaded) {
				var sText = bDataLoaded ? this.oCommonBundle.getText("peopleGanttNoDataText") : undefined;
				this.getTable().setNoData(sText);
			},

			_getDeltaLineDescription: function (oOperationData) {
				var sOrder = oOperationData.MaintenanceOrder,
					sOperation = oOperationData.MaintenanceOrderOperation,
					sSubOperation = oOperationData.MaintenanceOrderSubOperation;
				var bIsASubOperation = !!sSubOperation;
				var sTextKey = bIsASubOperation ? "subOperationDeltaLineTooltip" : "operationDeltaLineTooltip";
				return this.oCommonBundle.getText(sTextKey, [
					oOperationData.NumberOfAssignedPersons,
					oOperationData.NumberOfCapacities,
					sOrder,
					sOperation,
					sSubOperation
				]);
			},

			_setDeltaLines: function () {
				var oDateFormatter = DateFormat.getDateTimeWithTimezoneInstance({ showTimezone: false, pattern: "YYYYMMddHHmmss" });
				for (var i = 0; i < this._aOperations.length; ++i) {
					var sDescription = this._getDeltaLineDescription(this._aOperations[i]);
					var oDeltaLine = new DeltaLine({
						timeStamp: oDateFormatter.format(this._aOperations[i].OrderOperationStartDateTime),
						endTimeStamp: oDateFormatter.format(this._aOperations[i].OrderOperationEndDateTime),
						stroke: "@sapInformativeColor",
						strokeDasharray: "5, 2",
						description: sDescription
					});
					this._oFragment.addDeltaLine(oDeltaLine);
				}
			},

			_updateDeltaLineTooltip: function (aUpdatedOperations, iOffset) {
				var aDeltaLines = this._oFragment.getDeltaLines();

				aUpdatedOperations.forEach(
					function (sOrderOperation) {
						var iIndex = this._aOrderOperation.indexOf(sOrderOperation);
						var oDeltaLine = aDeltaLines[iIndex];
						this._aOperations[iIndex].NumberOfAssignedPersons = (
							parseInt(this._aOperations[iIndex].NumberOfAssignedPersons, 10) + iOffset
						).toString();
						var sDescription = this._getDeltaLineDescription(this._aOperations[iIndex]);
						oDeltaLine.setDescription(sDescription);
					}.bind(this)
				);
			},

			_getSplitsForSelectedOperations: function (aAssignmentPaths) {
				var oSplits = {};

				if (aAssignmentPaths) {
					aAssignmentPaths.forEach(
						function (sAssignmentPath) {
							var oAssignment = this._oPeopleModel.getObject("/" + sAssignmentPath);
							if (oAssignment) {
								var sAsgnmtOrderOperation =
									oAssignment.MaintenanceOrder + "/" + oAssignment.MaintenanceOrderOperation + "/" + oAssignment.MaintenanceOrderSubOperation;
								var bSplitExistsForOp = this._aOrderOperation.includes(sAsgnmtOrderOperation);
								if (bSplitExistsForOp) {
									var bClientSide = oAssignment.CapacityRequirement === undefined;
									oSplits[sAsgnmtOrderOperation] = {
										Assignment: sAssignmentPath,
										IsClientSide: bClientSide
									};
								}
							}
						}.bind(this)
					);
				}
				return oSplits;
			},

			_createAssignmentPayload: function (sTargetResourceId, oData) {
				return {
					MaintWorkCenterPersonID: sTargetResourceId,
					AssignedMaintOpStartDateTime: oData.OrderOperationStartDateTime,
					AssignedMaintOpEndDateTime: oData.OrderOperationEndDateTime,
					MaintenanceOrder: oData.MaintenanceOrder,
					MaintenanceOrderOperation: oData.MaintenanceOrderOperation,
					MaintenanceOrderSubOperation: oData.MaintenanceOrderSubOperation
				};
			},

			_saveOperationData: function (aOpShapePaths) {
				this._aOpShapePaths = aOpShapePaths;
				aOpShapePaths.forEach(
					function (sShapePath) {
						var oData = this._oDataModel.getProperty(sShapePath);
						this._aOrderOperation.push(oData.MaintenanceOrder + "/" + oData.MaintenanceOrderOperation + "/" + oData.MaintenanceOrderSubOperation);
						// Save a copy of the ODataModel object so that we don't change the model's original data
						var oDataCopy = Object.assign({}, oData);
						this._aOperations.push(oDataCopy);
					}.bind(this)
				);
			},

			_getTimePeriod: function () {
				var aEarliestAssngdDates = [],
					aLatestAssgnDates = [];

				// Find the earliest and latest dates across all operations' Operation start dates and Assigned start dates
				this._aOperations.forEach(function (oOperation) {
					var dStartDate = oOperation.OrderOperationStartDateTime,
						dEndDate = oOperation.OrderOperationEndDateTime;

					if (oOperation.AssignedMaintOpStartDateTime && oOperation.AssignedMaintOpEndDateTime) {
						dStartDate = Math.min(oOperation.AssignedMaintOpStartDateTime, oOperation.OrderOperationStartDateTime);
						dEndDate = Math.max(oOperation.AssignedMaintOpEndDateTime, oOperation.OrderOperationEndDateTime);
					}
					aEarliestAssngdDates.push(dStartDate);
					aLatestAssgnDates.push(dEndDate);
				});

				var oTimePeriod = {};

				var dEarliestOpStartDate = UI5Date.getInstance(Math.min.apply(null, aEarliestAssngdDates));
				var dLatestOpEndDate = UI5Date.getInstance(Math.max.apply(null, aLatestAssgnDates));

				oTimePeriod.startDate = UI5Date.getInstance(dEarliestOpStartDate);
				oTimePeriod.endDate = UI5Date.getInstance(dLatestOpEndDate);
				oTimePeriod.startDate.setHours(0, 0, 0);
				oTimePeriod.endDate.setHours(23, 59, 59);

				if (dEarliestOpStartDate.getHours() < 4) {
					oTimePeriod.startDate.setDate(oTimePeriod.startDate.getDate() - 1);
				}
				if (dLatestOpEndDate.getHours() >= 20) {
					oTimePeriod.endDate.setDate(oTimePeriod.endDate.getDate() + 1);
				}
				oTimePeriod.ganttStartTime = GanttFormatter.dateToAbapTimestamp(oTimePeriod.startDate);
				oTimePeriod.ganttEndTime = GanttFormatter.dateToAbapTimestamp(oTimePeriod.endDate);

				return oTimePeriod;
			},

			_requestRelevantForBusy: function (oRequest) {
				var bTableRequestSent = oRequest.url.indexOf("C_RSHPersonTP") !== -1 && oRequest.method === "GET" && oRequest.response === undefined;
				var bTableRequestFinished = oRequest.url.indexOf("C_RSHPersonTP") !== -1 && oRequest.method === "GET" && oRequest.response !== undefined;
				var bCacheRequestSent = oRequest.url.indexOf("C_RSHPersonDetail") !== -1 && oRequest.method === "GET" && oRequest.response === undefined;
				return bTableRequestSent || bCacheRequestSent || bTableRequestFinished;
			},

			_createClientSideAssignments: function (sTargetResourceId, aOpShapePathsWithoutSplits) {
				return new Promise(
					function (resolve, reject) {
						var sPath = "/C_RSHPersonTP('" + sTargetResourceId + "')/to_Assignment";
						var iNumberOfCreations = aOpShapePathsWithoutSplits.length;
						var iAssignmentsCreated = 0;

						var oParameters = {
							created: function (oContext) {
								// After the assignment entity was created, add a reference to the resource entity's aggregation
								// The Gantt chart is bound these references. Adding a new reference will make the new assignment visible on the Gantt chart.
								var aAssignments = oContext.oModel.getObject("/C_RSHPersonTP('" + sTargetResourceId + "')/to_Assignment");

								// ...and add the newly created assignment in to this array
								var sPathToNewAssignment = oContext.getPath();
								aAssignments.push(sPathToNewAssignment.slice(1));

								iAssignmentsCreated++;

								if (iAssignmentsCreated === iNumberOfCreations) {
									resolve();
								}
							},
							// Setting the refresh false to prevent the GET after POST
							refreshAfterChange: false,
							groupId: "idBatchSplitClient"
						};

						aOpShapePathsWithoutSplits.forEach(
							function (sShapePath) {
								var oData = this._oDataModel.getProperty(sShapePath);
								oParameters.properties = this._createAssignmentPayload(sTargetResourceId, oData);
								this._oPeopleModel.createEntry(sPath, oParameters);
							}.bind(this)
						);
					}.bind(this)
				);
			},

			_deleteClientSideAssignments: function (sTargetResourceId, aOpShapePathsWithClientSplits) {
				var sPath = "/C_RSHPersonTP('" + sTargetResourceId + "')/to_Assignment";
				var aAssignments = this._oPeopleModel.getObject(sPath);
				var iOperationCount = aOpShapePathsWithClientSplits.length;
				var sResourcePath = "/C_RSHPersonTP('" + sTargetResourceId + "')";
				var aPathsToReset = [];

				for (var i = 0; i < iOperationCount; ++i) {
					aPathsToReset.push("/" + aAssignments.at(-1));
					// Popping here directly pops the model's object
					aAssignments.pop();
				}
				aPathsToReset.push(sResourcePath);

				this._oPeopleModel.resetChanges(aPathsToReset, false, true); //use this to delete created entities
			},

			onColumnVisibilityChange: function (oEvent) {
				var sColumnID = oEvent.getParameter("column").getId();
				var bExpandColumn = sColumnID.includes("idExpandRowColumn");
				var bPersonIDColumn = sColumnID.includes("idResourceColumn");

				if (bExpandColumn || bPersonIDColumn) {
					oEvent.preventDefault();
					Utils.addMessage(this.oCommonBundle.getText("MandatoryColumnMessage"), sap.ui.core.MessageType.Warning, Constants.sDisplayTypeMessageBox);
				}
			},

			onShapeContextMenu: function (oEvent) {
				var oShape = oEvent.getParameter("shape");
				var bValidShape = false;

				if (oShape) {
					var sShapeName = oShape.getMetadata().getName();
					bValidShape = sShapeName === "sap.gantt.simple.MultiActivityGroup" || sShapeName === "sap.gantt.simple.BaseRectangle";
				}

				if (bValidShape) {
					var bAssignmentShape = oShape.getId().includes("Assignment");
					if (bAssignmentShape) {
						this._oContextMenuController.open(oShape).then(
							function () {
								var sDeletedAssignmentPath = oShape.getBindingContext("peopleGanttModel").getPath();
								var sRowPath = oShape.getParent().getParent().getBindingContext("peopleGanttModel").getPath();
								this._deleteConflictingAssignment(sDeletedAssignmentPath, sRowPath);
								this._adjustConflicts(sRowPath);
								this._oPeopleModel.updateBindings(false);
							}.bind(this),
							function () {}
						);
					}
				}
			},

			_deleteConflictingAssignment: function (sSplitPath, sRowPath) {
				var sAssignmentAssociationPath = sRowPath + "/to_Assignment";
				var aAssignmentsPaths = this._oPeopleModel.getObject(sAssignmentAssociationPath);
				var oConflictingAssignment = this._oPeopleModel.getObject(sSplitPath);
				var sPersonID = oConflictingAssignment.MaintWorkCenterPersonID;
				var sOrderOperation =
					oConflictingAssignment.MaintenanceOrder +
					"/" +
					oConflictingAssignment.MaintenanceOrderOperation +
					"/" +
					oConflictingAssignment.MaintenanceOrderSubOperation;
				var bServerSideSplit = oConflictingAssignment.CapacityRequirement !== undefined;

				var iIndexOfSplit = aAssignmentsPaths.indexOf(sSplitPath.slice(1));
				aAssignmentsPaths.splice(iIndexOfSplit, 1);

				if (bServerSideSplit) {
					if (!this._oDeletedSplits.hasOwnProperty(sPersonID)) {
						this._oDeletedSplits[sPersonID] = [];
					}
					var oSplitData = {
						AssignmentPath: sSplitPath.slice(1),
						Operation: sOrderOperation
					};
					this._oDeletedSplits[sPersonID].push(oSplitData);
				} else {
					var aPathsToReset = [sSplitPath, sRowPath];
					this._oPeopleModel.resetChanges(aPathsToReset, false, true);
				}

				var bChangesExists = this._clientSideChangesExists();
				this._fnOnClienSideChanges(bChangesExists);

				if (this._aOrderOperation.includes(sOrderOperation)) {
					this._updateDeltaLineTooltip([sOrderOperation], -1);
				}
			},

			_adjustConflicts: function (sRowPath) {
				var sConflictAssociationPath = sRowPath + "/to_Conflicts";
				var aConflictPaths = this._oPeopleModel.getObject(sConflictAssociationPath);
				var sPersonID = this._oPeopleModel.getObject(sRowPath).MaintWorkCenterPersonID;

				var aNewConflicts = this._recalculateConflictsForPerson(sRowPath);
				this._deleteAndCreateNewConflicts(aNewConflicts, aConflictPaths, sPersonID);
			},

			_recalculateConflictsForPerson: function (sRowPath) {
				var sAssignmentAssociationPath = sRowPath + "/to_Assignment";
				var aAssignmentPaths = this._oPeopleModel.getObject(sAssignmentAssociationPath);

				var aAssignments = aAssignmentPaths.map(
					function (sAssignmentPath) {
						var oAssignment = this._oPeopleModel.getObject("/" + sAssignmentPath);
						return oAssignment;
					}.bind(this)
				);

				// Sort the assignments by start time to make calculations easier
				aAssignments.sort(function (oValue1, oValue2) {
					if (oValue1.AssignedMaintOpStartDateTime.getTime() > oValue2.AssignedMaintOpStartDateTime.getTime()) {
						return 1;
					} else {
						return -1;
					}
				});

				var aConflicts = [];

				for (var i = 0; i < aAssignments.length; i++) {
					for (var j = i + 1; j < aAssignments.length; j++) {
						var oAssignment1 = aAssignments[i];
						var oAssignment2 = aAssignments[j];
						var bAssignmentInConflict =
							oAssignment2.AssignedMaintOpStartDateTime < oAssignment1.AssignedMaintOpEndDateTime &&
							oAssignment2.AssignedMaintOpEndDateTime > oAssignment1.AssignedMaintOpStartDateTime;
						if (bAssignmentInConflict) {
							var dConflictStartTime, dConflictEndTime;
							if (oAssignment1.AssignedMaintOpStartDateTime < oAssignment2.AssignedMaintOpStartDateTime) {
								dConflictStartTime = oAssignment2.AssignedMaintOpStartDateTime;
							} else {
								dConflictStartTime = oAssignment1.AssignedMaintOpStartDateTime;
							}

							if (oAssignment1.AssignedMaintOpEndDateTime > oAssignment2.AssignedMaintOpEndDateTime) {
								dConflictEndTime = oAssignment2.AssignedMaintOpEndDateTime;
							} else {
								dConflictEndTime = oAssignment1.AssignedMaintOpEndDateTime;
							}

							var bExistingConflictAdjusted = this._mergeOverlappingConflicts(aConflicts, dConflictStartTime, dConflictEndTime);

							if (!bExistingConflictAdjusted) {
								aConflicts.push({
									ConflictStartDateTime: dConflictStartTime,
									ConflictEndDateTime: dConflictEndTime,
									MaintWorkCenterPersonID: oAssignment1.MaintWorkCenterPersonID
								});
							}
						}
					}
				}

				return aConflicts;
			},

			_mergeOverlappingConflicts: function (aExistingConflicts, dConflictStartTime, dConflictEndTime) {
				var bExistingConflictAdjusted = false;
				aExistingConflicts.forEach(function (oConflict) {
					if (oConflict.ConflictStartDateTime <= dConflictEndTime && oConflict.ConflictEndDateTime >= dConflictStartTime) {
						if (dConflictStartTime < oConflict.ConflictStartDateTime) {
							oConflict.ConflictStartDateTime = dConflictStartTime;
						}

						if (dConflictEndTime > oConflict.ConflictEndDateTime) {
							oConflict.ConflictEndDateTime = dConflictEndTime;
						}
						bExistingConflictAdjusted = true;
					}
				});

				return bExistingConflictAdjusted;
			},

			_deleteAndCreateNewConflicts: function (aNewConflicts, aOldConflictPaths, sPersonID) {
				var aConflictPathsToBeDeleted = [];
				aOldConflictPaths.forEach(
					function (sConflictPath) {
						var iIndexOfConflict = aNewConflicts.findIndex(
							function (oNewConflict) {
								var oOldConflict = this._oPeopleModel.getObject("/" + sConflictPath);
								return (
									oOldConflict.ConflictStartDateTime.getTime() === oNewConflict.ConflictStartDateTime.getTime() &&
									oOldConflict.ConflictEndDateTime.getTime() === oNewConflict.ConflictEndDateTime.getTime()
								);
							}.bind(this)
						);

						if (iIndexOfConflict !== -1) {
							aNewConflicts.splice(iIndexOfConflict, 1);
						} else {
							aConflictPathsToBeDeleted.push(sConflictPath);
						}
					}.bind(this)
				);

				this._deleteConflicts(aConflictPathsToBeDeleted, sPersonID);
				this._createConflicts(aNewConflicts, sPersonID);
			},

			_deleteConflicts: function (aConflictPathsToBeDeleted, sPersonID) {
				var sAssociationToConflictPath = "/C_RSHPersonTP('" + sPersonID + "')/to_Conflicts";
				var aConflictPaths = this._oPeopleModel.getObject(sAssociationToConflictPath);
				var aPathsToReset = [];
				var sPersonPath = "/C_RSHPersonTP('" + sPersonID + "')";

				aConflictPathsToBeDeleted.forEach(function (sConflictPath) {
					var iIndex = aConflictPaths.indexOf(sConflictPath);
					var aDeletedConflictPath = aConflictPaths.splice(iIndex, 1);
					aPathsToReset.push("/" + aDeletedConflictPath[0]);
				});
				// We need to reset changes of Model data only when deleting a client side entry
				aPathsToReset.push(sPersonPath);
				this._oPeopleModel.resetChanges(aPathsToReset, false, true);
			},

			_createConflicts: function (aNewConflicts, sPersonID) {
				var sPath = "/C_RSHPersonTP('" + sPersonID + "')/to_Conflicts";

				var oParameters = {
					created: function (oContext) {
						var aConflicts = oContext.oModel.getObject("/C_RSHPersonTP('" + sPersonID + "')/to_Conflicts");
						var sPathToNewConflict = oContext.getPath();

						aConflicts.push(sPathToNewConflict.slice(1));

						this._oPeopleModel.updateBindings(false);
					}.bind(this),
					refreshAfterChange: false
				};

				aNewConflicts.forEach(
					function (oConflict) {
						oParameters.properties = oConflict;
						this._oPeopleModel.createEntry(sPath, oParameters);
					}.bind(this)
				);
			},

			onAssign: function (oEvent) {
				var sPersonPath = oEvent.getSource().getBindingContext("peopleGanttModel").getPath();
				var sPersonID = this._oPeopleModel.getObject(sPersonPath).MaintWorkCenterPersonID;
				var sAssignmentsPath = "/C_RSHPersonTP('" + sPersonID + "')/to_Assignment";
				var aAssignmentsPath = this._oPeopleModel.getObject(sAssignmentsPath);

				var oAssignButton = oEvent.getSource();
				var bAssignButtonPressed = oEvent.getSource().getType() === "Accept";

				this._updateAssignButtonProperties(oAssignButton);

				if (bAssignButtonPressed) {
					this._assignSplits(sPersonID, aAssignmentsPath);
				} else {
					this._unassignSplits(sPersonID, aAssignmentsPath);
				}

				var oUnassignButton = oEvent.getSource().getParent().getParent().getAggregation("items")[1].getAggregation("items")[0];
				oUnassignButton.setVisible(false);
			},

			_updateAssignButtonProperties: function (oAssignButton) {
				var bAssignButtonPressed = oAssignButton.getType() === "Accept";

				if (bAssignButtonPressed) {
					var sUnassignButtontext = this.oCommonBundle.getText("UnassignButtonText");
					oAssignButton.setText(sUnassignButtontext);
					oAssignButton.setType("Reject");
					oAssignButton.setIcon("sap-icon://delete");
				} else {
					var sAssignButtontext = this.oCommonBundle.getText("AssignButtonText");
					oAssignButton.setText(sAssignButtontext);
					oAssignButton.setType("Accept");
					oAssignButton.setIcon("sap-icon://accept");
				}
			},

			_assignSplits: function (sPersonID, aAssignmentsPath) {
				var oSplitsForCreation = this._getSplitsForSelectedOperations(aAssignmentsPath);
				var iExistingSplitCount = Object.keys(oSplitsForCreation).length;
				var aUpdatedOperations = [];

				// Create client side splits for operations without server side splits
				if (iExistingSplitCount < this._aOrderOperation.length) {
					var aOpShapePathsWithoutSplits = [];
					this._aOrderOperation.forEach(
						function (sOrderOperation, iIndex) {
							if (!oSplitsForCreation.hasOwnProperty(sOrderOperation)) {
								aOpShapePathsWithoutSplits.push(this._aOpShapePaths[iIndex]);
								aUpdatedOperations.push(sOrderOperation);
							}
						}.bind(this)
					);
					this._createClientSideAssignments(sPersonID, aOpShapePathsWithoutSplits).then(
						function () {
							var sPersonPath = "/C_RSHPersonTP('" + sPersonID + "')";
							this._adjustConflicts(sPersonPath);
							var bChangesExists = this._clientSideChangesExists();
							this._fnOnClienSideChanges(bChangesExists);
							this._oPeopleModel.updateBindings(false);
						}.bind(this)
					);
					this._updateDeltaLineTooltip(aUpdatedOperations, 1);
				}
			},

			_unassignSplits: function (sPersonID, aAssignmentsPath) {
				var oSplitsForDeletion = this._getSplitsForSelectedOperations(aAssignmentsPath);
				var aOpShapePathsWithClientSplits = [];
				var aUpdatedOperations = [];
				if (!this._oDeletedSplits.hasOwnProperty(sPersonID)) {
					this._oDeletedSplits[sPersonID] = [];
				}

				this._aOrderOperation.forEach(
					function (sOrderOperation, iIndex) {
						if (oSplitsForDeletion.hasOwnProperty(sOrderOperation)) {
							// Delete server side splits
							if (!oSplitsForDeletion[sOrderOperation].IsClientSide) {
								var iIndexOfOperation = aAssignmentsPath.indexOf(oSplitsForDeletion[sOrderOperation].Assignment);
								var oSplitData = {
									AssignmentPath: aAssignmentsPath.splice(iIndexOfOperation, 1)[0],
									Operation: sOrderOperation
								};
								this._oDeletedSplits[sPersonID].push(oSplitData);
							} else {
								aOpShapePathsWithClientSplits.push(this._aOpShapePaths[iIndex]);
							}
							aUpdatedOperations.push(sOrderOperation);
						}
					}.bind(this)
				);

				// Delete client side splits
				if (aOpShapePathsWithClientSplits.length > 0) {
					this._deleteClientSideAssignments(sPersonID, aOpShapePathsWithClientSplits);
				}
				this._updateDeltaLineTooltip(aUpdatedOperations, -1);
				var bChangesExists = this._clientSideChangesExists();
				this._fnOnClienSideChanges(bChangesExists);

				var sPersonPath = "/C_RSHPersonTP('" + sPersonID + "')";
				this._adjustConflicts(sPersonPath);
				this._oPeopleModel.updateBindings(false);
			},

			onUnassign: function (oEvent) {
				var sPathResource = oEvent.getSource().getParent().getParent().getParent().getRowBindingContext().sPath;
				var oResource = this._oPeopleModel.getObject(sPathResource);
				var sTargetResourceId = oResource.MaintWorkCenterPersonID;

				var sPath = "/C_RSHPersonTP('" + sTargetResourceId + "')/to_Assignment";
				var aAssignments = this._oPeopleModel.getObject(sPath);

				this._unassignSplits(sTargetResourceId, aAssignments);
				oEvent.getSource().setVisible(false);
			},

			_onTableDataReceived: function (oEvent) {
				var iRows = oEvent.getParameter("data").results.length;
				this._fnOnRowsChanged(iRows);
				this.setNoDataText(true);
			},

			onToggleExpandRow: function (oEvent) {
				var oButton = oEvent.getSource();
				var oRow = oButton.getParent().getParent();
				this._expandCollapseRow(oRow, oButton);
				this._oFragment.deselectShapes(this._oFragment.getSelectedShapeUid());
			},

			onShapePress: function (oEvent) {
				var oShape = oEvent.getParameter("shape");
				var bValidShape = false;

				if (oShape) {
					var sShapeName = oShape.getMetadata().getName();
					bValidShape = sShapeName === "sap.gantt.simple.BaseGroup";
				}

				if (bValidShape) {
					var bConflictShape = oShape.getId().includes("Conflict");
					if (bConflictShape) {
						var oRow = oShape.getParent().getParent();
						// Button is always present in the first column
						var oButton = oRow.getCells()[0].getItems()[0];
						this._expandCollapseRow(oRow, oButton);
					}
				}
			},

			_expandCollapseRow: function (oRow, oExpandButton) {
				var sPersonID = this._oPeopleModel.getObject(oRow.getBindingContext("peopleGanttModel").getPath()).MaintWorkCenterPersonID;
				var bExpand = !Object.keys(this._oExpandedRows).includes(sPersonID);
				var iRowIndex = oRow.getIndex();

				if (bExpand) {
					this._oFragment.expand("assignment", iRowIndex);
					this._oExpandedRows[sPersonID] = iRowIndex;
					oExpandButton.setIcon("sap-icon://navigation-down-arrow");
				} else {
					this._oFragment.collapse("assignment", iRowIndex);
					delete this._oExpandedRows[sPersonID];
					oExpandButton.setIcon("sap-icon://navigation-right-arrow");
				}
			},

			unload: function () {
				this.getGantt().removeAllDeltaLines();
				this._collapseAllRows();
				this._cleanPeopleModel();
				this._oDeletedSplits = {};
				this._aOrderOperation = [];
				this._aOperations = [];
				this._oExpandedRows = {};
			},

			_cleanPeopleModel: function () {
				var oPendingChanges = this._oPeopleModel.getPendingChanges();
				Object.keys(oPendingChanges).forEach(
					function (sPendingChange) {
						var sTargetResourceId = oPendingChanges[sPendingChange].MaintWorkCenterPersonID;
						var aPaths = sPendingChange.includes("C_RSHPersonAssignmentTP")
							? this._oPeopleModel.getObject("/C_RSHPersonTP('" + sTargetResourceId + "')/to_Assignment")
							: this._oPeopleModel.getObject("/C_RSHPersonTP('" + sTargetResourceId + "')/to_Conflicts");
						aPaths.splice(aPaths.indexOf(sPendingChange), 1);
					}.bind(this)
				);
				this._oPeopleModel.resetChanges(undefined, true, true);
			},

			_collapseAllRows: function () {
				var aRowIndices = Object.values(this._oExpandedRows);
				this._oFragment.collapse("assignment", aRowIndices);
			},

			_getPersonFilter: function () {
				var aResourceFilters = [];
				// This array is introduced to make sure no duplicate Resource filters are passed
				var aPersonIDs = [];
				var aOpWorkCenters = this._aOperations.map(function (oData) {
					return oData.WorkCenterInternalID;
				});

				for (var i = 0; i < this._oDataResourceDetails.results.length; i++) {
					var oPersonDetails = this._oDataResourceDetails.results[i];
					if (aOpWorkCenters.includes(oPersonDetails.OperationWorkCenterInternalID) && !aPersonIDs.includes(oPersonDetails.MaintWorkCenterPersonID)) {
						var oNewFilter = new Filter({
							path: "MaintWorkCenterPersonID",
							operator: FilterOperator.EQ,
							value1: oPersonDetails.MaintWorkCenterPersonID
						});
						aResourceFilters.push(oNewFilter);
						aPersonIDs.push(oPersonDetails.MaintWorkCenterPersonID);
					}
				}
				// When no resources are from the selected operation's work center, no filters will be created
				// Therefore adding a dummy filter
				if (aResourceFilters.length === 0) {
					aResourceFilters.push(
						new Filter({
							path: "MaintWorkCenterPersonID",
							operator: FilterOperator.EQ,
							value1: "99999999"
						})
					);
				}
				var oResourceFilter = new Filter({
					filters: aResourceFilters,
					and: false
				});

				return oResourceFilter;
			},

			_getDateFilter: function () {
				var oTimePeriod = this._getTimePeriod();

				var dRequestedStartDate = oTimePeriod.startDate;
				var dRequestedEndDate = oTimePeriod.endDate;

				var oDateFilter = new Filter({
					filters: [
						new Filter({
							path: "RequestedStartDate",
							operator: FilterOperator.LT,
							value1: dRequestedStartDate
						}),
						new Filter({
							path: "RequestedEndDate",
							operator: FilterOperator.GT,
							value1: dRequestedEndDate
						})
					],
					and: true
				});

				return oDateFilter;
			},

			_getFilters: function () {
				var oResourceFilter = this._getPersonFilter();
				var oDateFilter = this._getDateFilter();

				var oFilter = new Filter({
					filters: [oResourceFilter, oDateFilter],
					and: true
				});
				return oFilter;
			},

			bind: function () {
				var oFilter = this._getFilters();

				this.getTable().bindRows({
					path: "/C_RSHPersonTP",
					model: "peopleGanttModel",

					// The service shall not bind all resources, but the resources assigned to my work centers.
					filters: oFilter,

					parameters: {
						// In the backend service, a SADL filter exit will take the root filters of ResourceTP into account
						// and will enforce the assignment selection
						expand: "to_Assignment,to_Conflicts",

						countMode: "Inline",
						numberOfExpandedLevels: 0,

						treeAnnotationProperties: {
							hierarchyLevelFor: "MaintWorkCenterPersonRowLevel",
							hierarchyNodeFor: "MaintWorkCenterPersonID",
							hierarchyParentNodeFor: "ResourceParentRowID",
							hierarchyDrillStateFor: "ResourceIsExpanded"
						},

						gantt: {
							rowIdName: "MaintWorkCenterPersonID"
						},
						groupId: "iDBatchOrderFilterRequest"
					},
					events: {
						dataReceived: this._onTableDataReceived.bind(this)
					}
				});
			},

			bindCalendar: function () {
				var oFilter = this._getFilters();
				this.byId("idAvailabilityCalDef").bindAggregation("defs", {
					path: "/C_RSHPersonCalendar",
					model: "peopleGanttModel",

					filters: oFilter,

					parameters: {
						expand: "to_BasicNonAvailability",
						groupId: "GetCalendars"
					},

					template: new Calendar({
						key: {
							path: "MaintWorkCenterPersonID",
							model: "peopleGanttModel"
						},

						backgroundColor: "sapShell_Background",
						timeIntervals: {
							path: "to_BasicNonAvailability",
							model: "peopleGanttModel",
							templateShareable: true,
							template: new TimeInterval({
								startTime: {
									path: "NonAvailabilityTimeStartDteTme",
									model: "peopleGanttModel",
									formatter: GanttUtils.getDateInGanttFormat
								},
								endTime: {
									path: "NonAvailabilityTimeEndDteTme",
									model: "peopleGanttModel",
									formatter: GanttUtils.getDateInGanttFormat
								}
							})
						}
					})
				});
			},

			_checkIfExistingSplitWasReassigned: function (sSplitPath, aAssignmentPaths) {
				var oSplit = this._oPeopleModel.getObject("/" + sSplitPath);
				var sOperationOfSplit = oSplit.MaintenanceOrder + "/" + oSplit.MaintenanceOrderOperation + "/" + oSplit.MaintenanceOrderSubOperation;
				var sPersonOfSplit = oSplit.MaintWorkCenterPersonID;

				// Check if there is an existing split(server side split) present for the
				// corresponding client side split.
				var sReassignedSplitPath = aAssignmentPaths.find(
					function (sPath) {
						var oExistingSplit = this._oPeopleModel.getObject("/" + sPath);
						var sOperationOfExistingSplit =
							oExistingSplit.MaintenanceOrder + "/" + oExistingSplit.MaintenanceOrderOperation + "/" + oExistingSplit.MaintenanceOrderSubOperation;
						var sPersonOfExistingSplit = oExistingSplit.MaintWorkCenterPersonID;

						return sOperationOfExistingSplit === sOperationOfSplit && sPersonOfExistingSplit === sPersonOfSplit;
					}.bind(this)
				);

				if (sReassignedSplitPath) {
					var oReassignedSplit = this._oPeopleModel.getObject("/" + sReassignedSplitPath);

					var bSameStartTime = oReassignedSplit.AssignedMaintOpStartDateTime.getTime() === oSplit.AssignedMaintOpStartDateTime.getTime();
					var bSameEndTime = oReassignedSplit.AssignedMaintOpEndDateTime.getTime() === oSplit.AssignedMaintOpEndDateTime.getTime();

					return bSameStartTime && bSameEndTime;
				} else {
					return false;
				}
			},

			_callDeleteSplits: function (oTargetParams) {
				// Create deferred DELETE requests for all unassign operations

				Object.keys(this._oDeletedSplits).forEach(
					function (sTargetResourceId) {
						this._oDeletedSplits[sTargetResourceId].forEach(
							function (oSplit) {
								var oPendingChanges = this._oPeopleModel.getPendingChanges();
								var aClientSideAssignmentPaths = Object.keys(oPendingChanges).filter(function (sPath) {
									return sPath.includes("C_RSHPersonAssignmentTP");
								});
								if (!this._checkIfExistingSplitWasReassigned(oSplit.AssignmentPath, aClientSideAssignmentPaths)) {
									var oRemoveParams = {
										path: "/" + oSplit.AssignmentPath,
										modelName: "peopleGanttModel",
										groupId: "idBatchSplit",
										refreshAfterChange: false
									};
									this.controllers.modelPromises.remove(oRemoveParams);

									// Add changed operation info to ItemHashMap container for a delta refresh
									var aOrderOperationDate = oSplit.Operation.split("/");
									var oValues = {
										order: aOrderOperationDate[0],
										orderOperation: aOrderOperationDate[1],
										orderSubOperation: aOrderOperationDate[2],
										action: Constants.unassignPeopleAction
									};

									oTargetParams.put([oSplit.Operation, "", Constants.unassignPeopleAction], oValues, "");
								}
							}.bind(this)
						);
					}.bind(this)
				);
			},

			_callCreateSplits: function (oTargetParams) {
				var oPendingChanges = this._oPeopleModel.getPendingChanges();

				Object.keys(oPendingChanges).forEach(
					function (sPendingChange) {
						if (sPendingChange.includes("C_RSHPersonAssignmentTP")) {
							var sTargetResourceId = oPendingChanges[sPendingChange].MaintWorkCenterPersonID;
							var oSplit = oPendingChanges[sPendingChange];

							var bExistingSplitReassigned = false;
							if (this._oDeletedSplits.hasOwnProperty(sTargetResourceId)) {
								var aDeletedSplitPaths = this._oDeletedSplits[sTargetResourceId].map(function (oDeletedSplit) {
									return oDeletedSplit.AssignmentPath;
								});

								bExistingSplitReassigned = this._checkIfExistingSplitWasReassigned(sPendingChange, aDeletedSplitPaths);
							}

							if (!bExistingSplitReassigned) {
								var sPath = "/C_RSHPersonTP('" + sTargetResourceId + "')/to_Assignment";

								// Remove start and end time from payload to enable Capacitive Assignments
								delete oSplit.AssignedMaintOpStartDateTime;
								delete oSplit.AssignedMaintOpEndDateTime;

								var oCreateParams = {
									path: sPath,
									modelName: "peopleGanttModel",
									data: oSplit,
									groupId: "idBatchSplit",
									refreshAfterChange: false,
									changeSetId: oSplit.MaintenanceOrder
								};
								this.controllers.modelPromises.create(oCreateParams);

								// Add changed operation info to ItemHashMap container for a delta refresh
								var oValues = {
									order: oSplit.MaintenanceOrder,
									orderOperation: oSplit.MaintenanceOrderOperation,
									orderSubOperation: oSplit.MaintenanceOrderSubOperation,
									action: Constants.unassignPeopleAction
								};
								var sOrderOperation = oSplit.MaintenanceOrder + "/" + oSplit.MaintenanceOrderOperation + "/" + oSplit.MaintenanceOrderSubOperation;
								oTargetParams.put([sOrderOperation, "", Constants.unassignPeopleAction], oValues, "");
							}
						}
					}.bind(this)
				);
			},

			_clientSideChangesExists: function () {
				var oPendingChanges = this._oPeopleModel.getPendingChanges();

				var aPersonsWithDeletedSplits = Object.keys(this._oDeletedSplits);
				for (var i = 0; i < aPersonsWithDeletedSplits.length; i++) {
					var aSplits = this._oDeletedSplits[aPersonsWithDeletedSplits[i]];
					for (var j = 0; j < aSplits.length; j++) {
						var aClientSideAssignmentPaths = Object.keys(oPendingChanges).filter(function (sPath) {
							return sPath.includes("C_RSHPersonAssignmentTP");
						});
						if (!this._checkIfExistingSplitWasReassigned(aSplits[j].AssignmentPath, aClientSideAssignmentPaths)) {
							return true;
						}
					}
				}

				var aCreatedSplitPaths = Object.keys(oPendingChanges);
				for (var k = 0; k < aCreatedSplitPaths.length; k++) {
					if (aCreatedSplitPaths[k].includes("C_RSHPersonAssignmentTP")) {
						var sTargetResourceId = oPendingChanges[aCreatedSplitPaths[k]].MaintWorkCenterPersonID;

						var bExistingSplitReassigned = false;
						if (this._oDeletedSplits.hasOwnProperty(sTargetResourceId)) {
							var aDeletedSplitPaths = this._oDeletedSplits[sTargetResourceId].map(function (oDeletedSplit) {
								return oDeletedSplit.AssignmentPath;
							});

							bExistingSplitReassigned = this._checkIfExistingSplitWasReassigned(aCreatedSplitPaths[k], aDeletedSplitPaths);
						}

						if (!bExistingSplitReassigned) {
							return true;
						}
					}
				}

				return false;
			},

			saveChanges: function (oEvent) {
				// After clicking once on "Assign" and then on "Save", there are 3 requests submitted in the following order:
				// 1) DELETE C_RSHPersonAssignmentTP(CapacityRequirement='',CapacityRequirementItem='',CapacityRqmtItemCapacity='')
				// 2) POST C_RSHPersonTP('')/to_Assignment
				// 3) UPDATE
				return new Promise(
					function (resolve, reject) {
						var oTargetParams = new ItemHashMap();
						oTargetParams.parameters = {};
						oTargetParams.parameters.bRefreshOfSourceAppRequired = true;

						// Note: On executing submitChanges(), a batch call will be made containing CRUD requests in the following order currently:
						// 1. POST (Client side assignment creations using createEntry() in handleAssignPress())
						// 2. DELETE (Deferred remove() requests in onSaveAssignments())
						// But we require DELETE calls to be sent before the POST calls.
						// Therefore we create deferred create requests and DO NOT submit the client side created requests.
						// We achieve this by using a different group id for the client side changes and the deferred requests.

						this._callDeleteSplits(oTargetParams);
						this._callCreateSplits(oTargetParams);

						var bPendingChanges = oTargetParams.getNumberOfMassChangeObjects() > 0;
						if (bPendingChanges) {
							this._oPeopleModel.submitChanges({
								groupId: "idBatchSplit",
								success: function (oData) {
									var oResponse = oData.__batchResponses[0];
									var bRequestSucceeded = oResponse.hasOwnProperty("__changeResponses");
									resolve({
										targetParams: oTargetParams,
										success: bRequestSucceeded
									});
								},
								error: function () {
									resolve({
										targetParams: null,
										success: false
									});
								}
							});
						} else {
							reject();
						}
					}.bind(this)
				);
			},

			onExit: function () {
				if (!this._oFragment) {
					return;
				}
				// template for Rectangle shape needs to be destroyed as the template is set to shareable
				this.byId("idAssignmentBaseGroup").destroy();
				this.byId("idConflictsGroup").destroy();
				this._oContextMenuController.destroy();
			}
		});
	}
);
