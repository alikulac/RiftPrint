/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/ui/base/ManagedObject",
		"sap/m/MessageBox",
		"sap/ui/core/Fragment",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/formatters/formatter",
		"sap/ui/model/json/JSONModel",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/ui/core/format/DateFormat",
		"sap/ui/base/Event"
	],
	function (ManagedObject, MessageBox, Fragment, Constants, Formatter, JSONModel, Utils, DateFormat, Event) {
		"use strict";

		return ManagedObject.extend("sap.rsh.eam.lib.common.controller.ChangeWorkCenterCapacity", {
			formatter: Formatter,

			constructor: function (oSIM, oContainerView) {
				this._oSIM = oSIM;
				this._oContainerView = oContainerView;
				this.controllers = oContainerView.getController().controllers; // to be replaced with base controller
				this._oReuseResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rsh.eam.lib.common");
				this._oUIElementStates = new JSONModel();
				this._oDialog = null;
				this._oModel = null;
				this._oSmartTable = null;
				this._aReceivedErrorData = [];
				this._bHasDataError = false;
				this._oDateFormatter = DateFormat.getDateInstance({
					style: "medium"
				});
				this._oCrossAppNav = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
				this._oResponseState = {};
				this._oResponseState.bSuccessfulSave = false;
				this._aWorkCenter = [];
				this.oMsgManager = new sap.ui.getCore().getMessageManager();

				//To store input fields which are in error state currently
				this._mFieldWithError = {};
			},

			/**
			 * Method to handle the Work center capacity button event
			 * opens the dialog for work center capacity change
			 * @public
			 * @param {Promise} fnOuterPromiseResolved  Outer Promise
			 **/
			invokeChangeWorkCenterCapacity: function (fnOuterPromiseResolved) {
				// When Work center capacity change is clicked the following processes begin -
				// There is a Table of Shift information shown in the dialog

				this._fnOuterPromiseResolved = fnOuterPromiseResolved;

				// First, set all JSON models to empty containers -
				this._initializeDataInModels();

				//Open the dialog
				this._openDialog();
			},

			/**
			 * Method to set all JSON models
			 * @private
			 **/
			_initializeDataInModels: function () {
				this._oUIElementStates.setData({
					sBlankSpace: " ", //Required for the Empty control for alignment
					bHasChanges: false,
					bHasDataErrors: false,
					bTargetWeekEditable: true,
					bChangeWorkCenterSupported: false,
					sWeekSelectedText: "",
					dWeekSelectionStartDate: null,
					dWeekSelectionEndDate: null,
					sTargetWeekDatePickerValueState: "None",
					sTargetWeekDatePickerValueStateText: "",
					bPrevWeekEnabled: true,
					bNextWeekEnabled: true,
					bNeedPlantInfo: false,
					bHasShiftData: true,
					sTitle: ""
				});
				this._oCrossAppNav
					.isNavigationSupported([
						{
							semanticObject: "WorkCenter",
							action: "change"
						}
					])
					.done(function (oData) {
						if (oData[0].supported) {
							//If Navigation is supported then activate the Workcenter link
							this._oUIElementStates.setProperty("/bChangeWorkCenterSupported", true);
						}
					}.bind(this));
			},

			/**
			 * Method to set the data for the Dialog defaults
			 * Setting the defaults - Week Selection to current week's start and end date
			 * @private
			 **/
			_setWorkCenterCapcityDefaults: function () {
				var oSelectedDate = new Date(); //Current Date for fetching the Current week defaults
				var sWeek = Utils.getISOWeekByDate(oSelectedDate);
				var iYear = Utils.getISOYearByDate(oSelectedDate);
				var oWeekDates = Utils.getDateOfISOWeek(sWeek, iYear);

				this._oUIElementStates.setProperty("/dWeekSelectionStartDate", oWeekDates.startDate);
				this._oUIElementStates.setProperty("/dWeekSelectionEndDate", oWeekDates.endDate);

				var sPeriodText = this._geti18nText("TargetSelectedWeekText", [
					this._oDateFormatter.format(oWeekDates.startDate),
					this._oDateFormatter.format(oWeekDates.endDate),
					sWeek
				]);

				this._oUIElementStates.setProperty("/sWeekSelectedText", sPeriodText);

				var oTargetWeekDatePicker = this._oContainerView.byId("idTargetWeekDatePicker");
				oTargetWeekDatePicker.setMinDate(oWeekDates.startDate);
			},

			_geti18nText: function (sKey, aParameters) {
				return this._oDialog.getModel("i18nLib").getResourceBundle().getText(sKey, aParameters);
			},

			/**
			 * Method to get the formatted date text based on the Week Selection
			 * @public
			 * @param {number} nDayCount Day count - 0-Day1, 1-Day2 etc.
			 * @param {string} sDateText End date
			 * @returns {string} Dates Text for the Column header
			 **/
			formatDatesTextForShift: function (nDayCount, sDateText) {
				var dFromDate = this._oUIElementStates.getProperty("/dWeekSelectionStartDate");

				var dDay = new Date(dFromDate);
				dDay.setDate(dFromDate.getDate() + parseFloat(nDayCount));
				return sDateText + " " + this._oDateFormatter.format(dDay);
			},

			/**
			 * Formatter to calculate the Total Capacity Hours
			 * @public
			 * @param {string} sOperatingHours Operating hour
			 * @param {string} sNumberOfCap Capacity
			 * @param {string} sUnit Unit
			 * @returns {string} returns Calculated capacity hours with Unit
			 **/
			formatCapHours: function (sOperatingHours, sNumberOfCap, sUnit) {
				var sNoOfCap = sNumberOfCap;
				if (sNoOfCap === null) {
					sNoOfCap = 0;
				}
				var nCalculatedCapacityHours = parseFloat(sOperatingHours).toFixed(2) * parseFloat(sNoOfCap).toFixed(2);
				// return (nCalculatedCapacityHours.toFixed(2) + " " + sUnit);
				return nCalculatedCapacityHours.toFixed(2);
			},
			hasShiftDefinitionData: function (shiftData) {
				if (shiftData) {
					return shiftData.some(function (element) {
						if (element.ShiftDefinitionName) {
							return true;
						}
						return false;
					});
				}
				return false;
			},
			/**
			 * Formatter to concatenate Work Center and Plant in work center capacity dialog
			 * @param {string} sWorkCenter Work Center Information
			 * @param {string} sPlant Performing Work Center Plant information
			 * @param {boolean} bNeedPlantInfo Need to show plant information concatenated flag
			 * @returns {string} WorkCenterDisplay concatenated string
			 */
			concatWorkCenterAndPlant: function (sWorkCenter, sPlant, bNeedPlantInfo) {
				var sWorkCenterDisplay;
				if (bNeedPlantInfo) {
					sWorkCenterDisplay = sWorkCenter + " / " + sPlant;
				} else {
					sWorkCenterDisplay = sWorkCenter;
				}
				return sWorkCenterDisplay;
			},
			selectShiftName: function (sShiftDefinition, sShiftDefinitionName) {
				if (sShiftDefinitionName) {
					return sShiftDefinitionName;
				}
				return sShiftDefinition;
			},

			/**
			 * Method to open the Fragment as Dialog
			 * @private
			 **/
			_openDialog: function () {
				var oContainerView = this._oContainerView;

				// create dialog lazily
				if (!this._oDialog) {
					// load asynchronous XML fragment
					Fragment.load({
						id: oContainerView.getId(),
						name: "sap.rsh.eam.lib.common.view.ChangeWorkCenterCapacity",
						controller: this
					}).then(
						function (oDialog) {
							this._oDialog = oDialog;
							oContainerView.addDependent(oDialog);
							// connect dialog to the root view of this component (models, lifecycle)
							this._oDialog.setModel(oContainerView.getModel());
							this._oDialog.setModel(this._oUIElementStates, "UIElementStates");

							// Create a resource bundle for language specific texts
							var oResourceModel = new sap.ui.model.resource.ResourceModel({
								bundleName: "sap.rsh.eam.lib.common.messagebundle"
							});

							// Assign the model object to the SAPUI5 core using the name "i18n"
							this._oDialog.setModel(oResourceModel, "i18nLib");

							if (sap.ui.Device.system.desktop) {
								this._oDialog.setStretch(false);
							} else {
								this._oDialog.setStretch(true);
							}

							//Clear all old Messages before Launching the dialog
							this.oMsgManager.removeAllMessages();

							this._oDialog.open();
							this._oMsgHandlerRespModel = this._oDialog.getModel("MessageHandlerResponseModel");
							if (this._oMsgHandlerRespModel) {
								this._oMsgHandlerRespModel.setProperty("/bIsDialogOpen", true);
							}

							//Set Dialog Defaults
							this._setWorkCenterCapcityDefaults();

							this._oModel = oContainerView.getModel();
							this._oModel.setDeferredGroups(["iDBatchWorkCenterRequest"]);
							this._oModel.setChangeGroups({
								C_RSHWorkCenterCapacityChangeType: {
									groupId: "iDBatchWorkCenterRequest",
									changeSetId: "iDBatchWorkCenterRequest",
									single: false
								}
							});

							var oDtTypeRangeField = this._oContainerView.byId("idWeekSelectionDtDTR");
							if (oDtTypeRangeField.getStartDate() < new Date()) {
								this._oUIElementStates.setProperty("/bPrevWeekEnabled", false);
							}

							var sSystemTimeZone = this.controllers.systemTimeZone.get();
							var sTitle = this._oReuseResourceBundle.getText("ChangeWorkCenterCapacityTitle", [sSystemTimeZone]);
							this._oUIElementStates.setProperty("/sTitle", sTitle);
							
						}.bind(this)
					);
				} else {
					oContainerView.byId("idWorkCenterCapChange").open();
					this._setWorkCenterCapcityDefaults();
				}
			},

			/**
			 * Event Handler for the Target Week Date Selected from the Date Picker
			 * @public
			 * @param {Object} oEvent object
			 **/
			handleTargetWeekSelected: function (oEvent) {
				if (
					oEvent.getParameter("valid") && // Has the user chosen a valid Date entry?
					oEvent.getParameter("value")
				) {
					// and is it an empty input?

					var oSelectedDate = oEvent.getSource().getDateValue();
					var sWeek = Utils.getISOWeekByDate(oSelectedDate);
					var iYear = Utils.getISOYearByDate(oSelectedDate);
					var oWeekDates = Utils.getDateOfISOWeek(sWeek, iYear);
					var sPeriodText = this._geti18nText("TargetSelectedWeekText", [
						this._oDateFormatter.format(oWeekDates.startDate),
						this._oDateFormatter.format(oWeekDates.endDate),
						sWeek
					]);

					this._oUIElementStates.setProperty("/dWeekSelectionStartDate", oWeekDates.startDate);
					this._oUIElementStates.setProperty("/dWeekSelectionEndDate", oWeekDates.endDate);
					this._oUIElementStates.setProperty("/sWeekSelectedText", sPeriodText);

					//Set Prev Week Navigation button state
					var bEnablePrevWeek = true;
					if (this._oContainerView.byId("idWeekSelectionDtDTR").getStartDate() <= new Date()) {
						bEnablePrevWeek = false;
					}
					this._oUIElementStates.setProperty("/bPrevWeekEnabled", bEnablePrevWeek);

					//Setting the Focus and Value State on the DatePicker
					this._oUIElementStates.setProperty("/sTargetWeekDatePickerValueState", "None");
					oEvent.getSource().setInitialFocusedDateValue(oWeekDates.startDate);

					//Reset the Table binding
					this._oSmartTable.rebindTable();
				} else {
					var minStartDate = oEvent.getSource().getMinDate();
					var minAllowedDate = this.formatter.formatDate(minStartDate, false);

					this._oUIElementStates.setProperty("/sTargetWeekDatePickerValueState", "Error");
					this._oUIElementStates.setProperty(
						"/sTargetWeekDatePickerValueStateText",
						this._geti18nText("ErrorMsgTargetWeekInvalidDateErr", [minAllowedDate])
					);
				}
			},

			/**
			 * Rebind for the Workcenter capacity table
			 * @public
			 * @param {Object} oEvent object
			 **/
			onBeforeRebindTable: function (oEvent) {
				var oSmartTable = oEvent.getSource();

				var dStartDate = this._oUIElementStates.getProperty("/dWeekSelectionStartDate");
				var dEndDate = this._oUIElementStates.getProperty("/dWeekSelectionEndDate");

				var oFromDate = Utils.convertDateToGatewayString(dStartDate, true);
				var oToDate = Utils.convertDateToGatewayString(dEndDate, true);
				var oBindingParams = oEvent.getParameter("bindingParams");

				oBindingParams.sorter.push(new sap.ui.model.Sorter("Plant"));
				oBindingParams.sorter.push(new sap.ui.model.Sorter("WorkCenter"));

				var sBindingPath = "/C_RSHWorkCenterCapacityChange(P_StartDate=datetime'" + oFromDate + "',P_EndDate=datetime'" + oToDate + "')/Set";

				oSmartTable.setTableBindingPath(sBindingPath);

				var that = this;
				oBindingParams.events = {
					dataReceived: function (dataReceivedEvent) {
						//evaluate if plant information should be shwown in the dialog or not
						var aReceivedData = dataReceivedEvent.getParameter("data");
						if (Utils.checkDifferentPlantPresent(aReceivedData.results)) {
							that._oUIElementStates.setProperty("/bNeedPlantInfo", true);
						}

						if (!that.hasShiftDefinitionData(aReceivedData.results)) {
							that._oUIElementStates.setProperty("/bHasShiftData", false);
						}
					}
				};
			},

			/**
			 * Event Handler Capacity change for Day1
			 * @public
			 * @param {Object} oEvent object
			 **/
			handleCapacityDay1FieldChange: function (oEvent) {
				var oSource = oEvent.getSource();
				var sFieldId = oSource.getId();
				var bPresentInFieldWithErrorMap = this._mFieldWithError[sFieldId];
				var sPath = oSource.getBindingContext().getPath();
				if (!this._aWorkCenter.includes(oSource.getBindingContext().getObject().WorkCenter)) {
					this._aWorkCenter.push(oSource.getBindingContext().getObject().WorkCenter);
				}
				var sOldValue = this._oModel.getOriginalProperty(sPath + "/WrkCtrCapDay1NmbrOfCapacities");
				var sNewValue = this._oModel.getProperty(sPath + "/WrkCtrCapDay1NmbrOfCapacities");

				if (oSource.getValueState() === sap.ui.core.ValueState.Error) {
					if (!bPresentInFieldWithErrorMap) {
						this._mFieldWithError[sFieldId] = true;
						this._oUIElementStates.setProperty("/bHasDataErrors", true);
					}
				} else {
					if (bPresentInFieldWithErrorMap) {
						delete this._mFieldWithError[sFieldId];
						if (!Object.keys(this._mFieldWithError).length) {
							this._oUIElementStates.setProperty("/bHasDataErrors", false);
						}
					}
					if (sNewValue === sOldValue) {
						this._oModel.setProperty(sPath + "/WrkCtrCapDay1NmbrOfCapModified", "");
						this._oUIElementStates.setProperty("/bHasChanges", this._oModel.hasPendingChanges());
						this._oUIElementStates.setProperty("/bTargetWeekEditable", !this._oModel.hasPendingChanges());
						this._oUIElementStates.setProperty("/bNextWeekEnabled", !this._oModel.hasPendingChanges());
						if (this._oContainerView.byId("idWeekSelectionDtDTR").getStartDate() <= new Date()) {
							this._oUIElementStates.setProperty("/bPrevWeekEnabled", false);
						} else {
							this._oUIElementStates.setProperty("/bPrevWeekEnabled", !this._oModel.hasPendingChanges());
						}
					} else {
						this._oModel.setProperty(sPath + "/WrkCtrCapDay1NmbrOfCapModified", "X");
						this._oUIElementStates.setProperty("/bHasChanges", true);
						this._oUIElementStates.setProperty("/bTargetWeekEditable", false);
						this._oUIElementStates.setProperty("/bPrevWeekEnabled", false);
						this._oUIElementStates.setProperty("/bNextWeekEnabled", false);
					}
				}
			},

			/**
			 * Event Handler Capacity change for Day2
			 * @public
			 * @param {Object} oEvent object
			 **/
			handleCapacityDay2FieldChange: function (oEvent) {
				var oSource = oEvent.getSource();
				var sFieldId = oSource.getId();
				var bPresentInFieldWithErrorMap = this._mFieldWithError[sFieldId];
				var sPath = oSource.getBindingContext().getPath();
				if (!this._aWorkCenter.includes(oSource.getBindingContext().getObject().WorkCenter)) {
					this._aWorkCenter.push(oSource.getBindingContext().getObject().WorkCenter);
				}
				var sOldValue = this._oModel.getOriginalProperty(sPath + "/WrkCtrCapDay2NmbrOfCapacities");
				var sNewValue = this._oModel.getProperty(sPath + "/WrkCtrCapDay2NmbrOfCapacities");

				if (oSource.getValueState() === sap.ui.core.ValueState.Error) {
					if (!bPresentInFieldWithErrorMap) {
						this._mFieldWithError[sFieldId] = true;
						this._oUIElementStates.setProperty("/bHasDataErrors", true);
					}
				} else {
					if (bPresentInFieldWithErrorMap) {
						delete this._mFieldWithError[sFieldId];
						if (!Object.keys(this._mFieldWithError).length) {
							this._oUIElementStates.setProperty("/bHasDataErrors", false);
						}
					}
					if (sNewValue === sOldValue) {
						this._oModel.setProperty(sPath + "/WrkCtrCapDay2NmbrOfCapModified", "");
						this._oUIElementStates.setProperty("/bHasChanges", this._oModel.hasPendingChanges());
						this._oUIElementStates.setProperty("/bTargetWeekEditable", !this._oModel.hasPendingChanges());
						this._oUIElementStates.setProperty("/bNextWeekEnabled", !this._oModel.hasPendingChanges());
						if (this._oContainerView.byId("idWeekSelectionDtDTR").getStartDate() <= new Date()) {
							this._oUIElementStates.setProperty("/bPrevWeekEnabled", false);
						} else {
							this._oUIElementStates.setProperty("/bPrevWeekEnabled", !this._oModel.hasPendingChanges());
						}
					} else {
						this._oModel.setProperty(sPath + "/WrkCtrCapDay2NmbrOfCapModified", "X");
						this._oUIElementStates.setProperty("/bHasChanges", true);
						this._oUIElementStates.setProperty("/bTargetWeekEditable", false);
						this._oUIElementStates.setProperty("/bPrevWeekEnabled", false);
						this._oUIElementStates.setProperty("/bNextWeekEnabled", false);
					}
				}
			},

			/**
			 * Event Handler Capacity change for Day3
			 * @public
			 * @param {Object} oEvent object
			 **/
			handleCapacityDay3FieldChange: function (oEvent) {
				var oSource = oEvent.getSource();
				var sFieldId = oSource.getId();
				var bPresentInFieldWithErrorMap = this._mFieldWithError[sFieldId];
				var sPath = oSource.getBindingContext().getPath();
				if (!this._aWorkCenter.includes(oSource.getBindingContext().getObject().WorkCenter)) {
					this._aWorkCenter.push(oSource.getBindingContext().getObject().WorkCenter);
				}
				var sOldValue = this._oModel.getOriginalProperty(sPath + "/WrkCtrCapDay3NmbrOfCapacities");
				var sNewValue = this._oModel.getProperty(sPath + "/WrkCtrCapDay3NmbrOfCapacities");

				if (oSource.getValueState() === sap.ui.core.ValueState.Error) {
					if (!bPresentInFieldWithErrorMap) {
						this._mFieldWithError[sFieldId] = true;
						this._oUIElementStates.setProperty("/bHasDataErrors", true);
					}
				} else {
					if (bPresentInFieldWithErrorMap) {
						delete this._mFieldWithError[sFieldId];
						if (!Object.keys(this._mFieldWithError).length) {
							this._oUIElementStates.setProperty("/bHasDataErrors", false);
						}
					}
					if (sNewValue === sOldValue) {
						this._oModel.setProperty(sPath + "/WrkCtrCapDay3NmbrOfCapModified", "");
						this._oUIElementStates.setProperty("/bHasChanges", this._oModel.hasPendingChanges());
						this._oUIElementStates.setProperty("/bTargetWeekEditable", !this._oModel.hasPendingChanges());
						this._oUIElementStates.setProperty("/bNextWeekEnabled", !this._oModel.hasPendingChanges());
						if (this._oContainerView.byId("idWeekSelectionDtDTR").getStartDate() <= new Date()) {
							this._oUIElementStates.setProperty("/bPrevWeekEnabled", false);
						} else {
							this._oUIElementStates.setProperty("/bPrevWeekEnabled", !this._oModel.hasPendingChanges());
						}
					} else {
						this._oModel.setProperty(sPath + "/WrkCtrCapDay3NmbrOfCapModified", "X");
						this._oUIElementStates.setProperty("/bHasChanges", true);
						this._oUIElementStates.setProperty("/bTargetWeekEditable", false);
						this._oUIElementStates.setProperty("/bPrevWeekEnabled", false);
						this._oUIElementStates.setProperty("/bNextWeekEnabled", false);
					}
				}
			},

			/**
			 * Event Handler Capacity change for Day4
			 * @public
			 * @param {Object} oEvent object
			 **/
			handleCapacityDay4FieldChange: function (oEvent) {
				var oSource = oEvent.getSource();
				var sFieldId = oSource.getId();
				var bPresentInFieldWithErrorMap = this._mFieldWithError[sFieldId];
				var sPath = oSource.getBindingContext().getPath();
				if (!this._aWorkCenter.includes(oSource.getBindingContext().getObject().WorkCenter)) {
					this._aWorkCenter.push(oSource.getBindingContext().getObject().WorkCenter);
				}
				var sOldValue = this._oModel.getOriginalProperty(sPath + "/WrkCtrCapDay4NmbrOfCapacities");
				var sNewValue = this._oModel.getProperty(sPath + "/WrkCtrCapDay4NmbrOfCapacities");

				if (oSource.getValueState() === sap.ui.core.ValueState.Error) {
					if (!bPresentInFieldWithErrorMap) {
						this._mFieldWithError[sFieldId] = true;
						this._oUIElementStates.setProperty("/bHasDataErrors", true);
					}
				} else {
					if (bPresentInFieldWithErrorMap) {
						delete this._mFieldWithError[sFieldId];
						if (!Object.keys(this._mFieldWithError).length) {
							this._oUIElementStates.setProperty("/bHasDataErrors", false);
						}
					}
					if (sNewValue === sOldValue) {
						this._oModel.setProperty(sPath + "/WrkCtrCapDay4NmbrOfCapModified", "");
						this._oUIElementStates.setProperty("/bHasChanges", this._oModel.hasPendingChanges());
						this._oUIElementStates.setProperty("/bTargetWeekEditable", !this._oModel.hasPendingChanges());
						this._oUIElementStates.setProperty("/bNextWeekEnabled", !this._oModel.hasPendingChanges());
						if (this._oContainerView.byId("idWeekSelectionDtDTR").getStartDate() <= new Date()) {
							this._oUIElementStates.setProperty("/bPrevWeekEnabled", false);
						} else {
							this._oUIElementStates.setProperty("/bPrevWeekEnabled", !this._oModel.hasPendingChanges());
						}
					} else {
						this._oModel.setProperty(sPath + "/WrkCtrCapDay4NmbrOfCapModified", "X");
						this._oUIElementStates.setProperty("/bHasChanges", true);
						this._oUIElementStates.setProperty("/bTargetWeekEditable", false);
						this._oUIElementStates.setProperty("/bPrevWeekEnabled", false);
						this._oUIElementStates.setProperty("/bNextWeekEnabled", false);
					}
				}
			},

			/**
			 * Event Handler Capacity change for Day5
			 * @public
			 * @param {Object} oEvent object
			 **/
			handleCapacityDay5FieldChange: function (oEvent) {
				var oSource = oEvent.getSource();
				var sFieldId = oSource.getId();
				var bPresentInFieldWithErrorMap = this._mFieldWithError[sFieldId];
				var sPath = oSource.getBindingContext().getPath();
				if (!this._aWorkCenter.includes(oSource.getBindingContext().getObject().WorkCenter)) {
					this._aWorkCenter.push(oSource.getBindingContext().getObject().WorkCenter);
				}
				var sOldValue = this._oModel.getOriginalProperty(sPath + "/WrkCtrCapDay5NmbrOfCapacities");
				var sNewValue = this._oModel.getProperty(sPath + "/WrkCtrCapDay5NmbrOfCapacities");

				if (oSource.getValueState() === sap.ui.core.ValueState.Error) {
					if (!bPresentInFieldWithErrorMap) {
						this._mFieldWithError[sFieldId] = true;
						this._oUIElementStates.setProperty("/bHasDataErrors", true);
					}
				} else {
					if (bPresentInFieldWithErrorMap) {
						delete this._mFieldWithError[sFieldId];
						if (!Object.keys(this._mFieldWithError).length) {
							this._oUIElementStates.setProperty("/bHasDataErrors", false);
						}
					}
					if (sNewValue === sOldValue) {
						this._oModel.setProperty(sPath + "/WrkCtrCapDay5NmbrOfCapModified", "");
						this._oUIElementStates.setProperty("/bHasChanges", this._oModel.hasPendingChanges());
						this._oUIElementStates.setProperty("/bTargetWeekEditable", !this._oModel.hasPendingChanges());
						this._oUIElementStates.setProperty("/bNextWeekEnabled", !this._oModel.hasPendingChanges());
						if (this._oContainerView.byId("idWeekSelectionDtDTR").getStartDate() <= new Date()) {
							this._oUIElementStates.setProperty("/bPrevWeekEnabled", false);
						} else {
							this._oUIElementStates.setProperty("/bPrevWeekEnabled", !this._oModel.hasPendingChanges());
						}
					} else {
						this._oModel.setProperty(sPath + "/WrkCtrCapDay5NmbrOfCapModified", "X");
						this._oUIElementStates.setProperty("/bHasChanges", true);
						this._oUIElementStates.setProperty("/bTargetWeekEditable", false);
						this._oUIElementStates.setProperty("/bPrevWeekEnabled", false);
						this._oUIElementStates.setProperty("/bNextWeekEnabled", false);
					}
				}
			},

			/**
			 * Event Handler Capacity change for Day6
			 * @public
			 * @param {Object} oEvent object
			 **/
			handleCapacityDay6FieldChange: function (oEvent) {
				var oSource = oEvent.getSource();
				var sFieldId = oSource.getId();
				var bPresentInFieldWithErrorMap = this._mFieldWithError[sFieldId];
				var sPath = oSource.getBindingContext().getPath();
				if (!this._aWorkCenter.includes(oSource.getBindingContext().getObject().WorkCenter)) {
					this._aWorkCenter.push(oSource.getBindingContext().getObject().WorkCenter);
				}
				var sOldValue = this._oModel.getOriginalProperty(sPath + "/WrkCtrCapDay6NmbrOfCapacities");
				var sNewValue = this._oModel.getProperty(sPath + "/WrkCtrCapDay6NmbrOfCapacities");

				if (oSource.getValueState() === sap.ui.core.ValueState.Error) {
					if (!bPresentInFieldWithErrorMap) {
						this._mFieldWithError[sFieldId] = true;
						this._oUIElementStates.setProperty("/bHasDataErrors", true);
					}
				} else {
					if (bPresentInFieldWithErrorMap) {
						delete this._mFieldWithError[sFieldId];
						if (!Object.keys(this._mFieldWithError).length) {
							this._oUIElementStates.setProperty("/bHasDataErrors", false);
						}
					}
					if (sNewValue === sOldValue) {
						this._oModel.setProperty(sPath + "/WrkCtrCapDay6NmbrOfCapModified", "");
						this._oUIElementStates.setProperty("/bHasChanges", this._oModel.hasPendingChanges());
						this._oUIElementStates.setProperty("/bTargetWeekEditable", !this._oModel.hasPendingChanges());
						this._oUIElementStates.setProperty("/bNextWeekEnabled", !this._oModel.hasPendingChanges());
						if (this._oContainerView.byId("idWeekSelectionDtDTR").getStartDate() <= new Date()) {
							this._oUIElementStates.setProperty("/bPrevWeekEnabled", false);
						} else {
							this._oUIElementStates.setProperty("/bPrevWeekEnabled", !this._oModel.hasPendingChanges());
						}
					} else {
						this._oModel.setProperty(sPath + "/WrkCtrCapDay6NmbrOfCapModified", "X");
						this._oUIElementStates.setProperty("/bHasChanges", true);
						this._oUIElementStates.setProperty("/bTargetWeekEditable", false);
						this._oUIElementStates.setProperty("/bPrevWeekEnabled", false);
						this._oUIElementStates.setProperty("/bNextWeekEnabled", false);
					}
				}
			},

			/**
			 * Event Handler Capacity change for Day7
			 * @public
			 * @param {Object} oEvent object
			 **/
			handleCapacityDay7FieldChange: function (oEvent) {
				var oSource = oEvent.getSource();
				var sFieldId = oSource.getId();
				var bPresentInFieldWithErrorMap = this._mFieldWithError[sFieldId];
				var sPath = oSource.getBindingContext().getPath();
				if (!this._aWorkCenter.includes(oSource.getBindingContext().getObject().WorkCenter)) {
					this._aWorkCenter.push(oSource.getBindingContext().getObject().WorkCenter);
				}
				var sOldValue = this._oModel.getOriginalProperty(sPath + "/WrkCtrCapDay7NmbrOfCapacities");
				var sNewValue = this._oModel.getProperty(sPath + "/WrkCtrCapDay7NmbrOfCapacities");

				if (oSource.getValueState() === sap.ui.core.ValueState.Error) {
					if (!bPresentInFieldWithErrorMap) {
						this._mFieldWithError[sFieldId] = true;
						this._oUIElementStates.setProperty("/bHasDataErrors", true);
					}
				} else {
					if (bPresentInFieldWithErrorMap) {
						delete this._mFieldWithError[sFieldId];
						if (!Object.keys(this._mFieldWithError).length) {
							this._oUIElementStates.setProperty("/bHasDataErrors", false);
						}
					}
					if (sNewValue === sOldValue) {
						this._oModel.setProperty(sPath + "/WrkCtrCapDay7NmbrOfCapModified", "");
						this._oUIElementStates.setProperty("/bHasChanges", this._oModel.hasPendingChanges());
						this._oUIElementStates.setProperty("/bTargetWeekEditable", !this._oModel.hasPendingChanges());
						this._oUIElementStates.setProperty("/bNextWeekEnabled", !this._oModel.hasPendingChanges());
						if (this._oContainerView.byId("idWeekSelectionDtDTR").getStartDate() <= new Date()) {
							this._oUIElementStates.setProperty("/bPrevWeekEnabled", false);
						} else {
							this._oUIElementStates.setProperty("/bPrevWeekEnabled", !this._oModel.hasPendingChanges());
						}
					} else {
						this._oModel.setProperty(sPath + "/WrkCtrCapDay7NmbrOfCapModified", "X");
						this._oUIElementStates.setProperty("/bHasChanges", true);
						this._oUIElementStates.setProperty("/bTargetWeekEditable", false);
						this._oUIElementStates.setProperty("/bPrevWeekEnabled", false);
						this._oUIElementStates.setProperty("/bNextWeekEnabled", false);
					}
				}
			},

			/**
			 * Handler for Cross App Navigation to Change Work Center App on Workcenter Title Press
			 * @public
			 * @param {Object} oEvent object
			 **/
			handleChangeWorkCenterInNewTab: function (oEvent) {
				var sPath = oEvent.getSource().getBindingContext().sPath;
				var oWorkCenterCapacity = oEvent.getSource().getModel().getObject(sPath);
				var sWorkcenter = oWorkCenterCapacity.WorkCenter;
				var sPlant = oWorkCenterCapacity.Plant;
				var sOkcode = "KAUE";
				var oArgs = {
					target: {
						semanticObject: "WorkCenter",
						action: "change"
					},
					params: {
						Plant: sPlant,
						WorkCenter: sWorkcenter,
						DYNP_OKCODE: sOkcode,
						SkipInitialScreen: "X"
					}
				};
				var sHash = this._oCrossAppNav.hrefForExternal(oArgs);
				sap.m.URLHelper.redirect(sHash, true);
			},

			/**
			 * Event Handler for Save button in the Footer of the dialog
			 * @public
			 **/
			onSave: function () {
				//If a client side error exists change will not be allowed
				//This case happens when there is a oData error in a smartfield
				if (this._checkForExistingClientErrors()) {
					return;
				}

				this._setBusy(true);

				this._aReceivedErrorData = [];
				this._bHasDataError = false;

				if (this._oModel.hasPendingChanges()) {
					var aNewMessages = [];
					var bErrorMessage = false;
					var bSuccessMessage = false;

					this._oModel.attachEventOnce(
						"messageChange",
						function (oEvent) {
							aNewMessages = oEvent.getParameter("newMessages");
							if (aNewMessages.length > 0) {
								bErrorMessage = aNewMessages.some(function (oMessage) {
									return oMessage.type === sap.ui.core.MessageType.Error;
								});
								bSuccessMessage = aNewMessages.some(function (oMessage) {
									return oMessage.type === sap.ui.core.MessageType.Success;
								});

								aNewMessages.forEach(
									function (oMessage) {
										if (oMessage.type === sap.ui.core.MessageType.Error) {
											var errorData = {
												targetPath: oMessage.target,
												code: oMessage.code,
												message: oMessage.message,
												changedValue: this._oModel.getProperty(oMessage.target)
											};
											this._aReceivedErrorData.push(errorData);
											if (oMessage.code === Constants.sShiftChangeErrorCode) {
												//Error case when there is a Data error which happened in the background
												//e.g.: Shift information is changed prompt user on the change
												this._bHasDataError = true;
											}
										}
									}.bind(this)
								);
							}
						}.bind(this)
					);

					this._oModel.submitChanges({
						success: function (oData) {
							// currently this dialog submits all pending requests
							// (including deferred get requests of scheduling board)
							// this leads to multiple calls to success ... but only one should be handled
							// TODO submit changes only on the dialogs batch group instead all batch groups
							var bIsChangeRequest =
								oData && oData.__batchResponses && oData.__batchResponses.length > 0 && !!oData.__batchResponses[0].__changeResponses;
							if (!bIsChangeRequest) {
								return;
							}

							if (bSuccessMessage && !bErrorMessage) {
								this._setBusy(false);
								this._oDialog.close();
								this._oResponseState.bSuccessfulSave = true;
								Utils.addMessage(
									this._oReuseResourceBundle.getText("WCCapSuccessMessageToast"),
									sap.ui.core.MessageType.Success,
									Constants.sDisplayTypeMessageToast
								);
							} else if (bErrorMessage) {
								//There are some Errors & possible success messages present after submission

								if (this._bHasDataError) {
									MessageBox.error(this._oReuseResourceBundle.getText("PartialSaveDataError"));
									//Disable the Change Button and Enable only Reset button
									this._oUIElementStates.setProperty("/bHasChanges", false);
									this._oUIElementStates.setProperty("/bHasDataErrors", true);
								} else {
									//Triggering the Rebind
									this._oSmartTable.rebindTable();

									this._oSmartTable.attachEventOnce(
										"dataReceived",
										function (oEvent) {
											if (this._aReceivedErrorData.length > 0) {
												this._aReceivedErrorData.forEach(
													function (errorData) {
														//Setting the value back to the model for error cases
														//This is to enable re-submission - enforcing Pending changes in the model
														this._oModel.setProperty(errorData.targetPath, errorData.changedValue);

														//Fetching the Field's Change flag path and setting the Flag back in the model
														var sChangeFlagPath = this._fetchChangedPropertyFlag(errorData.targetPath);
														this._oModel.setProperty(sChangeFlagPath, "X");
													}.bind(this)
												);
											}
										}.bind(this)
									);

									//Enable the Change Button for re-submission
									this._oUIElementStates.setProperty("/bHasChanges", true);
								}

								//Removing the Busy Indicator
								this._setBusy(false);
							} else {
								this._setBusy(false);
								this._oDialog.close();
								this._oResponseState.bSuccessfulSave = false;
							}
						}.bind(this),
						error: function () {
							this._setBusy(false);
							this._oDialog.close();
							this._oResponseState.bSuccessfulSave = false;
						}.bind(this)
					});
				} else {
					this._setBusy(false);
				}
			},

			/**
			 * Method to fetch the Field's Change Flag based on the original Target Path
			 * @private
			 * @param {string} sTargetPath the actual Target Path
			 * @returns {string} Change Flag Path
			 **/
			_fetchChangedPropertyFlag: function (sTargetPath) {
				var sChangeFlagProperty;
				var aSplitString = sTargetPath.split("/");
				switch (aSplitString[2]) {
					case "WrkCtrCapDay1NmbrOfCapacities":
						sChangeFlagProperty = "WrkCtrCapDay1NmbrOfCapModified";
						break;
					case "WrkCtrCapDay2NmbrOfCapacities":
						sChangeFlagProperty = "WrkCtrCapDay2NmbrOfCapModified";
						break;
					case "WrkCtrCapDay3NmbrOfCapacities":
						sChangeFlagProperty = "WrkCtrCapDay3NmbrOfCapModified";
						break;
					case "WrkCtrCapDay4NmbrOfCapacities":
						sChangeFlagProperty = "WrkCtrCapDay4NmbrOfCapModified";
						break;
					case "WrkCtrCapDay5NmbrOfCapacities":
						sChangeFlagProperty = "WrkCtrCapDay5NmbrOfCapModified";
						break;
					case "WrkCtrCapDay6NmbrOfCapacities":
						sChangeFlagProperty = "WrkCtrCapDay6NmbrOfCapModified";
						break;
					case "WrkCtrCapDay7NmbrOfCapacities":
						sChangeFlagProperty = "WrkCtrCapDay7NmbrOfCapModified";
						break;
					default:
						sChangeFlagProperty = aSplitString[2];
				}

				return "/" + aSplitString[1] + "/" + sChangeFlagProperty;
			},

			/**
			 * Check if only Client side validated Error fields are present in the Smart Table Layout
			 * If error found Opens a pop up to prompt the user to fix them
			 * @returns {boolean} Error exists flag
			 * @private
			 */
			_checkForExistingClientErrors: function () {
				var bErrorFieldExists = false;
				if (Object.entries(this._mFieldWithError).length) {
					MessageBox.error(this._oReuseResourceBundle.getText("ClientErrorStateFields")); //Please Correct the highlighted fields
					bErrorFieldExists = true;
				}
				return bErrorFieldExists;
			},

			/**
			 * Event Handler for Reset button in the Footer of the dialog
			 * @public
			 * @param {Object} oEvent object
			 **/
			onReset: function (oEvent) {
				this._oUIElementStates.setProperty("/bHasChanges", false);
				this._oUIElementStates.setProperty("/bHasDataErrors", false);
				this._oUIElementStates.setProperty("/bTargetWeekEditable", true);
				this._oUIElementStates.setProperty("/bPrevWeekEnabled", true);
				this._oUIElementStates.setProperty("/bNextWeekEnabled", true);
				this._oModel.resetChanges();

				//Clear ValueState of Fields with Error explicitly
				var aFieldWithError = Object.keys(this._mFieldWithError);
				var that = this;
				aFieldWithError.forEach(function (item) {
					that._oDialog.getParent().byId(item).setValueState("None");
				});

				//Clear error map object
				this._mFieldWithError = {};

				//Reset the Table binding
				this._oSmartTable.rebindTable();

				//Accessibility - Retain Lost Focus upon pressing Reset
				setTimeout(
					function () {
						this._oDialog.getParent().byId("idCancel").focus();
					}.bind(this),
					0
				);
			},

			/**
			 * Event Handler for Cancel button in the Footer of the dialog
			 * @public
			 * @param {Object} oEvent object
			 **/
			onCancel: function (oEvent) {
				this._oResponseState.bSuccessfulSave = false;
				this._oDialog.close();
			},

			_setBusy: function (bBusy) {
				this._oDialog.setBlocked(bBusy);
				this._oDialog.setBusy(bBusy);
			},

			/**
			 * Event Handler for initialise Event of the Smarttable
			 * It is called once the table is fully initialized. A rebind of the table can only happen once the table is initialized.
			 * Therefore doing the first rebind here instead of _openDialog
			 * @public
			 * @param {Object} oEvent object
			 **/
			onTableInitialized: function (oEvent) {
				this._oSmartTable = this._oContainerView.byId("idWorkCenterCapChangeList");
				this._oSmartTable.rebindTable();
			},

			/**
			 * Event Handler for after Dialog close
			 * @public
			 **/
			onAfterDialogClose: function () {
				this._oModel.resetChanges();
				if (this._oMsgHandlerRespModel) {
					this._oMsgHandlerRespModel.setProperty("/bIsDialogOpen", false);
				}
				var oResponseStateAndWorkCenters = {};
				oResponseStateAndWorkCenters.responseState = this._oResponseState;
				oResponseStateAndWorkCenters.workCentersToRefresh = this._aWorkCenter;
				this._fnOuterPromiseResolved(oResponseStateAndWorkCenters);
				this._aWorkCenter = [];
				this._fnOuterPromiseResolved = null;
				this._oDialog.destroy();
				this._oDialog = null;
			},

			/**
			 * Event handler on Press of 'Next Week' Navigation Button
			 * @param {Object} oEvent press Event
			 */
			onNextWeekNavigationButtonPress: function (oEvent) {
				var dEndDate = this._oUIElementStates.getProperty("/dWeekSelectionEndDate");
				var nextWeekStartDate = new Date(dEndDate);
				nextWeekStartDate.setDate(dEndDate.getDate() + 1);
				this._handlePagination(nextWeekStartDate);
				if (this._oContainerView.byId("idWeekSelectionDtDTR").getStartDate() >= new Date()) {
					this._oUIElementStates.setProperty("/bPrevWeekEnabled", true);
				}
			},

			/**
			 * Event handler on Press of 'Previous Week' Navigation Button
			 * @param {Object} oEvent press Event
			 */
			onPrevWeekNavigationButtonPress: function (oEvent) {
				var dStartDate = this._oUIElementStates.getProperty("/dWeekSelectionStartDate");
				var previousWeekEndDate = new Date(dStartDate);
				previousWeekEndDate.setDate(dStartDate.getDate() - 1);
				this._handlePagination(previousWeekEndDate);
				if (this._oContainerView.byId("idWeekSelectionDtDTR").getStartDate() <= new Date()) {
					this._oUIElementStates.setProperty("/bPrevWeekEnabled", false);
				}
			},

			/**
			 * Rebinds Change Work Center Capacity dialog table to given Week Start Date
			 * @private
			 * @param {Date} dWeekStartDate Week Start Date as per Week Navigation Press
			 */
			_handlePagination: function (dWeekStartDate) {
				var sWeek = Utils.getISOWeekByDate(dWeekStartDate);
				var iYear = Utils.getISOYearByDate(dWeekStartDate);
				var oWeekDates = Utils.getDateOfISOWeek(sWeek, iYear);
				var sPeriodText = this._geti18nText("TargetSelectedWeekText", [
					this._oDateFormatter.format(oWeekDates.startDate),
					this._oDateFormatter.format(oWeekDates.endDate),
					sWeek
				]);
				this._oUIElementStates.setProperty("/dWeekSelectionStartDate", oWeekDates.startDate);
				this._oUIElementStates.setProperty("/dWeekSelectionEndDate", oWeekDates.endDate);
				this._oUIElementStates.setProperty("/sWeekSelectedText", sPeriodText);
				this._oSmartTable.rebindTable();
			},

			/**
			 * Formatter for enabled property of StepInput Control which denotes WorkCenterCapacity
			 * @param {Number} iFieldControl Work Center Capacity Field Control Value : 1 is editable and 7 corresponds locked
			 * @returns {Boolean} bIsWorkCenterCapacityStepInputFieldEnabled If current Work Center Capacity Step Input Field is available for edits
			 */
			isWrkCtrCapStepInputFieldEnabled: function (iFieldControl) {
				switch (iFieldControl) {
					case 1:
						return false;
					case 7:
						return true;
					default:
						return false;
				}
			}
		});
	}
);
