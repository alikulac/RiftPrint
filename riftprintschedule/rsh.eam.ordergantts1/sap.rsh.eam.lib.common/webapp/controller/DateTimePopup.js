/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"sap/ui/core/Fragment",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/formatters/formatter",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/ui/core/date/UI5Date"
	],
	function (Controller, Fragment, Constants, Formatter, Utils, UI5Date) {
		"use strict";
		return Controller.extend("sap.rsh.eam.lib.common.controller.DateTimePopup", {
			formatter: Formatter,

			onOpen: function (oEvent, view, shape, iPageX, iPageY, calledFrom, defaultDate, minDate, maxDate) {
				return new Promise(
					function (resolve, reject) {
						this._fnResolve = resolve;
						this._onOpen(oEvent, view, shape, iPageX, iPageY, calledFrom, defaultDate, minDate, maxDate);
					}.bind(this)
				);
			},

			_onOpen: function (oEvent, view, shape, iPageX, iPageY, calledFrom, defaultDate, minDate, maxDate) {
				this._oShape = shape;
				this._iPageX = iPageX;
				this._iPageY = iPageY;
				this._oParentView = view;
				this.fragmentId = view.getId();
				this.calledFrom = calledFrom;
				this.defaultDate = defaultDate;
				this.minDate = minDate;
				this.maxDate = maxDate;
				this._oResourceModel = sap.ui.getCore().getLibraryResourceBundle("sap.rsh.eam.lib.common");

				if (!this._popover) {
					this._popover = Fragment.load({
						id: this.fragmentId,
						name: "sap.rsh.eam.lib.common.view.DateTimePopup",
						controller: this
					}).then(function (popover) {
						view.addDependent(popover);
						return popover;
					});
				}

				// Create a resource bundle for language specific texts
				this.oResourceModel = new sap.ui.model.resource.ResourceModel({
					bundleName: "sap.rsh.eam.lib.common.messagebundle"
				});
				var that = this;
				this._popover.then(function (popover) {
					that.popover = popover;
					popover.setModel(that.oResourceModel, "i18nLib");
					//Placeholder to display the popover next to the mouse cursor
					var oPlaceHolder = new sap.m.Label();
					var oPopup = new sap.ui.core.Popup(oPlaceHolder, false, true, false);
					var eDock = sap.ui.core.Popup.Dock;
					//Setting the offset to display  fragment next to the mouse cursor
					var sOffset = that._iPageX + 1 + " " + (that._iPageY - 15);
					oPopup.open(0, eDock.BeginTop, eDock.LeftTop, null, sOffset);
					that._setDates();

					var okButton = sap.ui.core.Fragment.byId(that.fragmentId, "idDateTimePopupOkBtn");
					okButton.setEnabled(false);

					popover.openBy(oPlaceHolder);
				});
			},

			/*
			 * sets up DateTimePopup popup date and limits
			 * @private
			 */
			_setDates: function () {
				var dateTimePicker = sap.ui.core.Fragment.byId(this.fragmentId, "idDateTimePicker");

				if (this.defaultDate instanceof Date) {
					dateTimePicker.setDateValue(this.defaultDate);
				} else {
					dateTimePicker.setDateValue(UI5Date.getInstance());
				}

				//in case the date value that is set is greater as the minDate that is desired it can't be set from beginning as it will block the picker to open.
				if (this.minDate instanceof Date && dateTimePicker.getDateValue() >= this.minDate) {
					dateTimePicker.setMinDate(this.minDate);
				}
				if (this.maxDate instanceof Date) {
					dateTimePicker.setMaxDate(this.maxDate);
				}
				// reset state
				dateTimePicker.setValueState(sap.ui.core.ValueState.None);
				dateTimePicker.setValueStateText("");
			},

			onPopoverClose: function (oEvent) {
				var eventBus = sap.ui.getCore().getEventBus();
				eventBus.publish(Constants.sLibraryChannel, Constants.sDateTimePopupClose, this._oShape);
				this._resetDatePicker();
			},

			onCancel: function (oEvent) {
				if (this.popover && this.popover.isOpen()) {
					this.popover.close();
				}
			},

			onSubmit: function (oEvent) {
				var dateTimePicker = sap.ui.core.Fragment.byId(this.fragmentId, "idDateTimePicker");
				var eventData = {
					shape: this._oShape,
					dateTimeValue: dateTimePicker.getDateValue(),
					calledFrom: this.calledFrom
				};
				this.popover.close();
				var eventBus = sap.ui.getCore().getEventBus();
				eventBus.publish(Constants.sLibraryChannel, Constants.sDateTimePopupSubmit, eventData);
				this._fnResolve(eventData);
			},

			onDateChange: function (oEvent) {
				var dateTimePicker = oEvent.getSource(),
					okButton = sap.ui.core.Fragment.byId(this.fragmentId, "idDateTimePopupOkBtn"),
					isValidInput = oEvent.getParameter("valid"),
					minDateAvailable = this.minDate ? true : false,
					maxDateAvailable = this.maxDate ? true : false;

				var selectedDate = dateTimePicker.getDateValue();

				/*In case a default date is set as initial date that is in the past, minDate and maxDate of the control will not be set.
				Witout having them set we need to check on change if the input date is in the desired date range as control validation will not do it for manual input
				As it could be that minDate and maxDate are not provided by calling application date range is only checked if they are set*/
				if (
					!isValidInput ||
					oEvent.getParameter("value") === "" ||
					(minDateAvailable && selectedDate < this.minDate) ||
					(maxDateAvailable && selectedDate > this.maxDate)
				) {
					dateTimePicker.setValueState(sap.ui.core.ValueState.Error);
					dateTimePicker.setValueStateText(this._oResourceModel.getText("ErrorMessageEditDateInvalidDateErr"));
					okButton.setEnabled(false);
				} else {
					dateTimePicker.setValueState(sap.ui.core.ValueState.None);
					dateTimePicker.setValueStateText("");

					//if no change then ok btn is disabled without error
					if (selectedDate.getTime() === this.defaultDate.getTime()) {
						okButton.setEnabled(false);
					} else {
						okButton.setEnabled(true);
					}
				}
			},

			/**
			 * Event is raised when value help (datepicker) is opend by clicking the icon
			 * When the date vale of the control was set to a past date (e.g order in the past) no minDate is set when
			 * popup is opened as it conflicts and makes it impossible to open value help at all
			 * @param {object} event - event object
			 */
			afterValueHelpOpen: function (event) {
				var dateTimePicker = event.getSource();
				if (this.minDate instanceof Date && !dateTimePicker.getMinDate()) {
					dateTimePicker.setMinDate(this.minDate);
				}
			},

			/**
			 * Event is raised when the value help is closed (after change event)
			 * In case the default date was on opening before the desired minDate, minDate is set on opening the value help
			 * When user is closing the value help with still having the invalid date outside of actual date range
			 * minDate needs to be reset to be able to open the value help again
			 * As the event does not give the information how the value help closed (ok vs. cancel), datePicker values need to be evaluated
			 * to check if the reset is needed
			 * @param {object} event - event object
			 */
			afterValueHelpClose: function (event) {
				var dateTimePicker = event.getSource();
				if (
					this.defaultDate instanceof Date &&
					dateTimePicker.getMinDate() &&
					dateTimePicker.getDateValue() &&
					this.defaultDate < dateTimePicker.getMinDate() &&
					dateTimePicker.getDateValue().getTime() === this.defaultDate.getTime()
				) {
					dateTimePicker.setMinDate(null);
				}
			},

			_resetDatePicker: function () {
				var dateTimePicker = sap.ui.core.Fragment.byId(this.fragmentId, "idDateTimePicker");

				dateTimePicker.setDateValue(UI5Date.getInstance());
				dateTimePicker.setMinDate(null);
				dateTimePicker.setMaxDate(null);

				dateTimePicker.setValueState(sap.ui.core.ValueState.None);
				dateTimePicker.setValueStateText("");
			}
		});
	}
);
