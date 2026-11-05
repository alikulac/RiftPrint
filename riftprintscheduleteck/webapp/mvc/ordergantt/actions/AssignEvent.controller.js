/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/gantt/misc/Utility",
		"sap/ui/core/format/DateFormat"
	],
	function (BaseViewChildController, Constants, Utils, GanttUtility, DateFormat) {
		"use strict";

		return BaseViewChildController.extend("zrsh.eam.ordergantts1.mvc.ordergantt.actions.AssignEvent.controller", {
			onInitMembers: function () {
				this.oGanttChartWithTable = this.byId("idOrderGanttChartWithTable");
				this.oGanttChartContainer = this.byId("idOrderGanttContainer");
				this.oTreeTable = this.byId("idOrderTreeTable");
			},

			onOrderContextMenuAssign: function (oData) {
				this._onOrderContextMenu(oData, true);
			},

			onOrderContextMenuUnassign: function (oData) {
				this._onOrderContextMenu(oData, false);
			},

			_onOrderContextMenu: function (oData, bAssign) {
				var oRefreshParams = {
					fetchAllOps: true,
					orderOps: []
				};

				var aRowBindings = this.oTreeTable.getBinding("rows");
				var aSelectedShapeUids = this.oGanttChartWithTable.getSelectedShapeUid();
				for (var i = 0; i < aSelectedShapeUids.length; i++) {
					var oSelectedShapeUid = GanttUtility.parseUid(aSelectedShapeUids[i]);
					var sShapePath = oSelectedShapeUid.shapeDataName;
					var oOrder = this.oModel.getObject(sShapePath);
					var iRowIndex = parseInt(oSelectedShapeUid.rowIndex, 10);
					var oRowContext = aRowBindings.getContextByIndex(iRowIndex);
					var oRow = oRowContext.getObject();
					var dOrderStartDateTime = oRow.OrderStartDateTime;
					var dOrderEndDateTime = oRow.OrderEndDateTime;
					if (oOrder.ProcessingStatus === Constants.inProcessCode) {
						continue;
					}

					var pCall;
					if (bAssign) {
						if (oData.revisionEndDateTime instanceof Date && oData.revisionStartDateTime instanceof Date) {
							dOrderStartDateTime = oData.revisionStartDateTime;
							dOrderEndDateTime = oData.revisionEndDateTime;
						} else {
							//Fallback to only date when dateTime is not available - in some cases it is not filled
							dOrderStartDateTime = oData.dRevisionStartDate;
							dOrderEndDateTime = oData.dRevisionEndDate;
						}
						pCall = this._callFunction(oOrder, oRow, oData.sMaintenanceEvent, dOrderStartDateTime, dOrderEndDateTime);
					} else if (oOrder.MaintenanceEvent !== "") {
						pCall = this._callFunction(oOrder, oRow, oData.sMaintenanceEvent, dOrderStartDateTime, dOrderEndDateTime);
					}

					if (pCall) {
						this.controllers.response.addRequest(pCall);
						oRefreshParams.orderOps.push({
							order: oOrder.MaintenanceOrder
						});
					}
				}

				// the refresh call is included in the same batch as the function calls
				this.controllers.deltaRefresh.refresh(oRefreshParams);

				// submit
				this.oGanttChartContainer.setBusy(true);
				this.controllers.response.handle().finally(
					function () {
						this.oGanttChartContainer.setBusy(false);
					}.bind(this)
				);
			},

			_callFunction: function (oOrder, oRow, sMaintenanceEvent, dOrderStartDateTime, dOrderEndDateTime) {
				var oTimeFormat = DateFormat.getDateInstance({
					pattern: "PTHH'H'mm'M'ss'S'"
				});
				var dInitialDate = new Date(0);
				var oParams = {
					path: "/C_ObjPgMaintOrderChangescheduling",
					urlParameters: {
						MaintenanceOrder: oOrder.MaintenanceOrder,
						MaintOrdBasicStartDate: dInitialDate,
						MaintOrdBasicEndDate: dInitialDate,
						MaintOrdBasicStartTime: oTimeFormat.format(dInitialDate),
						MaintOrdBasicEndTime: oTimeFormat.format(dInitialDate),
						MaintOrdBasicStartDateTime: dOrderStartDateTime,
						MaintOrdBasicEndDateTime: dOrderEndDateTime,
						BasicSchedulingType: oRow.BasicSchedulingType,
						OrdIsNotSchedldAutomatically: oRow.OrdIsNotSchedldAutomatically ? true : false,
						KeepOrRemoveConstraints: "R",
						MaintPriority: oRow.MaintPriority,
						MaintenanceRevision: sMaintenanceEvent,
						DraftUUID: "00000000-0000-0000-0000-000000000000",
						IsActiveEntity: "true"
					}
				};
				return this.controllers.modelPromises.callFunction(oParams);
			}
		});
	}
);
