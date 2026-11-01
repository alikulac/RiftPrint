/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/ui/base/EventProvider", "sap/rsh/eam/lib/common/utils/Constants", "sap/ui/base/Object", "sap/rsh/eam/lib/common/utils/utils", "sap/ui/core/date/UI5Date"],
	function (EventProvider, Constants, UI5Object, Utils, UI5Date) {
		"use strict";

		return UI5Object.extend("sap/rsh/eam/lib/common/utils/MassChangeObject", {
			_utils: Utils,

			constructor: function (aValues, oFragmentModel) {
				this._oModel = oFragmentModel;
				this._oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rsh.eam.lib.common");
				this._Values = aValues;
				this._oEventBus = sap.ui.getCore().getEventBus();
			},

			callBackendFunction: function (sGroupId, bDeferRequest) {
				this._Values.functionCallStatus = Constants.functionCallRequested;

				// Paramaters, required for the function calls all types
				var parameters = {
					MaintenanceOrder: this._Values.order,

					DraftUUID: "00000000-0000-0000-0000-000000000000",
					IsActiveEntity: "true"
				};

				if (this._Values.orderOperation) {
					parameters.MaintenanceOrderOperation = this._Values.orderOperation;
				}

				if (this._Values.orderSubOperation) {
					parameters.MaintenanceOrderSubOperation = this._Values.orderSubOperation;
				}

				// Add special paramateres for scheduling
				if (this._Values.action === Constants.schedulingOperationAction) {
					parameters.Schedulingstartconstraint = "1";
					parameters.Schedulingendconstraint = " ";
					parameters.Startconstraintdatetime = this._Values.startConstraintDateTime;
					parameters.Endconstraintdatetime = this._Values.startConstraintDateTime; //endconstraint is mandatory to send, can be same as start
				}

				// Add special paramateres for removing constraints
				if (this._Values.action === Constants.removeConstraintsAction) {
					parameters.Schedulingstartconstraint = " ";
					parameters.Schedulingendconstraint = " ";
					parameters.Startconstraintdatetime = this._Values.startConstraintDateTime;
					parameters.Endconstraintdatetime = this._Values.startConstraintDateTime; //endconstraint is mandatory to send, can be same as start
				}

				// Add special paramateres for work center reassignment
				if (this._Values.action === Constants.workcenterAction) {
					parameters.OperationPersonResponsible = this._Values.personResponsible;
					parameters.OperationWorkCenter = this._Values.newWorkCenter;
					parameters.Plant = this._Values.plant;
				}

				// Add special paramateres for Drag&Drop Order or with action Assign, Unassign Maintenance Event
				if (this._Values.action === Constants.moveOrder || this._Values.action === Constants.UnAssign || this._Values.action === Constants.Assign) {
					parameters.MaintOrdBasicStartDate = this._Values.MaintOrdBasicStartDate;
					parameters.MaintOrdBasicEndDate = this._Values.MaintOrdBasicEndDate;
					parameters.BasicSchedulingType = this._Values.BasicSchedulingType;
					parameters.OrdIsNotSchedldAutomatically = this._Values.OrdIsNotSchedldAutomatically ? true : false;
					parameters.MaintOrdBasicStartTime = this._Values.MaintOrdBasicStartTime;
					parameters.MaintOrdBasicEndTime = this._Values.MaintOrdBasicEndTime;
					parameters.KeepOrRemoveConstraints = this._Values.KeepOrRemoveConstraints;
					parameters.MaintPriority = this._Values.MaintPriority;
					parameters.MaintenanceRevision = this._Values.MaintenanceRevision;
					parameters.MaintOrdBasicStartDateTime = this._Values.MaintOrdBasicStartDateTime;
					parameters.MaintOrdBasicEndDateTime = this._Values.MaintOrdBasicEndDateTime;
				}

				if (bDeferRequest) {
					this._oModel.setDeferredGroups([sGroupId]);
				}

				// Finally do the backend call
				this._oModel.callFunction(this._Values.functionCallName, {
					method: "POST",
					groupId: sGroupId,
					changeSetId: this._Values.order,
					urlParameters: parameters,
					success: jQuery.proxy(this.onBackendCallSuccess, this),
					error: jQuery.proxy(this.onBackendCallFailed, this)
				});
			},

			onBackendCallSuccess: function (oData, oEvent) {
				//for mock service run no sap-message is generated in backend
				//hence do parsing only if sap-message does exist in the headers
				if (oEvent.headers["sap-message"]) {
					try {
						var aError = JSON.parse(oEvent.headers["sap-message"]);
					} catch (e) {
						this._Values.functionCallStatus = Constants.functionCallFailed;
						Utils.addMessage(
							this._oResourceBundle.getText("ParsingErrorOfSAPMessage"),
							sap.ui.core.MessageType.Error,
							Constants.sDisplayTypeMessageBox
						);
					}

					if (aError.severity === Constants.sErrorSeverityError) {
						this._Values.functionCallStatus = Constants.functionCallFailed;
					} else if (aError.severity === Constants.sErrorSeverityWarning) {
						this._Values.functionCallStatus = Constants.functionCallSuccessfulWithWarning;
					} else if (aError.severity === Constants.sErrorSeveritySuccess) {
						this._Values.functionCallStatus = Constants.functionCallSucessfull;

						//can be removed later after testing of all beckaned possible message scenarios
						this._Values.message = this.getSuccessMessage();

						//for all unknown severity errors the call is failed as default last option
					} else {
						this._Values.functionCallStatus = Constants.functionCallFailed;
					}

					//only for the mock run
				} else {
					this._Values.functionCallStatus = Constants.functionCallSucessfull;
				}
				// Notify Ite Hashmap the call is completed successfully
				this._oEventBus.publish(Constants.sLibraryChannel, Constants.sBackendCallPerformed, this);
			},

			onBackendCallFailed: function (oError) {
				this._Values.functionCallStatus = Constants.functionCallFailed;

				// Notify Ite Hashmap the call is completed successfully
				this._oEventBus.publish(Constants.sLibraryChannel, Constants.sBackendCallPerformed);
			},

			getFunctionCallStatus: function () {
				return this._Values.functionCallStatus;
			},

			getActionName: function () {
				return this._Values.action;
			},

			getSuccessMessage: function () {
				var sMessage;
				switch (this._Values.action) {
					case Constants.schedulingOperationAction:
						sMessage = this._oResourceBundle.getText("SuccessChangeDateTime", [this._Values.order, this._Values.orderOperation]);
						break;
					case Constants.workcenterAction:
						//Success Message for Work Center change with no subop
						if (!this._Values.orderSubOperation) {
							sMessage = this._oResourceBundle.getText("SuccessMessageWorkCenter", [this._Values.order, this._Values.orderOperation]);
							//Success Message for Work Center change with subop
						} else {
							sMessage = this._oResourceBundle.getText("SuccessMessageWorkCenterSubOp", [
								this._Values.order,
								this._Values.orderOperation,
								this._Values.orderSubOperation
							]);
						}

						break;
					case Constants.setDispatchStatusAction:
						//Success Message for Work Center change with no subop
						if (!this._Values.orderSubOperation) {
							sMessage = this._oResourceBundle.getText("SuccessMessageDipatchModeMassChange", [this._Values.order, this._Values.orderOperation]);
							//Success Message for Work Center change with subop
						} else {
							sMessage = this._oResourceBundle.getText("SuccessMessageDipatchModeSubOp", [
								this._Values.order,
								this._Values.orderOperation,
								this._Values.orderSubOperation
							]);
						}
						break;
					case Constants.cancelDispatchStatusAction:
						//Success Message for Work Center change with no subop
						if (!this._Values.orderSubOperation) {
							sMessage = this._oResourceBundle.getText("SuccessMessageDueModeMassChange", [this._Values.order, this._Values.orderOperation]);
							//Success Message for Work Center change with subop
						} else {
							sMessage = this._oResourceBundle.getText("SuccessMessageDueModeSubOp", [
								this._Values.order,
								this._Values.orderOperation,
								this._Values.orderSubOperation
							]);
						}
						break;
				}
				return sMessage;
			}
		});
	}
);
