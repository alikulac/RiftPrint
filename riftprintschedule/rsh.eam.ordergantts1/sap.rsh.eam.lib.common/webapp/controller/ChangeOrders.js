/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * Code Coverage: Comment Change Orders Logic
 * Controller for the Change Operations popup fragment(ChangeOrders.fragment.xml)
 * Hook methods of view life cycle can be imeplemented for fragment life cycle.
 * @author: D053364
 * @name sap.rsh.eam.lib.common.controller.MyDialogDelegate
 */
/*sap.ui.define([
			"sap/rsh/eam/lib/common/controller/MassChangeCommon",
			"sap/rsh/eam/lib/common/controller/BaseDelegate",
			"sap/ui/model/json/JSONModel",
			"sap/rsh/eam/lib/common/formatters/formatter",
			"sap/rsh/eam/lib/common/utils/Constants",
			"sap/rsh/eam/lib/common/utils/utils",
			"sap/rsh/eam/lib/common/utils/ItemHashMap"
		], function (MassChangeCommon, BaseDelegate, JSONModel, Formatter, Constants, Utils, ItemHashMap) {
			"use strict";
			return MassChangeCommon.extend("sap.rsh.eam.lib.common.controller.MyDialogDelegate", {
						formatter: Formatter,
						constants: Constants,
						_oView: null,
						_oMessagePopoverModel: null,
						_sFragmentName: "sap.rsh.eam.lib.common.view.ChangeOrders",
						utils: Utils,
						_itemHashMap: null,
						_oEventBus: sap.ui.getCore().getEventBus(),

						/**
						 * Fragment Initialization method
						 * 
						onInit: function () {
							this._oFragment = this.getFragment();
							this.dateMessagePopUpModel = new JSONModel();
							//var oEventBus = sap.ui.getCore().getEventBus();
							this._oEventBus.subscribeOnce(Constants.sLibraryChannel, Constants.sAllMassChangesPerformed, this.onFinalizeMassChange,
								this);
							this._itemHashMap = new ItemHashMap();
						},*/

/**
						 * called on intial display of mass change dialog
						 * @public
						 * @param {object} [oEvent] oevent object
						 * @param {object} [oView]  view object
						 * @param {object} [oMessagePopoverModel] message model of information popover
						 
						setContentToFragment: function (oEvent, oView, oMessagePopoverModel) {

							this.informationPopUp = [];
							this.messageLength = new JSONModel();
							this._oFragment.setModel(this.messageLength, "messages");
							this.dateInformationPopUp = [];
							this.dateMessageLength = new JSONModel();
							this._oFragment.setModel(this.dateMessageLength, "dateMessages");
							if (sap.ui.Device.system.phone) {
								this._oFragment.setStretch(true);
							}

							this._oView = oView;
							this._oMessagePopoverModel = oMessagePopoverModel;

							this._oView.addDependent(this._oFragment);
							this._oFragment.open();

							var i;
							var aSelectedObjects = [];
							var aSelected = this._oView.byId("orderTable").getSelectedItems();
							for (i = 0; i < aSelected.length; i++) {
								aSelectedObjects.push(aSelected[i].getBindingContext().getObject());
							}
							var selectedItemsModel = new JSONModel(aSelectedObjects);
							this.byId("idSelectedItemsTable").setModel(selectedItemsModel, "selectedItemsModel");
							var hasRestriction = this.byId("idSelectedItemsTable").getModel("selectedItemsModel").getData()[0].HasScheduleRestriction;
							if (hasRestriction === "") {
								this._oFragment.getContent()[0].getFormContainers()[2].getFormElements()[0].getFields()[0].setEnabled(false);
							} else {
								this._oFragment.getContent()[0].getFormContainers()[2].getFormElements()[0].getFields()[0].setEnabled(true);

							}
							// Set min and max possible dates for the date picker

							var minAllowedDate = new Date();
							var datePickerStart = this.byId("idStartDatePicker");
							var datePickerEnd = this.byId("idEndDatePicker");

							datePickerStart.setMinDate(minAllowedDate);

							datePickerEnd.setMinDate(minAllowedDate);
						},*/

/**
 * to check change button enablement
 * shall be called after each change of any action in the popup
 * @public
 */
/*	checkChangeButtonEnabled: function() {

								var sStartDate = this.byId("idStartDatePicker").getValue();
								var sEndDate = this.byId("idEndDatePicker").getValue();

								if ((sStartDate === 0 && sEndDate === 0) ||
									(this.byId("idStartDatePicker").getValueState() === "Error" || this.byId("idEndDatePicker").getValueState() === "Error")) {
									this.byId("idChangeButton").setEnabled(false);
									this.byId("idChangeButton").setType("Default");
								} else {
									this.byId("idChangeButton").setEnabled(true);
									this.byId("idChangeButton").setType("Transparent");
								}
							},*/

/**
						 * Called on Click of reset button in mass change dialog
						 * @public
						 * @param {object} [oEvent] event object
						
						onResetMassChangeOrders: function () {
							var i;

							var aSelectedObjects = [];
							var aSelected = this._oView.byId("orderTable").getSelectedItems();
							for (i = 0; i < aSelected.length; i++) {
								aSelectedObjects.push(aSelected[i].getBindingContext().getObject());
							}
							var selectedItemsModel = new JSONModel(aSelectedObjects);
							this.byId("idSelectedItemsTable").setModel(selectedItemsModel, "selectedItemsModel");

							this.byId("idStartDatePicker").setValueState(sap.ui.core.ValueState.None);
							this.byId("idStartDatePicker").setValue(null);
							this.byId("idEndDatePicker").setValue(null);
							this.byId("idEndDatePicker").setValueState(sap.ui.core.ValueState.None);
						}, */

/**
						 * Called to remove the operations from the table in Mass Change Dialog
						 * @public
						 * @param {object} [oEvent] event object
						 
						deleteMassChangeRowsOrders: function (oEvent) {

							var sParameterName = "listItem";
							var sItemTableName = "idSelectedItemsTable";
							var sItemModelName = "selectedItemsModel";
							var sPath = oEvent.getParameter(sParameterName).getBindingContextPath();

							this.deleteMassChangeRows(sPath, sParameterName, sItemTableName, this.constants.orderMassChange, sItemModelName);

						},*/

/**
 * Function that is called on press of change button inside the mass change dialog
 * @public
 */
/*onMassChange: function() {
							var selectedItems = this.byId("idSelectedItemsTable").getItems();
							var oTableData = this.byId("idSelectedItemsTable").getModel("selectedItemsModel").getData();
							var i;
							var startDate = this.byId("idStartDatePicker").getValue();
							var endDate = this.byId("idEndDatePicker").getValue();

							var oFragmentModel = this._oFragment.getModel();
							var oResourceBundle = this._oErrorHandler.getModel("i18n").getResourceBundle();

							for (i = 0; i < selectedItems.length; i++) {
								// If the date has changed, trigger change
								if (startDate !== "" && endDate !== "") {
									startDate = this.utils.getAdjustedDate(startDate);
									endDate = this.utils.getAdjustedDate(endDate);

									this.scheduleOrderBasedOnDateChange(startDate, endDate, oTableData[i], oFragmentModel, oResourceBundle, this._oErrorHandler, this
										.informationPopUp,
										this._oMessagePopoverModel, this.messageLength);

								}

							}
							// If Item Hashmap has at least one item, trigger the backend calls 
							if (this._itemHashMap.getNumberOfMassChangeObjects() !== 0) {
								// Now trigger the function calls of the mass change in the backend
								var sGroupId = "massChange";
								this._itemHashMap.triggerBackendCall(sGroupId);
								// If Item Hashmap is empty, show footer with messages and close the fragment
							} else {
								this.onFinalizeMassChange();
							}
						},*/

/**
						 * called from mass change action to trigger operation rescheduling
						 * @public
						 * @param {string} [date] new start date of operation
						 * @param {object} [itemModel] model of operation for which the change is performed
						 * @param {object} [oFragmentModel] model of the fragment
						 
						scheduleOrderBasedOnDateChange: function (date, itemModel, oFragmentModel) {

							var aOrderOperation = itemModel.MaintenanceOrderOperation;
							var aOrder = itemModel.MaintenanceOrder;

							var oValues = {
								order: aOrder,
								orderOperation: aOrderOperation,
								action: this.constants.schedulingOperationAction,
								functionCallName: "/I_MaintOrderOperationTPChangescheduling",
								functionCallStatus: this.constants.functionCallPrepared,
								date: date

							};

							this._itemHashMap.put([aOrder, aOrderOperation, this.constants.schedulingOperationAction], oValues, oFragmentModel);
						},*/

/**
						 * called on change of Basic End Date field in mass change Dialog for Orders, validates the logic for correct date
						 * @public
						 * @param {object} [oEvent] oevent object
						
						validateMustEndDate: function (oEvent) {
							var datePickerStart = this.byId("idStartDatePicker").getValue();
							var datePickerEnd = this.byId("idEndDatePicker").getValue();
							if (datePickerEnd >= datePickerStart) {
								this.validateMustStartDate(oEvent);
							} else {
								oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
								//this.checkChangeButtonEnabled();
							}
						}, */

/**
						 * called on change of Basic Start Date field in mass change Dialog for Orders, validates the logic for correct date
						 * @public
						 * @param {object} [oEvent] oevent object
			
						validateMustStartDate: function (oEvent) {

							var datePicker = oEvent.getSource();
							// Because the validation of start date can also be triggered from operation deletion
							// the valid event might be undefined
							if (oEvent.getParameter("valid") !== undefined) {
								if (oEvent.getParameter("valid")) {
									datePicker.setValueState(sap.ui.core.ValueState.None);
								} else {
									datePicker.setValueState(sap.ui.core.ValueState.Error);
								}
							}

							var date = oEvent.getSource().getValue();
							if (date === "") {
								this.validateMustStartTime(oEvent);
								oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
							} else {

								this.dateInformationPopUp = [];
								this.dateMessageLength = new JSONModel();
								this._oFragment.setModel(this.dateMessageLength, "dateMessages");

							}
							//	this.checkChangeButtonEnabled();
						}, */

/**
			 * Triggers finalizing actions after either 
			 *  a) all mass change actions are performed or
			 *  b) no mass change action to be performed e.g. if new work center is equal
			 *     of current work center of all operations in mass change dialog
			 * @public 
			 
			onFinalizeMassChange: function () {
				this.onCloseDialog();
				this._oEventBus.publish(Constants.sLibraryChannel, Constants.sAfterMassChangeFinalized);
			}
		});
	}

);*/
