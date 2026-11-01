/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/rsh/eam/lib/common/utils/StatusCommon"
	],
	function (BaseViewChildController, Constants, Utils, StatusCommon) {
		"use strict";

		return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.ordergantt.actions.DispatchOperations.controller", {
			onInitMembers: function () {
				this.oGanttChartContainer = this.byId("idOrderGanttContainer");
				this.oGanttChartWithTable = this.byId("idOrderGanttChartWithTable");
				this.oStatusCommon = new StatusCommon(Constants.sAfterStatusChangesFinalizedGanttApp);
			},

			onExit: function () {
				this.oStatusCommon.destructor();
			},

			// before cleanup: SchedulingBoard.pressDispatchButton
			dispatch: function (oMenuShape) {
				this.oGanttChartContainer.setBusy(true);
				var oOperation = null;

				if (oMenuShape) {
					var sOpShapePath;
					if (!oMenuShape.getSelected()) {
						sOpShapePath = oMenuShape.getBindingContext().getPath();
						oOperation = this.oModel.getData(sOpShapePath);
						this._setOperationDispatchStatus(oOperation);
					} else {
						var oTimePeriod = this.controllers.timePeriod.get();
						var aSelectedShapes = this.oGanttChartWithTable.getSelectedShapeUid();
						for (var j = 0; j < aSelectedShapes.length; j++) {
							sOpShapePath = sap.gantt.misc.Utility.parseUid(aSelectedShapes[j]).shapeDataName;
							//If selected shape is not Order/Operation shape
							if (sOpShapePath.indexOf("C_RSHOrdersAndOperations") !== -1) {
								oOperation = this.oModel.getData(sOpShapePath);
								//If the selected item is header row or already dispatched item then skip..
								if (oOperation.OrderOperationRowLevel === 0 || oOperation.ProcessingStatus === Constants.dispatchedStatusCode) {
									continue;
								}
								if (Utils.checkIfOperationIsWithinTimePeriod(oOperation, oTimePeriod)) {
									continue;
								}
								if (this._checkIfActionIsRequired(oOperation, Constants.dispatchedStatusCode)) {
									this._setOperationDispatchStatus(oOperation);
								}
							}
						}
					}
				} else {
					//if triggered from toolbar button
					var aSelectedItemsContext = this.controllers.orderGantt.getSelectedBindingContexts();
					for (var i = 0; i < aSelectedItemsContext.length; i++) {
						oOperation = aSelectedItemsContext[i].getObject();
						if (this._checkIfActionIsRequired(oOperation, Constants.dispatchedStatusCode)) {
							this._setOperationDispatchStatus(oOperation);
						}
					}
				}

				var sGroupId = "setDispatchedStatus";
				this.oStatusCommon.triggerBackendCall(true, sGroupId);
				this.controllers.submit.submitAndRefresh(sGroupId, this.oStatusCommon._itemHashMap);
			},

			// before cleanup: SchedulingBoard.setOperationDispatchStatus
			_setOperationDispatchStatus: function (oOperation) {
				if (!oOperation.HasError) {
					this.controllers.ordergantt.messages.removeAll();
					//this is special flag can be set in mass change dialog only
					var bTriggerStatusChangeIrrespectiveOfCurrentStatus = false;
					this.oStatusCommon.setOperationDispatchStatus(oOperation, this.oModel, bTriggerStatusChangeIrrespectiveOfCurrentStatus);
				} else {
					this.validateOperationInProcess(oOperation);
				}
			},

			// before cleanup: SchedulingBoard.cancelOperationDispatchStatus
			cancelDispatch: function (oMenuShape) {
				this.oGanttChartContainer.setBusy(true);
				var oOperation = null;

				if (oMenuShape) {
					var sOpShapePath;
					if (!oMenuShape.getSelected()) {
						sOpShapePath = oMenuShape.getBindingContext().getPath();
						oOperation = this.oModel.getData(sOpShapePath);
						this._cancelOperationDispatchStatus(oOperation);
					} else {
						var aSelectedShapes = this.oGanttChartWithTable.getSelectedShapeUid();
						for (var j = 0; j < aSelectedShapes.length; j++) {
							sOpShapePath = sap.gantt.misc.Utility.parseUid(aSelectedShapes[j]).shapeDataName;
							//If selected shape is not Order/Operation shape
							if (sOpShapePath.indexOf("C_RSHOrdersAndOperations") !== -1) {
								oOperation = this.oModel.getData(sOpShapePath);
								if (this._checkIfActionIsRequired(oOperation, Constants.dueStatusCode)) {
									this._cancelOperationDispatchStatus(oOperation);
								}
							}
						}
					}
				} else {
					//if triggered from toolbar button
					var aSelectedItemsContext = this.controllers.orderGantt.getSelectedBindingContexts();
					for (var i = 0; i < aSelectedItemsContext.length; i++) {
						oOperation = aSelectedItemsContext[i].getObject();
						if (this._checkIfActionIsRequired(oOperation, Constants.dueStatusCode)) {
							this._cancelOperationDispatchStatus(oOperation);
						}
					}
				}

				var sGroupId = "cancDispatchedStatus";
				this.oStatusCommon.triggerBackendCall(true, sGroupId);
				this.controllers.submit.submitAndRefresh(sGroupId, this.oStatusCommon._itemHashMap);
			},

			// before cleanup: SchedulingBoard.checkIfOpActionIsRequired
			_checkIfActionIsRequired: function (oOperation, sProcessingStatus) {
				//If the selected item is header row or already due item then skip..
				if (oOperation.OrderOperationRowLevel === 0 || oOperation.ProcessingStatus === sProcessingStatus) {
					return false;
				}
				var oTimePeriod = this.controllers.timePeriod.get();
				if (Utils.checkIfOperationIsWithinTimePeriod(oOperation, oTimePeriod)) {
					return false;
				}
				return true;
			},

			// before cleanup: SchedulingBoard.cancelOperationDispatchStatus
			_cancelOperationDispatchStatus: function (oOperation) {
				if (!oOperation.HasError) {
					this.controllers.ordergantt.messages.removeAll();
					// this is special flag can be set in mass change dialog only
					var bTriggerStatusChangeIrrespectiveOfCurrentStatus = false;
					this.oStatusCommon.cancelOperationDispatchStatus(oOperation, this.oModel, bTriggerStatusChangeIrrespectiveOfCurrentStatus);
				} else {
					this.validateOperationInProcess(oOperation);
				}
			},

			// before cleanup: SchedulingBoard.pressRemoveConstraintsButton
			removeConstraints: function (oMenuShape) {
				this.oGanttChartContainer.setBusy(true);
				var oOperation = null;

				if (oMenuShape) {
					var sOpShapePath;
					if (!oMenuShape.getSelected()) {
						sOpShapePath = oMenuShape.getBindingContext().getPath();
						oOperation = this.oModel.getData(sOpShapePath);
						this._removeOperationConstraints(oOperation);
					} else {
						var oTimePeriod = this.controllers.timePeriod.get();
						var aSelectedShapes = this.oGanttChartWithTable.getSelectedShapeUid();
						for (var j = 0; j < aSelectedShapes.length; j++) {
							sOpShapePath = sap.gantt.misc.Utility.parseUid(aSelectedShapes[j]).shapeDataName;
							//If selected shape is not Order/Operation shape
							if (sOpShapePath.indexOf("C_RSHOrdersAndOperations") !== -1) {
								oOperation = this.oModel.getData(sOpShapePath);
								if (Utils.checkIfOperationIsWithinTimePeriod(oOperation, oTimePeriod)) {
									continue;
								}
								this._removeOperationConstraints(oOperation);
							}
						}
					}
				} else {
					//if triggered from toolbar button
					var oTimePeriod = this.controllers.timePeriod.get();
					var aSelectedItemsContext = this.controllers.orderGantt.getSelectedBindingContexts();
					for (var i = 0; i < aSelectedItemsContext.length; i++) {
						oOperation = aSelectedItemsContext[i].getObject();
						if (Utils.checkIfOperationIsWithinTimePeriod(oOperation, oTimePeriod)) {
							continue;
						}
						this._removeOperationConstraints(oOperation);
					}
				}

				var sGroupId = "removeConstraints";
				this.oStatusCommon.triggerBackendCall(true, sGroupId);
				this.controllers.submit.submitAndRefresh(sGroupId, this.oStatusCommon._itemHashMap);
			},

			// before cleanup: SchedulingBoard._removeOperationConstraints
			_removeOperationConstraints: function (oOperation) {
				if (!oOperation.HasError) {
					this.controllers.ordergantt.messages.removeAll();
					this.oStatusCommon.removeOperationConstraints(oOperation, this.oModel);
				} else {
					this.validateOperationInProcess(oOperation);
				}
			},

			// before cleanup: SchedulingBoard.operationValidation
			validateOperationInProcess: function (oOperation) {
				var bAddMessage = oOperation.HasError && oOperation.ProcessingStatus === Constants.inProcessCode;
				if (bAddMessage) {
					var sMessage;
					if (oOperation.MaintenanceOrderSubOperation) {
						sMessage = this.oBundle.getText("ErrorMessageInProcessStatusSubOper", [
							oOperation.MaintenanceOrder,
							oOperation.MaintenanceOrderOperation,
							oOperation.MaintenanceOrderSubOperation
						]);
					} else {
						sMessage = this.oBundle.getText("ErrorMessageInProcessStatusOper", [
							oOperation.MaintenanceOrder,
							oOperation.MaintenanceOrderOperation,
							null
						]);
					}
					var sTarget = "C_RSHOrdersAndOperations" + "(" + "'" + oOperation.ID + "'" + ")";
					Utils.addMessage(sMessage, sap.ui.core.MessageType.Information, Constants.sDisplayTypeMessagePopover, sTarget, true);
				}
			}
		});
	}
);
