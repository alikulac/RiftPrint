/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/order/DispatchOperations.controller",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/gantt/misc/Utility"
	],
	function (DispatchOperationsController, Constants, Utils, GanttUtility) {
		"use strict";

		return DispatchOperationsController.extend("rsh.eam.ordergantts1.mvc.ordergantt.actions.DispatchOperations.controller", {
			onInitMembers: function () {
				DispatchOperationsController.prototype.onInitMembers.apply(this, arguments);
				this.oGanttChartContainer = this.byId("idOrderGanttContainer");
				this.oGanttChartWithTable = this.byId("idOrderGanttChartWithTable");
			},

			// before cleanup: SchedulingBoard.pressDispatchButton
			dispatch: function (oMenuShape) {
				this.oGanttChartContainer.setBusy(true);
				var oOperation = null;

				if (oMenuShape) {
					var sOpShapePath;
					var aSelectedShapes = this.oGanttChartWithTable.getSelectedShapeUid();
					for (var j = 0; j < aSelectedShapes.length; j++) {
						sOpShapePath = GanttUtility.parseUid(aSelectedShapes[j]).shapeDataName;
						//If selected shape is not Order/Operation shape
						if (sOpShapePath.indexOf("C_RSHOrdersAndOperations") !== -1) {
							oOperation = this.oModel.getData(sOpShapePath);
							if (this._checkIfActionIsRequired(oOperation, Constants.dispatchedStatusCode)) {
								this._setOperationDispatchStatus(oOperation);
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
				this.triggerCalls(true, sGroupId);
				this._refreshAndSubmit(sGroupId, this.getCallMap());
			},

			// before cleanup: SchedulingBoard.setOperationDispatchStatus
			_setOperationDispatchStatus: function (oOperation) {
				if (!oOperation.HasError) {
					this.controllers.message.removeAllMessages();
					//this is special flag can be set in mass change dialog only
					var bTriggerStatusChangeIrrespectiveOfCurrentStatus = false;
					this.addDispatchCall(oOperation, this.oModel, bTriggerStatusChangeIrrespectiveOfCurrentStatus);
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

					var aSelectedShapes = this.oGanttChartWithTable.getSelectedShapeUid();
					for (var j = 0; j < aSelectedShapes.length; j++) {
						sOpShapePath = GanttUtility.parseUid(aSelectedShapes[j]).shapeDataName;
						//If selected shape is not Order/Operation shape
						if (sOpShapePath.indexOf("C_RSHOrdersAndOperations") !== -1) {
							oOperation = this.oModel.getData(sOpShapePath);
							if (this._checkIfActionIsRequired(oOperation, Constants.dueStatusCode)) {
								this._cancelOperationDispatchStatus(oOperation);
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
				this.triggerCalls(true, sGroupId);
				this._refreshAndSubmit(sGroupId, this.getCallMap());
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
					this.controllers.message.removeAllMessages();
					// this is special flag can be set in mass change dialog only
					var bTriggerStatusChangeIrrespectiveOfCurrentStatus = false;
					this.addCancelDispatchCall(oOperation, this.oModel, bTriggerStatusChangeIrrespectiveOfCurrentStatus);
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
					var oTimePeriod = this.controllers.timePeriod.get();
					var aSelectedShapes = this.oGanttChartWithTable.getSelectedShapeUid();
					for (var j = 0; j < aSelectedShapes.length; j++) {
						sOpShapePath = GanttUtility.parseUid(aSelectedShapes[j]).shapeDataName;
						//If selected shape is not Order/Operation shape
						if (sOpShapePath.indexOf("C_RSHOrdersAndOperations") !== -1) {
							oOperation = this.oModel.getData(sOpShapePath);
							if (Utils.checkIfOperationIsWithinTimePeriod(oOperation, oTimePeriod)) {
								continue;
							}
							this._removeOperationConstraints(oOperation);
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
				this.triggerCalls(true, sGroupId);
				this._refreshAndSubmit(sGroupId, this.getCallMap());
			},

			// before cleanup: SchedulingBoard._removeOperationConstraints
			_removeOperationConstraints: function (oOperation) {
				if (!oOperation.HasError) {
					this.controllers.message.removeAllMessages();
					this.addRemoveConstraintsCall(oOperation, this.oModel);
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
					this.controllers.message.addMessage(sMessage, "Information", "Popover", sTarget, true);
				}
			},

			_refreshAndSubmit: function (sGroupId, oTargetParams) {
				// refresh
				oTargetParams.parameters = {
					bRefreshOfSourceAppRequired: true,
					sGroupId: sGroupId
				};
				this.controllers.deltaRefresh.refresh(oTargetParams);

				// submit
				this.controllers.modelPromises.submitChanges({ groupId: sGroupId }).then(
					function () {
						this.byId("idOrderGanttContainer").setBusy(false);
					}.bind(this)
				);
			}
		});
	}
);
