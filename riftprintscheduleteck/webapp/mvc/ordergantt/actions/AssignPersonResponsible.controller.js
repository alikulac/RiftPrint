/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/rsh/eam/lib/common/base/BaseViewChild.controller", "sap/rsh/eam/lib/common/utils/Constants"],
	function (BaseViewChildController, Constants) {
		"use strict";

		return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.ordergantt.actions.AssignPersonResponsible.controller", {
			onInitMembers: function () {
				this.oGanttChartContainer = this.byId("idOrderGanttContainer");
			},

			assign: function (aSelectedOpRowPaths) {
				var aSelectedOperations = this._getSelectedOperationsFromPaths(aSelectedOpRowPaths);
				this.controllers.ordergantt.assignPersonResponsibleDialog
					.open(aSelectedOperations)
					.then(this._personResponsibleSelected.bind(this, aSelectedOperations));
			},

			unassign: function (aSelectedOpRowPaths) {
				var aSelectedOperations = this._getSelectedOperationsFromPaths(aSelectedOpRowPaths);
				// Assign person responsible id "00000000" in case of unassign
				var aPayloads = this._buildPayloads(Constants.idUnassignedPersonResponsible, aSelectedOperations);
				if (aPayloads.length) {
					this._callBackendService(aPayloads);
				}
			},

			_personResponsibleSelected: function (aSelectedOperations, iPersonResponsibleID) {
				var aPayloads = this._buildPayloads(iPersonResponsibleID.toString(), aSelectedOperations);
				if (aPayloads.length) {
					this._callBackendService(aPayloads);
				}
			},

			_callBackendService: function (aPayloads) {
				this.oGanttChartContainer.setBusy(true);

				var oRefreshParams = {
					fetchAllOps: true,
					orderOps: []
				};
				aPayloads.forEach(
					function (oPayload) {
						oRefreshParams.orderOps.push({ order: oPayload.MaintenanceOrder, orderOperation: oPayload.MaintenanceOrderOperation });
						this._buildBackendCall(oPayload);
					}.bind(this)
				);

				this.controllers.response.handle().then(
					function (oResult) {
						this.oGanttChartContainer.setBusy(false);
						if (!oResult.messageStatus.allHaveError) {
							this.controllers.deltaRefresh.refresh(oRefreshParams);
						}
					}.bind(this)
				);
			},

			_buildBackendCall: function (oPayload) {
				var sFunctionImport = "/I_MaintOrderOperationTPChangeassgmt";
				var bIsASubOperation = !!oPayload.MaintenanceOrderSubOperation;
				if (bIsASubOperation) {
					sFunctionImport = "/I_MaintOrderSubOperationTPChangeassgmt";
				}

				var oParams = {
					path: sFunctionImport,
					urlParameters: oPayload,
					method: "POST"
				};
				var pFunctionCall = this.controllers.modelPromises.callFunction(oParams);
				this.controllers.response.addRequest(pFunctionCall);
			},

			_buildPayloads: function (sPersonResponsibleID, aSelectedOperations) {
				var aPayloads = [];

				aSelectedOperations.forEach(
					function (oOperation) {
						var bOperationAlreadyAssignedPerson = Number(sPersonResponsibleID) === Number(oOperation.OperationPersonResponsible);
						var bOperationValidPersonAssigned = !!Number(oOperation.OperationPersonResponsible);
						if (!bOperationAlreadyAssignedPerson) {
							aPayloads.push({
								Plant: oOperation.Plant,
								OperationWorkCenter: oOperation.WorkCenter,
								DraftUUID: Constants.idEmptyUUID,
								IsActiveEntity: "true",
								OperationPersonResponsible: sPersonResponsibleID,
								MaintenanceOrder: oOperation.MaintenanceOrder,
								MaintenanceOrderOperation: oOperation.MaintenanceOrderOperation,
								MaintenanceOrderSubOperation: oOperation.MaintenanceOrderSubOperation
							});
						} else if (bOperationValidPersonAssigned) {
							var sMsgKey = oOperation.MaintenanceOrderSubOperation
								? "InfoMessageSubOperationAlreadyAssignedPerson"
								: "InfoMessageOperationAlreadyAssignedPerson";
							this.controllers.message.addMessage(
								this.oBundle.getText(sMsgKey, [
									oOperation.MaintenanceOrder,
									oOperation.MaintenanceOrderOperation,
									oOperation.MaintenanceOrderSubOperation
								]),
								"Information",
								"Popover"
							);
						}
					}.bind(this)
				);

				return aPayloads;
			},

			_getSelectedOperationsFromPaths: function (aSelectedOpRowPaths) {
				var aSelectedOperations = aSelectedOpRowPaths.map(
					function (sOpRowPath) {
						return this.oModel.getProperty(sOpRowPath);
					}.bind(this)
				);
				return aSelectedOperations;
			}
		});
	}
);
