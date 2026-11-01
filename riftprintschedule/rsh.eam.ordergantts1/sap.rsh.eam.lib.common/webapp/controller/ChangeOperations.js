/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * Controller for the Change Operations popup fragment(ChangeOperations.fragment.xml)
 * Hook methods of view life cycle can be imeplemented for fragment life cycle.
 * @author: D053364
 * @name sap.rsh.eam.lib.common.controller.MyDialogDelegate
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/controller/MassChangeCommon",
		"sap/ui/model/json/JSONModel",
		"sap/rsh/eam/lib/common/formatters/formatter",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/rsh/eam/lib/common/utils/ItemHashMap",
		"sap/ui/model/Sorter",
		"sap/ui/core/date/UI5Date"
	],
	function (MassChangeCommon, JSONModel, Formatter, Constants, Utils, ItemHashMap, Sorter, UI5Date) {
		"use strict";

		var oController;

		oController = MassChangeCommon.extend("sap.rsh.eam.lib.common.controller.MyDialogDelegate", {
			formatter: Formatter,
			constants: Constants,
			_oView: null,
			_oMessagePopoverModel: null,
			_sFragmentName: "sap.rsh.eam.lib.common.view.ChangeOperations",
			utils: Utils,
			_itemHashMap: null,
			statusCommon: null,
			_oEventBus: sap.ui.getCore().getEventBus(),
			_oResourceModel: null,
			_oViewName: null,
			_sAfterMassChangesPerformedInChangeOperations: Constants.sAfterMassChangesPerformedInChangeOperations,
			_oCurrentTimePeriod: null,

			constructor: function (oComponent) {
				MassChangeCommon.prototype.constructor.apply(this, arguments);
				this._oComponent = oComponent;
				this._sFragmentId = "";
				if (this._oComponent) {
					this._sFragmentId = this._oComponent.createId("idChangeOperationsDialogFragment");
				}
				this._oFragment = this.getFragment(this._sFragmentId);
			},

			onInit: function () {
				this.dateMessagePopUpModel = new JSONModel();
				this._oEventBus.subscribeOnce(
					Constants.sLibraryChannel,
					Constants.sAfterMassChangesPerformedInChangeOperations,
					this.onFinalizeMassChange,
					this
				);
				this._oResourceModel = sap.ui.getCore().getLibraryResourceBundle("sap.rsh.eam.lib.common");
				this._itemHashMap = new ItemHashMap();

				this._oUIElementState = new JSONModel();
				this._oTableData = new JSONModel();

				this._iInitalSubOpCount = 0;
				this._aInitialDataSet = undefined;

				// Create a resource bundle for language specific texts
				var oResourceModel = new sap.ui.model.resource.ResourceModel({
					bundleName: "sap.rsh.eam.lib.common.messagebundle"
				});

				// Assign the model object to the SAPUI5 core using the name "i18nLib"
				this._oFragment.setModel(oResourceModel, "i18nLib");
				this._oFragment.setModel(this._oUIElementState, "UIElementState");
			},

			/**
			 * called on intial display of mass change dialog
			 * @public
			 * @param {object} [oEvent] oevent object
			 * @param {object} [oComponent] component object
			 * @param {object} [oView] source view
			 * @param {object} [oStatusCommon] optional parm - status common instance in case already initialized
			 * @param {object} [oDate] optional parm - date value
			 * @param {object} [oShape] operation shape - for binding operation if change dialog is triggered from shape context menu
			 * @param {Boolean} [bDeferRequest] - Enable deferring of change/ POST request in order to submit POST and GET together
			 */
			setContentToFragment: function (oEvent, oComponent, oView, oStatusCommon, oDate, oShape, bDeferRequest) {
				this.statusCommon = oStatusCommon;
				this._oView = oView;
				this._oViewName = this._oView.getProperty("viewName");
				this._oView.addDependent(this._oFragment);
				this._oCurrentTimePeriod = oDate;
				this._bDeferRequest = bDeferRequest;

				//Show Dialog as Full Screen on phone devices
				if (sap.ui.Device.system.phone) {
					this._oFragment.setStretch(true);
				}

				//Disable the just clicked change button to prevent user from clicking several time in a row
				this._oButton = oEvent.getSource();
				this._oButton.setEnabled(false);

				this._oFragment.getModel().attachBatchRequestCompleted(this.onBatchRequestComplete, this);

				this._setDefaultUIState();

				var aSorters = [];
				aSorters.push(new Sorter("Plant"));
				aSorters.push(new Sorter("WorkCenter"));

				var workCenterName = this.byId("idWorkCenterName");
				var that = this;
				workCenterName.bindItems({
					path: "/C_RSHEditWorkCenterVH",
					sorter: aSorters,
					template: new sap.ui.core.ListItem({
						text: {
							parts: ["WorkCenter", "Plant", "UIElementState>/bNeedPlantInfo"],
							formatter: this.formatWorkCenterSelect.bind(this)
						},
						key: "{WorkCenterInternalID}"
					}),
					events: {
						dataReceived: function (dataReceivedEvent) {
							var aReceivedData = dataReceivedEvent.getParameter("data");
							if (Utils.checkDifferentPlantPresent(aReceivedData.results)) {
								that._oUIElementState.setProperty("/bNeedPlantInfo", true);
							}
						}
					}
				});

				var actionDescription = this.byId("idActionDescription");
				actionDescription.bindItems({
					path: "/C_RSHEditDispatchOptionVH",
					template: new sap.ui.core.ListItem({
						text: "{ActionDescription}",
						key: "{Action}"
					})
				});

				var i,
					nSubOpCount = 0;
				var aSelected = [],
					sOpShapePath,
					itemModel;
				this._aInitialDataSet = [];
				var aData = [];
				var bSchedulingBoardApp = this._oViewName.indexOf("rsh.eam.ordergantts1") !== -1;
				if (bSchedulingBoardApp) {
					if (oShape && oEvent.getSource().getId().includes("idButtonChangeAction")) {
						this._oShapeForContextMenu = oShape;
						//In case triggered from Shape Context Menu
						if (!this._oShapeForContextMenu.getSelected()) {
							aSelected.push(oShape.getBindingContext());
							sOpShapePath = oShape.getBindingContext().getPath();
							itemModel = oView.getModel().getData(sOpShapePath);

							//Proceed only if no error or has cross order releation for the current operation
							if (itemModel.HasError === "" && itemModel.OrderOperationRowLevel === 1) {
								// Row Highlight set to 'None' by default
								itemModel.Highlight = "None";
								if (itemModel.MaintenanceOrderSubOperation !== "") {
									//Has Sub Operation
									nSubOpCount++;
								}
								aData.push(itemModel);
								this._aInitialDataSet.push(itemModel);
							}
						} else {
							var aSelectedShapes = oView.byId("idOrderGanttChartWithTable").getSelectedShapeUid();
							for (var j = 0; j < aSelectedShapes.length; j++) {
								sOpShapePath = sap.gantt.misc.Utility.parseUid(aSelectedShapes[j]).shapeDataName;
								//If selected shape is not Order/Operation shape
								if (sOpShapePath.indexOf("C_RSHOrdersAndOperations") !== -1) {
									itemModel = oView.getModel().getData(sOpShapePath);
									aSelected.push(itemModel);
									//Proceed only if no error or has cross order releation for the current operation
									if (itemModel.HasError === "" && itemModel.OrderOperationRowLevel === 1) {
										// Row Highlight set to 'None' by default
										itemModel.Highlight = "None";
										if (itemModel.MaintenanceOrderSubOperation !== "") {
											//Has Sub Operation
											nSubOpCount++;
										}
										if (Utils.checkIfOperationIsWithinTimePeriod(itemModel, this._oCurrentTimePeriod)) {
											continue;
										}
										aData.push(itemModel);
										this._aInitialDataSet.push(itemModel);
									}
								}
							}
						}
					} else {
						//if triggered from toolbar button
						var oTreeTable = this._oView.byId("idOrderTreeTable");

						// All selection related actions shall be performed via the MultiSelectionPlugin
						var oMultiSelectionPlugin = oTreeTable.getPlugins();
						var selectedRowIndices = oMultiSelectionPlugin[0].getSelectedIndices();

						// var tableRowsArray = oTreeTable.getRows();
						for (i = 0; i < selectedRowIndices.length; i++) {
							aSelected.push(oTreeTable.getContextByIndex(selectedRowIndices[i]));
						}

						for (i = 0; i < aSelected.length; i++) {
							//put only the operations having no errors to the list in the mass change popup and sort out order headers
							// e.g. operations in process and having cross order relationships are excluded from mass change
							itemModel = aSelected[i].getObject();
							if (itemModel.HasError === "" && itemModel.OrderOperationRowLevel === 1) {
								// Row Highlight set to 'None' by default
								itemModel.Highlight = "None";
								if (itemModel.MaintenanceOrderSubOperation !== "") {
									//Has Sub Operation
									nSubOpCount++;
								}
								if (Utils.checkIfOperationIsWithinTimePeriod(itemModel, this._oCurrentTimePeriod)) {
									continue;
								}
								aData.push(itemModel);
								this._aInitialDataSet.push(itemModel);
							}
						}
					}
				} else if (this._oViewName === this.constants.sDetailsOperationViewName || this._oViewName === this.constants.sTestAppReuseLib) {
					aSelected = this._oView.byId("operationsTable").getSelectedItems();
					for (i = 0; i < aSelected.length; i++) {
						//put only the operations having no errors to the list in the mass change popup
						// e.g. operations in process and having cross order relationships are excluded from mass change
						itemModel = aSelected[i].getBindingContext().getObject();
						if (itemModel.HasError === "") {
							// Row Highlight set to 'None' by default
							itemModel.Highlight = "None";
							if (itemModel.MaintenanceOrderSubOperation !== "") {
								//Has Sub Operation
								nSubOpCount++;
							}
							aData.push(itemModel);
							this._aInitialDataSet.push(itemModel);
						}
					}
				}
				this._iInitalSubOpCount = nSubOpCount;
				var bAllOperationHasSubOp = nSubOpCount === this._aInitialDataSet.length;
				if (!bAllOperationHasSubOp) {
					this._oUIElementState.setProperty("/bDateChangeAllowed", true);
				}

				this._oTableData.setData(aData);
				this.byId("idSelectedItemsTable").setModel(this._oTableData, "selectedItemsModel");
			},

			_setDefaultUIState: function () {
				var oDefaultUIState = {
					bNeedPlantInfo: false,
					dOperationMustStart: null,
					dMustStartMinDateTime: UI5Date.getInstance(),
					bDateChangeAllowed: false,
					sMustStartValueStateText: "",
					sMustStartValueState: "None",
					sWorkCenterSelectedKey: "00000000",
					sWorkCenterValueStateText: "",
					sWorkCenterValueState: "None",
					sActionSelectedKey: "",
					sActionValueStateText: "",
					sActionValueState: "None",
					bEnableChange: false,
					bEnableReset: false,
					sChangeButtonType: "Default"
				};
				this._oUIElementState.setData(oDefaultUIState);
			},

			_resetAndDisableMustStart: function () {
				this._oUIElementState.setProperty("/dOperationMustStart", null);
				this._oUIElementState.setProperty("/sMustStartValueStateText", "");
				this._oUIElementState.setProperty("/sMustStartValueState", "None");
				this._oUIElementState.setProperty("/bDateChangeAllowed", false);
			},

			onBatchRequestComplete: function (oEvent) {
				// First check that this is just on the filter request -
				var oRequests = oEvent.getParameter("requests");
				var isFilterRequest =
					oRequests &&
					oRequests.length > 0 &&
					oRequests[0].url.startsWith("C_RSHEditWorkCenterVH") &&
					oRequests[1].url.startsWith("C_RSHEditDispatchOptionVH");

				// We want to show the change popup only after the binding is completed
				// Otherwise the popup opens with an empty white screen with data loaded async
				// and doing e.g. date change and pressing change very quickly causes function import error
				if (isFilterRequest && !this._oFragment.isOpen()) {
					this._oFragment.open();

					// Deregister this event - no more is it needed
					this._oFragment.getModel().detachBatchRequestCompleted(this.onBatchRequestComplete, this);
				}
				//Make sure Button is enabled again
				this._oButton.setEnabled(true);
			},

			onResetMassChange: function () {
				var aClonedDataSet = structuredClone(this._aInitialDataSet);
				var bIsPlantInfoNeeded = this._oUIElementState.getProperty("/bNeedPlantInfo");

				this._oTableData.setData(aClonedDataSet);
				this._setDefaultUIState();
				this._oUIElementState.setProperty("/bNeedPlantInfo", bIsPlantInfoNeeded);

				var bAllOperationHasSubOp = this._iInitalSubOpCount === this._aInitialDataSet.length;
				if (!bAllOperationHasSubOp) {
					this._oUIElementState.setProperty("/bDateChangeAllowed", true);
				}
			},

			deleteMassChangeRowsOperations: function (oEvent) {
				var sParameterName = "listItem";
				var sItemTableName = "idSelectedItemsTable";
				var sItemModelName = "selectedItemsModel";
				var sPath = oEvent.getParameter(sParameterName).getBindingContextPath();

				if (!this.deleteMassChangeRows(sPath, sParameterName, sItemTableName, this.constants.operationMassChange, sItemModelName)) {
					return;
				}

				//Checking for SubOperations after deletion of the record
				var oSelectedTableData = this._oTableData.getData();
				var iSubOpCount = 0;
				for (var i = 0; i < oSelectedTableData.length; i++) {
					if (oSelectedTableData[i].MaintenanceOrderSubOperation !== "") {
						//Has Sub Operation
						iSubOpCount++;
					}
				}

				var bAllOperationHasSubOp = iSubOpCount === oSelectedTableData.length;
				if (bAllOperationHasSubOp) {
					this._resetAndDisableMustStart();
				}

				//Calling the error handling to reset the warnings based on the fields disabled/rows deleted
				this.errorHandlingDateAndWorkCenterChange();

				this._oUIElementState.setProperty("/bEnableReset", true);
			},

			onMassChange: function (oEvent) {
				// Disable change button and set busy indicator to avoid the user
				// triggeres mass change multiple times if mass change takes too long
				this._oUIElementState.setProperty("/bEnableChange", false);
				this._oFragment.setBusy(true);
				var aOperations = this.byId("idSelectedItemsTable").getItems();
				var oTableData = this._oTableData.getData();
				//Sort the table data by sub operations first and then main operations.
				if (oTableData) {
					oTableData.sort(function (opr1, opr2) {
						if (parseInt(opr1.MaintenanceOrder, 10) === parseInt(opr2.MaintenanceOrder, 10)) {
							return opr1.MaintenanceOrderSubOperation ? -1 : 0;
						}
						return parseInt(opr1.MaintenanceOrder, 10) - parseInt(opr2.MaintenanceOrder, 10);
					});
				}
				var bWorkCenterChange = this._oUIElementState.getProperty("/sWorkCenterSelectedKey") !== "00000000";
				if (bWorkCenterChange) {
					var sNewWorkCenter = this.byId("idWorkCenterName").getSelectedItem().getBindingContext().getObject().WorkCenter;
					var sNewPlant = this.byId("idWorkCenterName").getSelectedItem().getBindingContext().getObject().Plant;
				}

				var sSelectedActionKey = this._oUIElementState.getProperty("/sActionSelectedKey");
				var bMustStartChanged = !!this._oUIElementState.getProperty("/dOperationMustStart");
				var dNewStart = this._oUIElementState.getProperty("/dOperationMustStart");

				var oFragmentModel = this._oFragment.getModel();

				for (var i = 0; i < aOperations.length; i++) {
					var sMaintSubOp = oTableData[i].MaintenanceOrderSubOperation;
					var bTriggerSetDispatchedStatusIrrespectiveOfCurrentStatus = false;
					var bTriggerCancelDispatchedStatusIrrespectiveOfCurrentStatus = false;

					//first of all check the current item has no error as per validation results
					//if it is the case, don't consider such item for the further processing
					if (oTableData[i].HasError === "X") {
						continue;
					}

					/////////////////////////////////////////////////////////////////////////////////////////////////////////
					//Date Change block
					/////////////////////////////////////////////////////////////////////////////////////////////////////////
					if (bMustStartChanged) {
						var dPlannedStart = oTableData[i].OrderOperationStartDateTime;
						var bIsDateDifferent = dPlannedStart.getTime() !== dNewStart.getTime();
						if (bIsDateDifferent) {
							if (!sMaintSubOp) {
								this.scheduleOperationBasedOnDateChange(oTableData[i], oFragmentModel, null, dNewStart);
								// If date is changed and set dispatch is selected, dispatch action has to be triggered for all operations irrespectively
								//whether they currently have dispatched status
								//Reason: date change implicitely canceles disatched status so if we don't do it will become due
								bTriggerSetDispatchedStatusIrrespectiveOfCurrentStatus = true;
							}
						} else {
							// If the new date AND the time are equal as the currently existing for this operation
							// cancel dispatch action has to be triggered explicitly because this is not implicitly done by date change action
							bTriggerCancelDispatchedStatusIrrespectiveOfCurrentStatus = true;
						}
					}
					/////////////////////////////////////////////////////////////////////////////////////////////////////////
					//Work Center change block
					/////////////////////////////////////////////////////////////////////////////////////////////////////////
					//if work center has changed, trigger work center reassignment
					if (bWorkCenterChange) {
						if (sNewWorkCenter !== oTableData[i].WorkCenter || sNewPlant !== oTableData[i].Plant) {
							this.reassignOperationToDifferentWorkCenter(oTableData[i], sNewWorkCenter, sNewPlant, oFragmentModel);
							// If change work center is selected and set dispatch is selected, dispatch action has to be triggered for all operations irrespectively
							//whether they currently have dispatched status
							//Reason: work center change implicitely canceles disatched status so if we don't do it will become due
							bTriggerSetDispatchedStatusIrrespectiveOfCurrentStatus = true;
						} else {
							// If the new work center is equal as the currently assigned work center for this operation AND the current operation status is NOT Due
							// cancel dispatch action has to be triggered explicitly because this is not implicitly done by work center change action
							if (oTableData[i].ProcessingStatus !== this.constants.dueStatusCode) {
								bTriggerCancelDispatchedStatusIrrespectiveOfCurrentStatus = true;
							}
						}
					}

					/////////////////////////////////////////////////////////////////////////////////////////////////////////
					// Set Dispatched status block
					/////////////////////////////////////////////////////////////////////////////////////////////////////////
					// If trigger dispatch was selected
					if (sSelectedActionKey === oController.actions.Dispatch) {
						this.statusCommon.setOperationDispatchStatus(
							oTableData[i],
							oFragmentModel,
							bTriggerSetDispatchedStatusIrrespectiveOfCurrentStatus,
							this._itemHashMap
						);
					}

					/////////////////////////////////////////////////////////////////////////////////////////////////////////
					//Cancel dispatch block
					/////////////////////////////////////////////////////////////////////////////////////////////////////////
					// If cancel dispatch was selected
					if (sSelectedActionKey === oController.actions.CancelDispatch) {
						// For set cancel, Action to be triggered only when only (date AND time) are the same OR work center is the same as currently for this operation the case.
						// Otherwise date change action OR work center change action will implicitly cancel dispatched status
						this.statusCommon.cancelOperationDispatchStatus(
							oTableData[i],
							oFragmentModel,
							bTriggerCancelDispatchedStatusIrrespectiveOfCurrentStatus,
							this._itemHashMap
						);
					}
				}
				//end of operation loop

				// Error handling some (sub)operations are already assigned to the new work center
				this.errorHandlingOperAlreadyHavingNewWorkCenter(oTableData);

				// If Item Hashmap has at least one item, trigger the backend calls
				if (this._itemHashMap.getNumberOfMassChangeObjects() !== 0) {
					// Now trigger the function calls of the mass change in the backend
					var sGroupId = "massChange";
					this._itemHashMap.triggerBackendCall(sGroupId, Constants.sAfterMassChangesPerformedInChangeOperations, this._bDeferRequest);
					if (this._bDeferRequest) {
						this._publishMassChangeEvent(sGroupId);
					}
				} else {
					// If Item Hashmap is empty, we can just do the same as when cancel button is pressed
					this.onCloseDialog();
				}
				//Accessibility - putting lost focus back at Change button
				setTimeout(
					function () {
						this._oButton.focus();
					}.bind(this),
					0
				);
			},

			/**
			 * called from mass change action to handle the case operations already have the new work center
			 * @public
			 * @param {object} [oOperationsData] operations list of mass change popup
			 */
			errorHandlingOperAlreadyHavingNewWorkCenter: function (oOperationsData) {
				var numberOfOperations = oOperationsData.length;
				var infoMessageDispatch;

				var iNumberOfWorkCenterMassChangeObjects = this._itemHashMap.getNumberOfWorkCenterMassChangeObjects();
				var bWorkCenterChange = this._oUIElementState.getProperty("/sWorkCenterSelectedKey") !== "00000000";

				// If there is at least one work center mass change object and there work center action was indeed triggered
				if (iNumberOfWorkCenterMassChangeObjects !== numberOfOperations && bWorkCenterChange) {
					// If there is only one item in the mass change popup, show specific message
					if (numberOfOperations === 1) {
						var sFirstOperation = oOperationsData[0].MaintenanceOrderOperation;
						var sFirstOrder = oOperationsData[0].MaintenanceOrder;
						var sFirstSubOperation = oOperationsData[0].MaintenanceOrderSubOperation;
						if (sFirstSubOperation) {
							infoMessageDispatch = this._oResourceModel.getText("errorWorkCenterSubOp", [sFirstOrder, sFirstOperation, sFirstSubOperation]);
						} else {
							infoMessageDispatch = this._oResourceModel.getText("errorWorkCenterOp", [sFirstOrder, sFirstOperation]);
						}
						// If there are multiple items in the mass change popup, show one general message for all
					} else {
						infoMessageDispatch = this._oResourceModel.getText("errorWorkCenter");
					}
				}

				if (infoMessageDispatch) {
					this.utils.addMessage(infoMessageDispatch, sap.ui.core.MessageType.Information);
				}
			},

			onChangeWorkCenter: function (oEvent) {
				this.errorHandlingDateAndWorkCenterChange();
				this.checkChangeRestoreButtonEnabled();
			},

			onChangeStatus: function (oEvent) {
				this.errorHandlingDateAndWorkCenterChange();
				this.checkChangeRestoreButtonEnabled();
			},

			onChangeMustStart: function (oEvent) {
				if (oEvent.getSource().isValidValue()) {
					this._oUIElementState.setProperty("/sMustStartValueState", "None");
					this._oUIElementState.setProperty("/sMustStartValueStateText", "");
				} else {
					this._oUIElementState.setProperty("/sMustStartValueState", "Error");
					this._oUIElementState.setProperty("/sMustStartValueStateText", this._oResourceModel.getText("ErrorMessageEditDateInvalidDateErr"));
				}
				this.errorHandlingDateAndWorkCenterChange();
				this.checkChangeRestoreButtonEnabled();
			},

			checkChangeRestoreButtonEnabled: function () {
				var bWorkCenterChanged = this._oUIElementState.getProperty("/sWorkCenterSelectedKey") !== "00000000";
				var bActionChanged = this._oUIElementState.getProperty("/sActionSelectedKey") !== "";
				var bDateHasError = this._oUIElementState.getProperty("/sMustStartValueState") === "Error";
				var bMustStartChanged = !!this._oUIElementState.getProperty("/dOperationMustStart");

				if ((!bWorkCenterChanged && !bActionChanged && !bMustStartChanged) || bDateHasError) {
					this._oUIElementState.setProperty("/bEnableChange", false);
					this._oUIElementState.setProperty("/bEnableReset", false);
					this._oUIElementState.setProperty("/sChangeButtonType", "Default");
				} else {
					this._oUIElementState.setProperty("/bEnableChange", true);
					this._oUIElementState.setProperty("/bEnableReset", true);
					this._oUIElementState.setProperty("/sChangeButtonType", "Emphasized");
				}
			},

			// This function is called from actions in like drag&Drop in apps - should not be part of the change dialog at the end
			// Single parameters should be removed once all actions support combined object
			scheduleOperationBasedOnDateChange: function (itemModel, oFragmentModel, itemHashMap, dStartDateTime) {
				var aOrderOperation = itemModel.MaintenanceOrderOperation;
				var aOrder = itemModel.MaintenanceOrder;

				var oValues = {
					order: aOrder,
					orderOperation: aOrderOperation,
					action: this.constants.schedulingOperationAction,
					functionCallName: "/I_MaintOrderOperationTPChangescheduling",
					functionCallStatus: this.constants.functionCallPrepared,
					startConstraintDateTime: dStartDateTime
				};

				if (itemHashMap) {
					this._itemHashMap = itemHashMap;
				}

				this._itemHashMap.put([aOrder, aOrderOperation, this.constants.schedulingOperationAction], oValues, oFragmentModel);
			},

			/**
			 * called from mass change action to trigger work center reassignment of operation
			 * @public
			 * @param {object} [itemModel] model of operation for which the change is performed
			 * @param {string} [sNewWorkCenter] new work center
			 * @param {string} [sPlant] plant of the new work center
			 * @param {object} [oFragmentModel] model of the fragment
			 */
			reassignOperationToDifferentWorkCenter: function (itemModel, sNewWorkCenter, sPlant, oFragmentModel) {
				var sOrderOperation = itemModel.MaintenanceOrderOperation;
				var sOrder = itemModel.MaintenanceOrder;
				var sOrderSubOperation = itemModel.MaintenanceOrderSubOperation;
				var aPersonResp = itemModel.OperationPersonResponsible;

				var oValues = {
					order: sOrder,
					orderOperation: sOrderOperation,
					orderSubOperation: "",
					action: this.constants.workcenterAction,
					functionCallName: "",
					functionCallStatus: this.constants.functionCallPrepared,
					personResponsible: aPersonResp,
					newWorkCenter: sNewWorkCenter,
					plant: sPlant
				};

				if (sOrderSubOperation) {
					oValues.orderSubOperation = sOrderSubOperation;
					oValues.functionCallName = "/I_MaintOrderSubOperationTPChangeassgmt";
				} else {
					oValues.functionCallName = "/I_MaintOrderOperationTPChangeassgmt";
				}

				if (sOrderSubOperation) {
					this._itemHashMap.put([sOrder, sOrderOperation, sOrderSubOperation, this.constants.workcenterAction], oValues, oFragmentModel);
				} else {
					this._itemHashMap.put([sOrder, sOrderOperation, this.constants.workcenterAction], oValues, oFragmentModel);
				}
			},

			/**
			 * Triggers finalizing actions after either
			 *  a) all mass change actions are performed or
			 *  b) no mass change action to be performed e.g. if new work center is equal
			 *     of current work center of all operations in mass change dialog
			 * @public
			 * @param {string} sChannel event chanel - unused
			 * @param {string} sCaller caller - unused
			 * @param {object} oRefreshParametersOfSourceApp parameters for refreshing the app
			 */
			onFinalizeMassChange: function (sChannel, sCaller, oRefreshParametersOfSourceApp) {
				// Delay the close of the popup to when the table has been refreshed -
				// If we don't do this then the smart table loses the horizontal scroll position
				var that = this;
				var onAfterMassChangeFunction = function () {
					that.onCloseDialog();
				};
				var oRefreshParamsOfSourceApp = oRefreshParametersOfSourceApp;
				if (!oRefreshParamsOfSourceApp) {
					oRefreshParamsOfSourceApp = {};
				}
				oRefreshParamsOfSourceApp.bChangeOp = true;
				// TODO delete onAfterTableBindFn after all apps stop using it (only details left)
				oRefreshParamsOfSourceApp.onAfterTableBindFn = onAfterMassChangeFunction;

				// The reciever of this event will
				this._oEventBus.publish(Constants.sLibraryChannel, Constants.sAfterOperationMassChangeFinalized, oRefreshParamsOfSourceApp);
			},

			resetWarningsOnFields: function () {
				var bMustStartChanged = !!this._oUIElementState.getProperty("/dOperationMustStart");
				var bHasInvalidDateError = this._oUIElementState.getProperty("/sMustStartValueState") === "Error";

				this._oUIElementState.setProperty("/sActionValueState", "None");
				this._oUIElementState.setProperty("/sActionValueStateText", "");
				this._oUIElementState.setProperty("/sWorkCenterValueState", "None");
				this._oUIElementState.setProperty("/sWorkCenterValueStateText", "");
				if (!bMustStartChanged || !bHasInvalidDateError) {
					this._oUIElementState.setProperty("/sMustStartValueState", "None");
					this._oUIElementState.setProperty("/sMustStartValueStateText", "");
				}
			},

			errorHandlingDateAndWorkCenterChange: function () {
				if (this.byId("idSelectedItemsTable")) {
					var bHasDispatchedOperations = false;
					var bHasPersonResponsible = false;
					var bHasSubOp = false;
					var bHasCrossOrderRelationship = false;
					var bHasAssignedPeople = false;
					var aOperations = this._oTableData.getData();
					var bWorkCenterChanged = this._oUIElementState.getProperty("/sWorkCenterSelectedKey") !== "00000000";
					var bMustStartChanged = !!this._oUIElementState.getProperty("/dOperationMustStart");
					var bActionChanged = this._oUIElementState.getProperty("/sActionSelectedKey") !== "";
					var bNoDateOrWorkCenterChange = !bMustStartChanged && !bWorkCenterChanged;
					var oSelectedWorkCenter = this.byId("idWorkCenterName").getSelectedItem().getBindingContext().getObject();

					//Resetting the Row 'Highlight'
					for (var i = 0; i < aOperations.length; i++) {
						aOperations[i].Highlight = "None";
					}

					if (bNoDateOrWorkCenterChange) {
						this.resetWarningsOnFields();
						this._oTableData.setData(aOperations);
					} else {
						for (var i = 0; i < aOperations.length; i++) {
							var bOpWCDifferentFromSelectedWC =
								oSelectedWorkCenter.WorkCenter !== aOperations[i].WorkCenter || oSelectedWorkCenter.Plant !== aOperations[i].Plant;
							if (aOperations[i].ProcessingStatus === this.constants.dispatchedStatusCode) {
								bHasDispatchedOperations = true;
								//Highlight Information set back to the Table only if the Action Description is 'Do Not Change'
								if (!bActionChanged) {
									aOperations[i].Highlight = "Warning";
								}
							}
							if (
								aOperations[i].OperationPersonResponsible !== this.constants.idUnassignedPersonResponsible &&
								aOperations[i].OperationPersonRespName !== "" &&
								bOpWCDifferentFromSelectedWC
							) {
								bHasPersonResponsible = true;
								//Highlight Information set back to the Table
								aOperations[i].Highlight = "Warning";
							}
							if (aOperations[i].MaintenanceOrderSubOperation !== "") {
								bHasSubOp = true;
								//Highlight Information set back to the Table only if the Must Start Date field is mofidified for SubOperations
								if (bMustStartChanged) {
									aOperations[i].Highlight = "Warning";
								}
							}
							if (aOperations[i].HasCrossOrderRelationship && bOpWCDifferentFromSelectedWC) {
								bHasCrossOrderRelationship = true;
								aOperations[i].Highlight = "Warning";
							}
							if (aOperations[i].ConcatenatedAssignedPersonsTxt && bOpWCDifferentFromSelectedWC) {
								bHasAssignedPeople = true;
								aOperations[i].Highlight = "Warning";
							}
						}

						this._oTableData.setData(aOperations);
						this.resetWarningsOnFields();
						var bHasNoInvalidDateError = this._oUIElementState.getProperty("/sMustStartValueState") !== "Error";

						var sWarningText = "";
						if (
							bMustStartChanged &&
							bHasNoInvalidDateError &&
							(bHasCrossOrderRelationship || bHasSubOp || bHasPersonResponsible || bHasAssignedPeople)
						) {
							sWarningText = this._getWarningText(bHasCrossOrderRelationship, bHasSubOp, bHasPersonResponsible, bHasAssignedPeople, false);
							this._oUIElementState.setProperty("/sMustStartValueState", "Warning");
							this._oUIElementState.setProperty("/sMustStartValueStateText", sWarningText);
						}

						if (bHasDispatchedOperations && this.byId("idActionDescription").getSelectedIndex() === 0) {
							sWarningText = this._oResourceModel.getText("WarningMessageChangeWorkCenterDispatchedOp");
							this._oUIElementState.setProperty("/sActionValueState", "Warning");
							this._oUIElementState.setProperty("/sActionValueStateText", sWarningText);
						}

						if (bWorkCenterChanged && (bHasCrossOrderRelationship || bHasPersonResponsible || bHasAssignedPeople)) {
							sWarningText = this._getWarningText(bHasCrossOrderRelationship, null, bHasPersonResponsible, bHasAssignedPeople, true);
							this._oUIElementState.setProperty("/sWorkCenterValueState", "Warning");
							this._oUIElementState.setProperty("/sWorkCenterValueStateText", sWarningText);
						}
					}
				}
			},

			_getWarningText: function (bHasCrossOrderRelationship, bHasSubOp, bHasPersonResponsible, bHasAssignedPeople, bTextForWorkCenterField) {
				var oTextKeys = {
					WarningMessageCrossOrderRelationshipOp: bHasCrossOrderRelationship,
					WarningMessageChangeWorkCenterPersonAssignedOp: bHasPersonResponsible,
					WCWarningOpWithAssignedPeople: bHasAssignedPeople && bTextForWorkCenterField,
					DateWarningOpWithAssignedPeople: bHasAssignedPeople && !bTextForWorkCenterField,
					ErrorMessageSubOpDateChange: bHasSubOp
				};

				var aWarningTexts = [];
				Object.keys(oTextKeys).forEach(
					function (sTextkey) {
						if (oTextKeys[sTextkey]) {
							aWarningTexts.push(this._oResourceModel.getText(sTextkey));
						}
					}.bind(this)
				);

				var sWarningText = aWarningTexts.join(" ");
				return sWarningText;
			},

			/**
			 * Called once the backend change requests are created, this publishes an event,
			 * which initimates the handler function to trigger corresponding read requests for updating changed objects
			 * @private
			 * @param {String} [sGroupId] - Group Id for the change
			 */
			_publishMassChangeEvent: function (sGroupId) {
				var oTarget = [];
				oTarget = this._itemHashMap;
				oTarget.parameters = {};
				oTarget.parameters.bRefreshOfSourceAppRequired = true;
				// TODO delete onAfterTableBindFn after all apps stop using it (only details left)
				var onAfterTableBindFn = function () {
					this.onCloseDialog();
				}.bind(this);
				oTarget.parameters.onAfterTableBindFn = onAfterTableBindFn;
				oTarget.parameters.sGroupId = sGroupId;
				this._oEventBus.publish(Constants.sLibraryChannel, Constants.sServerMessageToUpdateEntity, oTarget);
			},

			formatWorkCenterSelect: function (workCenter, plant, plantInfoNeeded) {
				if (plantInfoNeeded && plant) {
					return workCenter + " / " + plant;
				} else {
					return workCenter;
				}
			}
		});

		oController.actions = {
			Dispatch: "1",
			CancelDispatch: "2"
		};

		return oController;
	}
);
