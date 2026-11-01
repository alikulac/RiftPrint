/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/ui/base/EventProvider",
		"sap/rsh/eam/lib/common/utils/MassChangeObject",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/ui/base/Object",
		"sap/rsh/eam/lib/common/utils/utils"
	],
	function (EventProvider, MassChangeObject, Constants, UI5Object, Utils) {
		"use strict";

		return UI5Object.extend("sap/rsh/eam/lib/common/utils/ItemHashMap", {
			_itemHashMapContainer: {},
			_sAfterAllMassChangesFinalizedCaller: null,
			utils: Utils,

			constructor: function () {
				this._sAfterAllMassChangesFinalizedCaller = null;
				this._itemHashMapContainer = {};
				this._oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rsh.eam.lib.common");
				this._oEventBus = sap.ui.getCore().getEventBus();
			},

			tupleToString: function (tuple) {
				return tuple.join(",");
			},

			put: function (tuple, values, oFragmentModel) {
				this._itemHashMapContainer[this.tupleToString(tuple)] = new MassChangeObject(values, oFragmentModel);
			},

			get: function (tuple) {
				return this._itemHashMapContainer[this.tupleToString(tuple)];
			},

			// shall be done once for all mass change objects
			triggerBackendCall: function (sGroupId, sFinalEventCaller, bDeferRequest) {
				var oMassChangeObj;

				this._sAfterAllMassChangesFinalizedCaller = sFinalEventCaller;

				// Each time before executing mass change objects subscribe to the event handling
				// Reason: because once mass change objects are done, unsubscribe in displayMsgToastAfterAllMassChangesCompleted will be done to
				// ensure the unused instances are getting deleted by the garbage collector
				// If new subscribe is note done, then e.g. doing mass change and pressing dispatch button will not work as subscription will be unknown
				// pressing dispatch button
				this._oEventBus.subscribe(Constants.sLibraryChannel, Constants.sBackendCallPerformed, this.displayMsgToastAfterAllMassChangesCompleted, this);
				var aItemHashMapContainerKeys = Object.keys(this._itemHashMapContainer);
				//sort the order to execute assigning work center first and then set the dispatch for all operations
				aItemHashMapContainerKeys.sort(function (key1, key2) {
					if (key1.includes(Constants.workcenterAction) && key2.includes(Constants.workcenterAction)) {
						return 0;
					} else if (key1.includes(Constants.workcenterAction)) {
						return -1;
					} else {
						return 0;
					}
				});
				for (var i = 0; i < aItemHashMapContainerKeys.length; i++) {
					oMassChangeObj = this._itemHashMapContainer[aItemHashMapContainerKeys[i]];
					oMassChangeObj.callBackendFunction(sGroupId, bDeferRequest);
				}
			},

			/**
			 * Called for intiating message toast for success and message box for errors
			 * @public
			 */
			displayMsgToastAfterAllMassChangesCompleted: function () {
				// Loop over all MassChange objects and check whether for all
				//the backend calls are completed
				var bNotAllCompleted = false;
				var bAtLeastOneFailed = false;
				var bAtLeastOneWarning = false;
				var iCounterFailedMassChangeObjects = 0;
				var oMassChangeObj;
				var sFunctionCallStatus;

				for (var property in this._itemHashMapContainer) {
					if (this._itemHashMapContainer.hasOwnProperty(property)) {
						oMassChangeObj = this._itemHashMapContainer[property];
						sFunctionCallStatus = oMassChangeObj.getFunctionCallStatus();

						if (sFunctionCallStatus === Constants.functionCallRequested || sFunctionCallStatus === Constants.functionCallPrepared) {
							bNotAllCompleted = true;
							break;
						} else if (sFunctionCallStatus === Constants.functionCallFailed) {
							bAtLeastOneFailed = true;
							iCounterFailedMassChangeObjects++;
						} else if (sFunctionCallStatus === Constants.functionCallSuccessfulWithWarning) {
							bAtLeastOneWarning = true;
						}
					}
				}

				// If all backend calls of all MassChange objects completed, display toast message
				// and notify delegate
				if (bNotAllCompleted === false && this._itemHashMapContainer !== null) {
					//check whether all mass change objects failed
					//if all failed, no refresh of the source app (e.g. details list or Gantt) is required
					var iNumberOfMassChangeObjects = this.getNumberOfMassChangeObjects();
					var bRefreshOfSourceAppRequired = false;
					if (iCounterFailedMassChangeObjects !== iNumberOfMassChangeObjects) {
						bRefreshOfSourceAppRequired = true;
					} else {
						bRefreshOfSourceAppRequired = false;
					}

					if (!bRefreshOfSourceAppRequired) {
						// Add a new summary message to be shown as toast
						this.utils.addMessage(
							this._oResourceBundle.getText("AllErrorsMessageToast"),
							sap.ui.core.MessageType.Error,
							Constants.sDisplayTypeMessageToast
						);
					} else if (bAtLeastOneFailed === true) {
						// Add a new summary message to be shown as toast
						this.utils.addMessage(
							this._oResourceBundle.getText("AtleastOneErrorMessageToast"),
							sap.ui.core.MessageType.Error,
							Constants.sDisplayTypeMessageToast
						);
					} else if (bAtLeastOneWarning === true) {
						// Add a new warning message to be shown as toast
						this.utils.addMessage(
							this._oResourceBundle.getText("SuccessMessageWithWarningToast"),
							sap.ui.core.MessageType.Success,
							Constants.sDisplayTypeMessageToast
						);
					} else {
						// Add a new summary message to be shown as toast
						this.utils.addMessage(
							this._oResourceBundle.getText("SuccessMessageToast"),
							sap.ui.core.MessageType.Success,
							Constants.sDisplayTypeMessageToast
						);
					}

					var parameters = {
						bRefreshOfSourceAppRequired: bRefreshOfSourceAppRequired
					};

					this._oEventBus.publish(Constants.sLibraryChannel, this._sAfterAllMassChangesFinalizedCaller, parameters);

					this._sAfterAllMassChangesFinalizedCaller = null;
					// Clear the hash map buffers
					this._itemHashMapContainer = {};
					// Unsubscribe for events
					this._oEventBus.unsubscribe(
						Constants.sLibraryChannel,
						Constants.sBackendCallPerformed,
						this.displayMsgToastAfterAllMassChangesCompleted,
						this
					);
				}
			},

			getNumberOfWorkCenterMassChangeObjects: function () {
				var sAction;
				var iCountWorkCenterActions = 0;
				var oMassChangeObj;

				for (var property in this._itemHashMapContainer) {
					if (this._itemHashMapContainer.hasOwnProperty(property)) {
						oMassChangeObj = this._itemHashMapContainer[property];
						sAction = oMassChangeObj.getActionName();

						if (sAction === Constants.workcenterAction) {
							iCountWorkCenterActions++;
						}
					}
				}
				return iCountWorkCenterActions;
			},

			getNumberOfMassChangeObjects: function () {
				return Object.keys(this._itemHashMapContainer).length;
			}
		});
	}
);
