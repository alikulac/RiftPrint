/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/rsh/eam/lib/common/utils/GanttUtils",
		"sap/gantt/misc/Utility",
		"sap/rsh/eam/lib/common/utils/ItemHashMap",
		"sap/rsh/eam/lib/common/controller/ChangeOperations",
		"sap/ui/core/format/DateFormat",
		"sap/ui/core/date/UI5Date"
	],
	function (BaseViewChildController, Constants, Utils, GanttUtils, GanttUtility, ItemHashMap, ChangeOperations, DateFormat, UI5Date) {
		"use strict";

		return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.ordergantt.actions.UpdateOrderOpDates.controller", {
			onInitMembers: function () {
				this.oGanttChartContainer = this.byId("idOrderGanttContainer");
				this.oGanttChartWithTable = this.byId("idOrderGanttChartWithTable");
				this._oItemHashMap = undefined;
			},

			_prepareParametersForPlannedDateChanges: function (aOrderRows, aOperationRows, oModel, iDateTimeInMs, bIsExactStart) {
				var oTimeFormat = DateFormat.getDateInstance({
					pattern: "PTHH'H'mm'M'ss'S'"
				});
				if (aOrderRows.length !== 0) {
					var dOldStartDateTime, dOldEndDateTime, dFinalStartDateTime, dFinalEndDateTime, startDateTimeUI5, endDateTimeUI5;

					for (var i = 0; i < aOrderRows.length; i++) {
						var dOrderStartDateTime, dOrderEndDateTime;
						dOldStartDateTime = aOrderRows[i].OrderStartDateTime;
						dOldEndDateTime = aOrderRows[i].OrderEndDateTime;

						if (bIsExactStart) {
							// In case of Set Planned Start because we want the exact date for orders or operations
							dFinalStartDateTime = UI5Date.getInstance(iDateTimeInMs);
							startDateTimeUI5 = UI5Date.getInstance(iDateTimeInMs);
							var iOrderDuration = dOldEndDateTime.getTime() - dOldStartDateTime.getTime();
							dFinalEndDateTime = UI5Date.getInstance(iDateTimeInMs + iOrderDuration);
						} else {
							// In case of DnD we move the distance for orders or operations
							dFinalStartDateTime = UI5Date.getInstance(dOldStartDateTime.getTime() + iDateTimeInMs);
							dFinalEndDateTime = UI5Date.getInstance(dOldEndDateTime.getTime() + iDateTimeInMs);
							// only req for start date, causes problems when used with end date
							dFinalStartDateTime = Utils.roundDateToNearestDnDGranularity(dFinalStartDateTime);
						}

						dOrderStartDateTime = dFinalStartDateTime;
						dOrderEndDateTime = dFinalEndDateTime;

						var dInitialDate = UI5Date.getInstance(0);
						var oValues = {
							order: aOrderRows[i].MaintenanceOrder,
							action: Constants.moveOrder,
							functionCallName: "/C_ObjPgMaintOrderChangescheduling",
							functionCallStatus: Constants.functionCallPrepared,
							BasicSchedulingType: aOrderRows[i].BasicSchedulingType,
							OrdIsNotSchedldAutomatically: aOrderRows[i].OrdIsNotSchedldAutomatically ? true : false,
							MaintenanceOrder: aOrderRows[i].MaintenanceOrder,
							MaintOrdBasicStartDate: dInitialDate,
							MaintOrdBasicStartTime: oTimeFormat.format(dInitialDate),
							MaintOrdBasicEndDate: dInitialDate,
							MaintOrdBasicEndTime: oTimeFormat.format(dInitialDate),
							KeepOrRemoveConstraints: "R",
							MaintPriority: aOrderRows[i].MaintPriority,
							MaintenanceRevision: aOrderRows[i].MaintenanceRevision,
							MaintOrdBasicStartDateTime: dOrderStartDateTime,
							MaintOrdBasicEndDateTime: dOrderEndDateTime
						};
						this._oItemHashMap.put([aOrderRows[i].MaintenanceOrder, "", Constants.moveOrder], oValues, oModel);
					}
				}

				if (aOperationRows.length !== 0) {
					var dFinalStartDateTime, dFinalStartDate, oOrderOperationStartDateTime;

					this._oChangeOperationsDelegate = new ChangeOperations();
					for (i = 0; i < aOperationRows.length; i++) {
						oOrderOperationStartDateTime = aOperationRows[i].OrderOperationStartDateTime;
						if (bIsExactStart) {
							dFinalStartDate = UI5Date.getInstance(iDateTimeInMs);
						} else {
							dFinalStartDate = UI5Date.getInstance(oOrderOperationStartDateTime.getTime() + iDateTimeInMs);
						}
						// Round off the time to a full hour as per user requirements
						dFinalStartDateTime = Utils.roundDateToNearestDnDGranularity(dFinalStartDate);

						this._oChangeOperationsDelegate.scheduleOperationBasedOnDateChange(aOperationRows[i], oModel, this._oItemHashMap, dFinalStartDateTime);
					}
				}
			},

			onSetPlannedDate: function (oEventData) {
				this.oGanttChartContainer.setBusy(true);

				var dNewStartDate = oEventData.dateTimeValue;
				var iDateTimeInMs = dNewStartDate.getTime();
				var oModel = this.getModel();
				var oShape;
				var aOrderObjects = [];
				var aOperationObjects = [];
				var aSelectedShapes = this.oGanttChartWithTable.getSelectedShapeUid();

				var bMultipleSections = aSelectedShapes.length;
				if (bMultipleSections) {
					aSelectedShapes.forEach(function (shapeObject) {
						var shapePath = GanttUtility.parseUid(shapeObject).shapeDataName;
						oShape = oModel.getObject(shapePath);
						if (oShape && oShape.OrderOperationRowLevel === 0 && oEventData.calledFrom === "Order") {
							aOrderObjects.push(oShape);
						} else if (oShape && oShape.OrderOperationRowLevel !== 0 && oEventData.calledFrom === "Operation") {
							aOperationObjects.push(oShape);
						}
					});
				} else {
					oShape = oEventData.shape.getBindingContext().getObject();
					if (oShape && oShape.OrderOperationRowLevel === 0 && oEventData.calledFrom === "Order") {
						aOrderObjects.push(oShape);
					} else if (oShape && oShape.OrderOperationRowLevel !== 0 && oEventData.calledFrom === "Operation") {
						aOperationObjects.push(oShape);
					}
				}

				this._oItemHashMap = new ItemHashMap();
				this._prepareParametersForPlannedDateChanges(aOrderObjects, aOperationObjects, oModel, iDateTimeInMs, true);

				var sGroupId = "/C_ObjPgMaintOrderChangescheduling";
				this._oItemHashMap.triggerBackendCall(sGroupId, Constants.sDateTimePopupClose, true);
				this.controllers.submit.submitAndRefresh(sGroupId, this._oItemHashMap);

				this.oGanttChartWithTable.deselectShapes(this.oGanttChartWithTable.getSelectedShapeUid());
			},

			// before cleanup: SchedulingBoard.MoveOrderAndOperationBasedOnDateChange
			onDragAndDropShape: function (oEvent) {
				this.oGanttChartContainer.setBusy(true);
				var oModel = this.getModel();
				var that = this;
				var sDraggedShapePath = GanttUtility.parseUid(oEvent.getParameters().lastDraggedShapeUid).shapeDataName;
				var oDraggedShape = oModel.getObject(sDraggedShapePath);
				var dOldStartDate;
				var oDraggedOrderRows = [];
				var oDraggedOperationRows = [];
				var oDraggedShapeDates = oEvent.getParameter("draggedShapeDates");

				var bIsOrder = oDraggedShape.OrderOperationRowLevel === 0;
				if (bIsOrder) {
					dOldStartDate = oDraggedShape.OrderStartDateTime;
				} else {
					dOldStartDate = oDraggedShape.OrderOperationStartDateTime;
				}
				var dStartDate = GanttUtils.getUI5DateFromDropCursorDateTime(oEvent.getParameter("cursorDateTime")),
					iMoveWidthInMs = dStartDate.getTime() - dOldStartDate.getTime();

				// Drag and drop is allowed only for future date
				var oCurrentDate = UI5Date.getInstance(),
					bPastDataValidationFailed = false;
				Object.keys(oDraggedShapeDates).forEach(function (sShapeUid) {
					var sPath = GanttUtility.parseUid(sShapeUid).shapeDataName;
					var oData = oModel.getObject(sPath),
						dStartDateTime,
						dFinalStartDate;
					if (oData.OrderOperationRowLevel === 0) {
						dStartDateTime = oData.OrderStartDateTime;
						dFinalStartDate = UI5Date.getInstance(dStartDateTime.getTime() + iMoveWidthInMs);
						if (!Utils.isMockRun() && dFinalStartDate < oCurrentDate) {
							Utils.addMessage(
								that.getOwnerComponent().getModel("i18n").getResourceBundle().getText("ErrorMessageDragAndDropOrdertoPastDates"),
								sap.ui.core.MessageType.Error,
								Constants.sDisplayTypeMessageBox
							);
							bPastDataValidationFailed = true;
							return;
						}
						oDraggedOrderRows.push(oData);
					} else {
						dStartDateTime = oData.OrderOperationStartDateTime;
						dFinalStartDate = UI5Date.getInstance(dStartDateTime.getTime() + iMoveWidthInMs);
						if (!Utils.isMockRun() && dFinalStartDate < oCurrentDate) {
							Utils.addMessage(
								that.getOwnerComponent().getModel("i18n").getResourceBundle().getText("ErrorMessageDragAndDropOperationtoPastDates"),
								sap.ui.core.MessageType.Error,
								Constants.sDisplayTypeMessageBox
							);
							bPastDataValidationFailed = true;
							return;
						}
						oDraggedOperationRows.push(oData);
					}
				});

				if (bPastDataValidationFailed) {
					this.oGanttChartContainer.setBusy(false);
					return;
				}

				this._oItemHashMap = new ItemHashMap();
				this._prepareParametersForPlannedDateChanges(oDraggedOrderRows, oDraggedOperationRows, oModel, iMoveWidthInMs, false);

				var sGroupId = "/C_ObjPgMaintOrderChangescheduling";
				this._oItemHashMap.triggerBackendCall(sGroupId, Constants.sAfterDragAndDropFinalizedGanttApp, true);
				this.controllers.submit.submitAndRefresh(sGroupId, this._oItemHashMap);
			}
		});
	}
);
