/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/ui/base/Object",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/ItemHashMap",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/rsh/eam/lib/common/formatters/formatter",
		"sap/ui/core/date/UI5Date"
	],
	function (UI5Object, Constants, ItemHashMap, Utils, Formatter, UI5Date) {
		"use strict";

		return UI5Object.extend("sap/rsh/eam/lib/common/utils/StatusCommon", {
			constants: Constants,
			_itemHashMap: null,
			_oEventBus: sap.ui.getCore().getEventBus(),
			_sAfterStatusChangesFinalizedSourceApp: null,
			_sAfterMassChangesPerformedInStatusCommon: Constants.sAfterMassChangesPerformedInStatusCommon,
			_utils: Utils,

			constructor: function (sFinalEventAppSource) {
				this._oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rsh.eam.lib.common");
				this._oEventBus.subscribe(
					this.constants.sLibraryChannel,
					this.constants.sAfterMassChangesPerformedInStatusCommon,
					this.onFinalizeStatusMassChange,
					this
				);

				this._sAfterStatusChangesFinalizedSourceApp = sFinalEventAppSource;
			},

			/**
			 * called from mass change action to set dispatch status of operation
			 * @public
			 * @param {object} [itemModel] model of operation for which the change is performed
			 * @param {object} [oFragmentModel] model of the fragment
			 * @param {Boolean} [bTriggerStatusChangeIrrespectiveOfCurrentStatus] Current status
			 * @param {object} [oItemHashMap] Map value
			 */
			setOperationDispatchStatus: function (itemModel, oFragmentModel, bTriggerStatusChangeIrrespectiveOfCurrentStatus, oItemHashMap) {
				// Item Hash Map might be passed as e.g. from mass change pop-ups
				// In such a case, just use it
				if (oItemHashMap !== undefined) {
					this._itemHashMap = oItemHashMap;
					// In case the Item Hash Map is not passed, just create a new one
					// e.g. as for the set Dispatched status case
					// Ensure it shall be a singleton
				} else if (this._itemHashMap === null) {
					this._itemHashMap = new ItemHashMap();
				}

				var processingStatusCode = itemModel.ProcessingStatus;
				var sOrderOperation = itemModel.MaintenanceOrderOperation;
				var sOrder = itemModel.MaintenanceOrder;
				var sOrderSubOperation = itemModel.MaintenanceOrderSubOperation;

				if (!(processingStatusCode === this.constants.dispatchedStatusCode) || bTriggerStatusChangeIrrespectiveOfCurrentStatus === true) {
					var oValues = {
						order: sOrder,
						orderOperation: sOrderOperation,
						orderSubOperation: "",
						action: this.constants.setDispatchStatusAction,
						functionCallName: "",
						functionCallStatus: this.constants.functionCallPrepared
					};

					if (sOrderSubOperation) {
						oValues.orderSubOperation = sOrderSubOperation;
						oValues.functionCallName = "/I_MaintOrderSubOperationTPSetdispatch";
					} else {
						oValues.functionCallName = "/I_MaintOrderOperationTPSetdispatch";
					}

					if (sOrderSubOperation) {
						this._itemHashMap.put([sOrder, sOrderOperation, sOrderSubOperation, this.constants.setDispatchStatusAction], oValues, oFragmentModel);
					} else {
						this._itemHashMap.put([sOrder, sOrderOperation, this.constants.setDispatchStatusAction], oValues, oFragmentModel);
					}

					// In case the dispatch status is already set for this item, return appropriate message
				} else {
					if (sOrderSubOperation) {
						var order = sOrder + "/" + sOrderOperation + "/" + sOrderSubOperation;
					} else {
						order = sOrder + "/" + sOrderOperation;
					}
					var sInformationMessage = this._oResourceBundle.getText("errorDispatch", [order]);

					this._utils.addMessage(sInformationMessage, sap.ui.core.MessageType.Information);
				}
			},

			cancelOperationDispatchStatus: function (itemModel, oFragmentModel, bTriggerCancelDispatchedStatusIrrespectiveOfCurrentStatus, oItemHashMap) {
				// Item Hash Map might be passed as e.g. from mass change pop-ups
				// In such a case, just use it
				if (oItemHashMap !== undefined) {
					this._itemHashMap = oItemHashMap;
					// In case the Item Hash Map is not passed, just create a new one
					// e.g. as for the set Dispatched status case
					// Ensure it shall be a singleton
				} else if (this._itemHashMap === null) {
					this._itemHashMap = new ItemHashMap();
				}

				var processingStatusCode = itemModel.ProcessingStatus;
				var sOrderOperation = itemModel.MaintenanceOrderOperation;
				var sOrder = itemModel.MaintenanceOrder;
				var sOrderSubOperation = itemModel.MaintenanceOrderSubOperation;

				if (!(processingStatusCode === this.constants.dueStatusCode) || bTriggerCancelDispatchedStatusIrrespectiveOfCurrentStatus === true) {
					var oValues = {
						order: sOrder,
						orderOperation: sOrderOperation,
						orderSubOperation: "",
						action: this.constants.cancelDispatchStatusAction,
						functionCallName: "",
						functionCallStatus: this.constants.functionCallPrepared
					};

					if (sOrderSubOperation) {
						oValues.orderSubOperation = sOrderSubOperation;
						oValues.functionCallName = "/I_MaintOrderSubOperationTPUnsetdispatch";
					} else {
						oValues.functionCallName = "/I_MaintOrderOperationTPUnsetdispatch";
					}

					if (sOrderSubOperation) {
						this._itemHashMap.put([sOrder, sOrderOperation, sOrderSubOperation, this.constants.cancelDispatchStatusAction], oValues, oFragmentModel);
					} else {
						this._itemHashMap.put([sOrder, sOrderOperation, this.constants.cancelDispatchStatusAction], oValues, oFragmentModel);
					}

					// In case the due status is already set for this item, return appropriate message
				} else {
					if (sOrderSubOperation) {
						var order = sOrder + "/" + sOrderOperation + "/" + sOrderSubOperation;
					} else {
						order = sOrder + "/" + sOrderOperation;
					}
					var informationMessage = this._oResourceBundle.getText("alreadyDue", [order]);

					this._utils.addMessage(informationMessage, sap.ui.core.MessageType.Information);
				}
			},

			/**
			 * Called from Remove Constraints Button Press Action to prepare and trigger call for appropriate POST request
			 * @public
			 * @param  {object} itemModel model of operation for which the change is performed
			 * @param  {object} oFragmentModel model of the fragment
			 * @param  {object} oItemHashMap Item HashMap if supplied - optional arguement
			 */
			removeOperationConstraints: function (itemModel, oFragmentModel, oItemHashMap) {
				// Item Hash Map might be passed as e.g. from mass change pop-ups
				// In such a case, just use it
				if (oItemHashMap) {
					this._itemHashMap = oItemHashMap;
					// In case the Item Hash Map is not passed, just create a new one
					// e.g. as for the set Dispatched status case
					// Ensure it shall be a singleton
				} else if (!this._itemHashMap) {
					this._itemHashMap = new ItemHashMap();
				}
				var order;
				var sStartConstraint = itemModel.OpBscStartDateConstraintType;
				var sEndConstraint = itemModel.OpBscEndDateConstraintType;
				var sOrderOperation = itemModel.MaintenanceOrderOperation;
				var sOrder = itemModel.MaintenanceOrder;
				var sOrderSubOperation = itemModel.MaintenanceOrderSubOperation;
				var dCurrentDate = UI5Date.getInstance(0);

				if (sStartConstraint || sEndConstraint) {
					var oValues = {
						order: sOrder,
						orderOperation: sOrderOperation,
						orderSubOperation: "",
						action: this.constants.removeConstraintsAction,
						functionCallName: "/I_MaintOrderOperationTPChangescheduling",
						functionCallStatus: this.constants.functionCallPrepared,
						startConstraintDateTime: dCurrentDate
					};

					if (sOrderSubOperation) {
						this._itemHashMap.put([sOrder, sOrderOperation, sOrderSubOperation, this.constants.removeConstraintsAction], oValues, oFragmentModel);
					} else {
						this._itemHashMap.put([sOrder, sOrderOperation, this.constants.removeConstraintsAction], oValues, oFragmentModel);
					}

					// In case there is no constraint set for this item, return appropriate message
				} else {
					if (sOrderSubOperation) {
						order = sOrder + "/" + sOrderOperation + "/" + sOrderSubOperation;
					} else {
						order = sOrder + "/" + sOrderOperation;
					}
					var sInformationMessage = this._oResourceBundle.getText("alreadyWithoutConstraints", [order]);

					this._utils.addMessage(sInformationMessage, sap.ui.core.MessageType.Information);
				}
			},

			triggerBackendCall: function (bDeferRequest, sGroupId) {
				//it might be for none of the operations status can be set e.g. due to validation errors on selection
				// like in process status or cross order relationships
				//Therefore for such operations the functoins setOperationDispatchStatus/cancelOperationDispatchStatus
				// will not be called. Hence itemHashMap might not be initialized
				if (this._itemHashMap) {
					// If Item Hashmap has at least one item, trigger the backend calls
					if (this._itemHashMap.getNumberOfMassChangeObjects() !== 0) {
						this._itemHashMap.triggerBackendCall(sGroupId, this.constants.sAfterMassChangesPerformedInStatusCommon, bDeferRequest);
					}
				}
			},
			/**
			 * Triggers finalizing actions after mass change of Set/Cancel Dispatch Status
			 * e.g. for updating the status column in operation table
			 * @public
			 * @param  {string} sChannel Channel value
			 * @param  {string} sCaller Caller value
			 * @param  {object} oRefreshParametersOfSourceApp refresh parameters value
			 */
			onFinalizeStatusMassChange: function (sChannel, sCaller, oRefreshParametersOfSourceApp) {
				this._itemHashMap = null;
				this._oEventBus.publish(this.constants.sLibraryChannel, this._sAfterStatusChangesFinalizedSourceApp, oRefreshParametersOfSourceApp);
			},

			/**
			 * To Return ItemHashMap Object which contains map of order, operation, processing status and other key value pair
			 * @returns {Object} ItemHashMap Object
			 */
			getItemHashMap: function () {
				return this._itemHashMap;
			},

			destructor: function () {
				this._oResourceBundle = null;
				this._oEventBus.unsubscribe(
					this.constants.sLibraryChannel,
					this.constants.sAfterMassChangesPerformedInStatusCommon,
					this.onFinalizeStatusMassChange,
					this
				);
				this._sAfterStatusChangesFinalizedSourceApp = null;
			}
		});
	}
);
