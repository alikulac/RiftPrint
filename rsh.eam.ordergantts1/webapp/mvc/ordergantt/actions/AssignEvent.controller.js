/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/rsh/eam/lib/common/utils/ItemHashMap",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/gantt/misc/Utility",
		"sap/rsh/eam/lib/common/utils/GanttUtils",
		"sap/ui/core/format/DateFormat"
	],
	function (BaseViewChildController, ItemHashMap, Constants, Utils, GanttUtility, GanttUtils, DateFormat) {
		"use strict";

		return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.ordergantt.actions.AssignEvent.controller", {
			onInitMembers: function () {
				this.oGanttChartWithTable = this.byId("idOrderGanttChartWithTable");
				this.oGanttChartContainer = this.byId("idOrderGanttContainer");
				this.oTreeTable = this.byId("idOrderTreeTable");
				this._oItemHashMap = undefined;
			},

			onOrderContextMenuAssignEventAction: function (oData) {
				var sMaintenanceEvent = oData.sMaintenanceEvent;
				var aRowBindings = this.oTreeTable.getBinding("rows");
				var oModel = this.oModel;
				var aSelectedShapes = this.oGanttChartWithTable.getSelectedShapeUid();
				this._oItemHashMap = new ItemHashMap();
				var aSelectedShapeUids = [oData.oShape.getShapeUid()];
				if (aSelectedShapes.length > 0) {
					aSelectedShapeUids = aSelectedShapes;
				}
				for (var i = 0; i < aSelectedShapeUids.length; i++) {
					var oSelectedShapeUid = GanttUtility.parseUid(aSelectedShapeUids[i]);
					var sShapePath = oSelectedShapeUid.shapeDataName;
					var oSelectedShape = oModel.getObject(sShapePath);
					var iRowIndex = parseInt(oSelectedShapeUid.rowIndex, 10);
					var oRowPath = aRowBindings.getContextByIndex(iRowIndex);
					var oRow = oModel.getObject(oRowPath.getDeepPath());
					var dOrderStartDateTime = oRow.OrderStartDateTime;
					var dOrderEndDateTime = oRow.OrderEndDateTime;
					if (oSelectedShape.ProcessingStatus === Constants.inProcessCode) {
						continue;
					}
					if (oData.Action === Constants.Assign) {
						if (oData.revisionEndDateTime instanceof Date && oData.revisionStartDateTime instanceof Date) {
							dOrderStartDateTime = oData.revisionStartDateTime;
							dOrderEndDateTime = oData.revisionEndDateTime;
						} else {
							//Fallback to only date when dateTime is not available - in some cases it is not filled
							dOrderStartDateTime = oData.dRevisionStartDate;
							dOrderEndDateTime = oData.dRevisionEndDate;
						}
						this._prepareParametersForOrderActions(oSelectedShape, oRow, sMaintenanceEvent, dOrderStartDateTime, dOrderEndDateTime, oData.Action);
					} else if (oSelectedShape.MaintenanceEvent !== "" && oData.Action === Constants.UnAssign) {
						this._prepareParametersForOrderActions(oSelectedShape, oRow, sMaintenanceEvent, dOrderStartDateTime, dOrderEndDateTime, oData.Action);
					}
				}
				var sGroupId = "/C_ObjPgMaintOrderChangescheduling";
				this._oItemHashMap.triggerBackendCall(sGroupId, Constants.sAfterDragAndDropFinalizedGanttApp, true);
				this.controllers.submit.submitAndRefresh(sGroupId, this._oItemHashMap);
			},

			_prepareParametersForOrderActions: function (oSelectedShape, oRow, sMaintenanceEvent, dOrderStartDateTime, dOrderEndDateTime, sAction) {
				var oTimeFormat = DateFormat.getDateInstance({
					pattern: "PTHH'H'mm'M'ss'S'"
				});
				var dInitialDate = new Date(0);
				var oParameters = {
					MaintOrdBasicStartDate: dInitialDate,
					MaintOrdBasicEndDate: dInitialDate,
					MaintOrdBasicStartTime: oTimeFormat.format(dInitialDate),
					MaintOrdBasicEndTime: oTimeFormat.format(dInitialDate),
					MaintOrdBasicStartDateTime: dOrderStartDateTime,
					MaintOrdBasicEndDateTime: dOrderEndDateTime,
					BasicSchedulingType: oRow.BasicSchedulingType,
					OrdIsNotSchedldAutomatically: oRow.OrdIsNotSchedldAutomatically ? true : false,
					order: oSelectedShape.MaintenanceOrder,
					KeepOrRemoveConstraints: "R",
					MaintPriority: oRow.MaintPriority,
					MaintenanceRevision: sMaintenanceEvent,
					functionCallName: "/C_ObjPgMaintOrderChangescheduling",
					action: sAction
				};
				this._oItemHashMap.put([oSelectedShape.MaintenanceOrder, "", sAction], oParameters, this.oModel);
			}
		});
	}
);
