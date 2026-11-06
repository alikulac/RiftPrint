/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/rsh/eam/lib/common/utils/DateUtils",
		"sap/gantt/misc/Utility",
		"sap/ui/core/format/DateFormat",
		"sap/ui/core/date/UI5Date"
	],
	function (BaseViewChildController, Constants, Utils, DateUtils, GanttUtility, DateFormat, UI5Date) {
		"use strict";

		return BaseViewChildController.extend("zrift.rsh.eam.ordergantts1.mvc.ordergantt.actions.UpdateOrderOpDates.controller", {
			onInitMembers: function () {
				this.oGanttChartContainer = this.byId("idOrderGanttContainer");
				this.oGanttChartWithTable = this.byId("idOrderGanttChartWithTable");
			},

			_prepareParametersForPlannedDateChanges: function (aOrderRows, aOperationRows, oModel, iDateTimeInMs, bIsExactStart, oRefreshParams) {
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
							dFinalStartDateTime = DateUtils.roundDateToNearestDnDGranularity(dFinalStartDateTime);
						}

						dOrderStartDateTime = dFinalStartDateTime;
						dOrderEndDateTime = dFinalEndDateTime;

						var dInitialDate = UI5Date.getInstance(0);

						var oParams = {
							path: "/C_ObjPgMaintOrderChangescheduling",
							urlParameters: {
								MaintenanceOrder: aOrderRows[i].MaintenanceOrder,
								BasicSchedulingType: aOrderRows[i].BasicSchedulingType,
								OrdIsNotSchedldAutomatically: aOrderRows[i].OrdIsNotSchedldAutomatically ? true : false,
								MaintOrdBasicStartDate: dInitialDate,
								MaintOrdBasicStartTime: oTimeFormat.format(dInitialDate),
								MaintOrdBasicEndDate: dInitialDate,
								MaintOrdBasicEndTime: oTimeFormat.format(dInitialDate),
								KeepOrRemoveConstraints: "R",
								MaintPriority: aOrderRows[i].MaintPriority,
								MaintenanceRevision: aOrderRows[i].MaintenanceRevision,
								MaintOrdBasicStartDateTime: dOrderStartDateTime,
								MaintOrdBasicEndDateTime: dOrderEndDateTime,
								DraftUUID: "00000000-0000-0000-0000-000000000000",
								IsActiveEntity: "true"
							}
						};
						var pCall = this.controllers.modelPromises.callFunction(oParams);
						this.controllers.response.addRequest(pCall);
						oRefreshParams.orderOps.push({
							order: aOrderRows[i].MaintenanceOrder,
							checkCrossOrders: true
						});
					}
				}

				if (aOperationRows.length !== 0) {
					var dFinalStartDateTime, dFinalStartDate, oOrderOperationStartDateTime;

					for (i = 0; i < aOperationRows.length; i++) {
						oOrderOperationStartDateTime = aOperationRows[i].OrderOperationStartDateTime;
						if (bIsExactStart) {
							dFinalStartDateTime = UI5Date.getInstance(iDateTimeInMs);
						} else {
							dFinalStartDate = UI5Date.getInstance(oOrderOperationStartDateTime.getTime() + iDateTimeInMs);
							// Round off the time to a full hour as per user requirements for DND
							dFinalStartDateTime = DateUtils.roundDateToNearestDnDGranularity(dFinalStartDate);
						}

						var oParams = {
							path: "/I_MaintOrderOperationTPChangescheduling",
							urlParameters: {
								MaintenanceOrder: aOperationRows[i].MaintenanceOrder,
								MaintenanceOrderOperation: aOperationRows[i].MaintenanceOrderOperation,
								Schedulingstartconstraint: "1",
								Schedulingendconstraint: " ",
								Startconstraintdatetime: dFinalStartDateTime,
								Endconstraintdatetime: dFinalStartDateTime, // is mandatory to send, can be same as start
								DraftUUID: "00000000-0000-0000-0000-000000000000",
								IsActiveEntity: "true"
							}
						};

						var pCall = this.controllers.modelPromises.callFunction(oParams);
						this.controllers.response.addRequest(pCall);
						oRefreshParams.orderOps.push({
							order: aOperationRows[i].MaintenanceOrder,
							orderOperation: aOperationRows[i].MaintenanceOrderOperation,
							checkCrossOrders: true
						});
					}
				}
			},

			onSetPlannedDate: function (oEventData) {
				var dNewStartDate = oEventData.dateTimeValue;
				var iDateTimeInMs = dNewStartDate.getTime();
				var oModel = this.getModel();
				var oShape;
				var aOrderObjects = [];
				var aOperationObjects = [];
				var aSelectedShapes = this.oGanttChartWithTable.getSelectedShapeUid();
				var oRefreshParams = {
					fetchAllOps: true,
					orderOps: []
				};

				var bMultipleSections = aSelectedShapes.length;
				if (bMultipleSections) {
					aSelectedShapes.forEach(function (shapeObject) {
						var sShapePath = GanttUtility.parseUid(shapeObject).shapeDataName;
						oShape = oModel.getObject(sShapePath);
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

				this._prepareParametersForPlannedDateChanges(aOrderObjects, aOperationObjects, oModel, iDateTimeInMs, true, oRefreshParams);

				// the refresh call is included in the same batch as the function calls
				this.controllers.deltaRefresh.refresh(oRefreshParams);

				this.oGanttChartContainer.setBusy(true);
				this.controllers.response.handle().finally(
					function () {
						this.oGanttChartContainer.setBusy(false);
					}.bind(this)
				);

				this.oGanttChartWithTable.deselectShapes(this.oGanttChartWithTable.getSelectedShapeUid());
			},

			// before cleanup: SchedulingBoard.MoveOrderAndOperationBasedOnDateChange
			onDragAndDropShape: function (oEvent) {
				var oModel = this.getModel();
				var that = this;
				var sDraggedShapePath = GanttUtility.parseUid(oEvent.getParameters().lastDraggedShapeUid).shapeDataName;
				var oDraggedShape = oModel.getObject(sDraggedShapePath);
				var dOldStartDate;
				var oDraggedOrderRows = [];
				var oDraggedOperationRows = [];
				var oDraggedShapeDates = oEvent.getParameter("draggedShapeDates");
				var oRefreshParams = {
					fetchAllOps: true,
					orderOps: []
				};

				var bIsOrder = oDraggedShape.OrderOperationRowLevel === 0;
				if (bIsOrder) {
					dOldStartDate = oDraggedShape.OrderStartDateTime;
				} else {
					dOldStartDate = oDraggedShape.OrderOperationStartDateTime;
				}
				var dStartDate = oEvent.getParameter("cursorDateTime"),
					iMoveWidthInMs = dStartDate.getTime() - dOldStartDate.getTime();

				// Drag and drop is allowed only for future date
				var oCurrentDate = UI5Date.getInstance(),
					bPastDataValidationFailed = false;
				Object.keys(oDraggedShapeDates).forEach(
					function (sShapeUid) {
						var sPath = GanttUtility.parseUid(sShapeUid).shapeDataName;
						var oData = oModel.getObject(sPath),
							dStartDateTime,
							dFinalStartDate;
						if (oData.OrderOperationRowLevel === 0) {
							dStartDateTime = oData.OrderStartDateTime;
							dFinalStartDate = UI5Date.getInstance(dStartDateTime.getTime() + iMoveWidthInMs);
							if (!Utils.isMockRun() && dFinalStartDate < oCurrentDate) {
								this.controllers.message.addMessage(that.oBundle.getText("ErrorMessageDragAndDropOrdertoPastDates"), "Error", "Dialog");
								bPastDataValidationFailed = true;
								return;
							}
							oDraggedOrderRows.push(oData);
						} else {
							dStartDateTime = oData.OrderOperationStartDateTime;
							dFinalStartDate = UI5Date.getInstance(dStartDateTime.getTime() + iMoveWidthInMs);
							if (!Utils.isMockRun() && dFinalStartDate < oCurrentDate) {
								this.controllers.message.addMessage(that.oBundle.getText("ErrorMessageDragAndDropOperationtoPastDates"), "Error", "Dialog");
								bPastDataValidationFailed = true;
								return;
							}
							oDraggedOperationRows.push(oData);
						}
					}.bind(this)
				);

				if (bPastDataValidationFailed) {
					return;
				}

				this._prepareParametersForPlannedDateChanges(oDraggedOrderRows, oDraggedOperationRows, oModel, iMoveWidthInMs, false, oRefreshParams);

				// the refresh call is included in the same batch as the function calls
				this.controllers.deltaRefresh.refresh(oRefreshParams);

				this.oGanttChartContainer.setBusy(true);
				this.controllers.response.handle().finally(
					function () {
						this.oGanttChartContainer.setBusy(false);
					}.bind(this)
				);
			}
		});
	}
);
