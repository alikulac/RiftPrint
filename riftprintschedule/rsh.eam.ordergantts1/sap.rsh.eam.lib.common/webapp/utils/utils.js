/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/ui/core/message/Message",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/m/MessageBox",
		"sap/ushell/services/URLParsing",
		"sap/ui/core/format/DateFormat",
		"sap/ui/core/date/UI5Date",
		"sap/rsh/eam/lib/common/utils/DateUtils"
	],
	function (Message, Constants, MessageBox, URLParsing, DateFormat, UI5Date, DateUtils) {
		"use strict";

		return {
			/**
			 * Creates a error message popup for functional errors in the footer bar and adds items in it
			 * @param {object} oModel Model bound to the footer bar
			 * @param {object} oMessageObject Message Data shown as the message
			 * @returns {object} oModel to be set on the footer view
			 * @public
			 * */
			addMessageItem: function (oModel, oMessageObject) {
				if (!this.oMessagePopover) {
					var oMessageTemplate = new sap.m.MessageItem({
						type: "{type}",
						title: "{title}",
						description: "{description}",
						subtitle: "{subtitle}",
						counter: "{counter}",
						longtextUrl: "{longtextUrl}"
					});
					this.oMessagePopover = new sap.m.MessagePopover({
						items: {
							path: "/messageItem",
							template: oMessageTemplate
						}
					});
				}
				var oData = oModel.getData();
				//check if the object is there
				if (oMessageObject) {
					//check if the error is from the same control and if the item is undefined
					//for the first run when no issue is raised.add the issue item
					//check if the oMessageObject.control is a control or backend error message
					if (oMessageObject.messageSource === "UI") {
						//set the statevalue for the control to error
						oMessageObject.control.setValueState(oMessageObject.type);
						//set the control id to the object oMessageObject which will be the unique id
						oMessageObject.control = oMessageObject.control.getId();
					}
					//check if the message is already added in the model which is set to the footer button
					if (
						oData.messageItemType[oMessageObject.control] === undefined ||
						(oData.messageItemType[oMessageObject.control] !== undefined && oData.messageItemType[oMessageObject.control] < 0)
					) {
						//push the error items in the
						oData.messageItem.push(oMessageObject);
						oData.messageItemType[oMessageObject.control] = oData.messageItem.indexOf(oMessageObject);
						oData.messageLength = oData.messageItem.length;
						oData.messageVisible = true;
						this.oMessagePopover.setModel(oModel);
					}
				}
				return oModel;
			},
			/**
			 * Returns the End date for next 4 weeks for the Details app and Gantt app
			 * @returns {DateObject} returns next end date as JS dae object
			 * @public
			 * */
			getEndDateNext: function () {
				var oEndDateNext = UI5Date.getInstance();
				// Set the date to today + 4 weeks
				// Then set it to the previous Sunday
				oEndDateNext.setDate(oEndDateNext.getDate() + 28);
				oEndDateNext.setDate(oEndDateNext.getDate() - ((oEndDateNext.getDay() + 7) % 7));
				return oEndDateNext;
			},
			/**
			 * Checks the error message popup for functional errors in the footer bar and removes items in it
			 * @param {object} oModel Model bound to the footer bar
			 * @param {object} oControlId The  control that had issues or functional issue
			 * @returns {object} oModel to be set on the footer view
			 * @public
			 * */
			checkMessageItem: function (oModel, oControlId) {
				//can send the control id having the error
				if (this.oMessagePopover) {
					var oData = oModel.getData();
					//check which is the type of error has to be removed
					if (oControlId.messageSource === "UI") {
						//set the statevalue for the control to error none
						if (oControlId.control.setValueState) {
							oControlId.control.setValueState("None");
						}
						//set the control id to the object oMessageObject which will be the unique id
						oControlId.control = oControlId.control.getId();
						if (oData.messageItemType[oControlId.control] !== undefined) {
							//remove the error from the array and set the model again
							oData.messageItem.splice(oData.messageItemType[oControlId.control], 1);
							delete oData.messageItemType[oControlId.control];
						}
					} else {
						//check if it is first time
						if (oData.messageItem) {
							// loop the data to find the one to delete
							var aItems = [];
							//find the items with text functionalError
							for (var i = 0; i < Object.keys(oData.messageItem).length; i++) {
								//check to see if it matches
								if (oData.messageItem[i].control.match(oControlId.control)) {
									aItems.push(oData.messageItem[i].control);
								}
							}
							for (i = 0; i < aItems.length; i++) {
								//remove the error from the array and set the model again
								oData.messageItem.splice(oData.messageItemType[aItems[i]], 1);
								//update the index numbers in the messageItemType after the splicing
								for (var j = 0; j < oData.messageItem.length; j++) {
									oData.messageItemType[oData.messageItem[j].control] = oData.messageItem.indexOf(oData.messageItem[j]);
								}
								delete oData.messageItemType[aItems[i]];
							}
						}
					}
					oData.messageLength = oData.messageItem.length;
					//will show if other errors are there
					oData.messageVisible = oData.messageLength !== 0;
					this.oMessagePopover.setModel(oModel);
				}
				return oModel;
			},

			updateErrorModel: function (errorModel, oMessageData) {
				var oErrorModel;

				// //check for error if any message there or empty
				// if (oBatchResponse.__batchResponses[0].__changeResponses[0].headers["sap-message"]) {
				// 	//jsonify the data for easier handling
				// 	var oMessageData = JSON.parse(oBatchResponse.__batchResponses[0].__changeResponses[0].headers["sap-message"]);

				if (!jQuery.isEmptyObject(oMessageData)) {
					//remove all the error
					oErrorModel = this.checkMessageItem(errorModel, {
						control: "functionalError",
						messageSource: "BE"
					});

					if (oMessageData && oMessageData.length !== 0) {
						for (var i = 0; i < oMessageData.length; i++) {
							var oErrorObject = {
								//added because the BE gives all small letter while the type has camel casing
								type: oMessageData[i].severity.charAt(0).toUpperCase() + oMessageData[i].severity.slice(1),
								title: oMessageData[i].message,
								description: oMessageData[i].message,
								// i is required to make it unique
								control: "functionalError" + oMessageData[i].code + i,
								messageSource: "BE",
								longtextUrl: oMessageData[i].longtext_url
							};
							oErrorModel = this.addMessageItem(errorModel, oErrorObject);
							errorModel.setProperty("/", oErrorModel.getData());
						}
					}
				} else {
					//removes the messages
					oErrorModel = this.checkMessageItem(errorModel, {
						control: "functionalError",
						messageSource: "BE"
					});
					errorModel.setProperty("/", oErrorModel.getData());
				}
			},
			crossAppNavigation: function (oCrossAppNav, sIntent, oArgs) {
				oCrossAppNav.isNavigationSupported([sIntent]).done(function (oData) {
					if (oData[0].supported) {
						if (oCrossAppNav) {
							/* eslint-disable sap-cross-application-navigation */
							oCrossAppNav.toExternal(oArgs);
							/* eslint-enable sap-cross-application-navigation */
						}
					}
				});
			},

			/**
			 * To handle the Year Border Case Scenario if currently we are in week 51 and we select weeks 01 and 02.
			 * @public
			 * @param {string} [sToday] Current calendar week
			 * @param {array} [aCalendarWeekSorted] sorted selected weeks
			 **/

			getDateFromWeek: function (sToday, aCalendarWeekSorted, aCalendarYearSorted) {
				var iCalendarFirstWeek = aCalendarWeekSorted[0];
				var iCalendarLastWeek = aCalendarWeekSorted[aCalendarWeekSorted.length - 1];
				var iCalendarFirstYear = aCalendarYearSorted[0];
				var iCalendarLastYear = aCalendarYearSorted[aCalendarYearSorted.length - 1];
				var bCalendarWeek;
				if (sToday - aCalendarWeekSorted[0] > 3 && sToday - aCalendarWeekSorted[aCalendarWeekSorted.length - 1] > 3) {
					bCalendarWeek = true;
				}
				if (aCalendarWeekSorted[aCalendarWeekSorted.length - 1] - aCalendarWeekSorted[0] > 3) {
					for (var i = 0; i < aCalendarWeekSorted.length; i++) {
						if (aCalendarWeekSorted[i] > "49") {
							iCalendarFirstWeek = aCalendarWeekSorted[i];
							break;
						}
						if (aCalendarWeekSorted[i] < "04") {
							iCalendarLastWeek = aCalendarWeekSorted[i];
						}
					}
					//To handle the Year Border Case Scenario if weeks in different years are selected i.e. 51 and 02
					var weekFirstDates = this.getDateOfISOWeek(iCalendarFirstWeek, iCalendarFirstYear);
					var weekLastDates = this.getDateOfISOWeek(iCalendarLastWeek, iCalendarLastYear);
				} else if (bCalendarWeek) {
					weekFirstDates = this.getDateOfISOWeek(iCalendarFirstWeek, iCalendarFirstYear);
					weekLastDates = this.getDateOfISOWeek(iCalendarLastWeek, iCalendarLastYear);
				} else {
					weekFirstDates = this.getDateOfISOWeek(iCalendarFirstWeek, iCalendarFirstYear);
					weekLastDates = this.getDateOfISOWeek(iCalendarLastWeek, iCalendarLastYear);
				}
				return [weekFirstDates, weekLastDates];
			},

			getDateFromMonth: function (sToday, aCalendarMonthSorted, aCalendarYearSorted) {
				var iCalendarFirstMonth = aCalendarMonthSorted[0];
				var iCalendarLastMonth = aCalendarMonthSorted[aCalendarMonthSorted.length - 1];
				if (iCalendarLastMonth - iCalendarFirstMonth > 3) {
					iCalendarLastMonth = aCalendarMonthSorted[0];
					iCalendarFirstMonth = aCalendarMonthSorted[aCalendarMonthSorted.length - 1];
				}
				var iCalendarFirstYear = aCalendarYearSorted[0];
				var iCalendarLastYear = aCalendarYearSorted[aCalendarYearSorted.length - 1];

				//To handle the Year Border Case Scenario if weeks in different years are selected i.e. 51 and 02
				var monthFirstDates = this.getDateOfMonth(iCalendarFirstMonth, iCalendarFirstYear);
				var monthLastDates = this.getDateOfMonth(iCalendarLastMonth, iCalendarLastYear);

				return [monthFirstDates, monthLastDates];
			},
			getDateOfMonth: function (m, y) {
				var simpleStart = UI5Date.getInstance(y, m - 1, 1);
				var simpleEnd = UI5Date.getInstance(y, m, 0);
				var startEndDates = {};

				startEndDates.startDate = simpleStart;
				startEndDates.endDate = simpleEnd;
				return startEndDates;
			},

			/**
			 * Utility method to retrieve timezone offset adjusted datetime value
			 * @public
			 * @param {Date} [inputDate] Date that has to be adjusted
			 * @return {Date} Adjusted timezone offset for Input Date
			 */
			getAdjustedDate: function (inputDate) {
				//continue only if the inputDate is not null
				//Reason: if it is null new Date creates a date 1st Jan 1970 which is not expected
				if (inputDate) {
					var dInputDate = UI5Date.getInstance(inputDate);
					dInputDate.setHours(0);
					dInputDate.setMinutes(0);
					dInputDate.setSeconds(0);
					dInputDate.setMilliseconds(0);
					return UI5Date.getInstance(dInputDate.getTime() - dInputDate.getTimezoneOffset() * 60 * 1000);
				} else {
					return undefined;
				}
			},

			/**
			 * Utility method to retrieve rounded off date time value
			 * @public
			 * @param {Date} [inputDate] Date that has to be adjusted
			 * @param {Date} [iDnDTimeGranularity] desired time granularity
			 * @return {Date} rounded off date for Input Date
			 */
			roundDateToNearestDnDGranularity: function (inputDate, iDnDTimeGranularity) {
				var dRoundedDate;
				var iDnDTimeGranularityLocal = iDnDTimeGranularity;
				if (!iDnDTimeGranularityLocal) {
					var iLowestDnDTimeGranularityInMs = 60 * 60 * 1000; // milliseconds in an hour for now. It can be set to whatever in the config.
					iDnDTimeGranularityLocal = iLowestDnDTimeGranularityInMs;
				}

				//continue only if the inputDate is not null and type of Date
				//Reason: if it is null new Date creates a date 1st Jan 1970 which is not expected
				if (inputDate && typeof inputDate.getTime === "function") {
					var dInputDateUTCMs = inputDate.getTime() - inputDate.getTimezoneOffset() * 60 * 1000;
					//Rounding has to happen in absolute time calculated based on UTC date
					//Add the time zone offset after rounding back to retreive the date in the user time zone
					dRoundedDate = UI5Date.getInstance(
						Math.round(dInputDateUTCMs / iDnDTimeGranularityLocal) * iDnDTimeGranularityLocal + inputDate.getTimezoneOffset() * 60 * 1000
					);
					return dRoundedDate;
				} else {
					return null;
				}
			},

			/**
			 * Calculate start and end date of week.
			 * @public
			 * @param {Week} [w] current week value
			 * @param {Year} [y] current year value
			 * @return {date} [startEndDates] return start and end date of week
			 */
			getDateOfISOWeek: function (w, y) {
				var simpleStart = UI5Date.getInstance(y, 0, 1 + (w - 1) * 7);
				var dow = simpleStart.getDay();
				var ISOweekStart = simpleStart;
				if (dow <= 4) {
					ISOweekStart.setDate(simpleStart.getDate() - simpleStart.getDay() + 1);
				} else {
					ISOweekStart.setDate(simpleStart.getDate() + 8 - simpleStart.getDay());
				}

				//omce start date is reghtly calculated, add 6 days to get the end day of the week :)
				var ISOweekEnd = UI5Date.getInstance(ISOweekStart);
				ISOweekEnd.setDate(ISOweekStart.getDate() + 6);

				var startEndDates = {};

				startEndDates.startDate = ISOweekStart;
				startEndDates.endDate = ISOweekEnd;
				return startEndDates;
			},

			/**
			 * Called to get the last day of the 4th week in the future from the current week onwards
			 * @public
			 * @param {string} [oEvent] Event bus parameter
			 *  @return {date} [oLastDayOfFourWeeks] return last day of the week*/
			getLastDayOfFourWeeks: function () {
				//Figure out first what is the first day of the week. This might be depending on the country e.g. Monday or Sunday...
				// Temoporally to be commented out. DON NOT DELETE!
				/*				var sLocale = sap.ui.getCore().getConfiguration().getFormatSettings().getFormatLocale().toString();
							var oLocale = new sap.ui.core.Locale(sLocale);
							var oLocaleData = sap.ui.core.LocaleData.getInstance(oLocale);
							var iFirstDayOfWeek = oLocaleData.getFirstDayOfWeek();*/

				// Get curent day
				var ocurrDate = UI5Date.getInstance();
				ocurrDate = this.getAdjustedDate(ocurrDate);
				// Get current weekday
				var iweekDay = ocurrDate.getDay();
				var iDifferenceTodayLasDayThisWeek = null;

				// First day of the week is Sunday
				//	if (iFirstDayOfWeek === 0) {
				//get Saturday of the current week and add 3 weeks onwards
				//		iDifferenceTodayLasDayThisWeek = 6 - iweekDay;
				// First day of the week is Monday
				//	} else if (iFirstDayOfWeek === 1) {
				//it is already Sunday
				if (iweekDay === 0) {
					iDifferenceTodayLasDayThisWeek = iweekDay;
				} else {
					//get Sunday of the current week
					iDifferenceTodayLasDayThisWeek = 7 - iweekDay;
				}
				//	}
				// Add 3 weeks onwards
				if (iDifferenceTodayLasDayThisWeek !== 0) {
					var oLasDayThisWeek = DateUtils.getDateIncrementedByIndex(ocurrDate, iDifferenceTodayLasDayThisWeek);
					var oLastDayOfFourWeeks = DateUtils.getDateIncrementedByIndex(oLasDayThisWeek, 21);
					return oLastDayOfFourWeeks;
				} else {
					return null;
				}
			},

			/*
			 * Method to find the ISO week by Date.
			 */
			getISOWeekByDate: function (oDate) {
				var dTodayWeek;

				if (oDate) {
					dTodayWeek = UI5Date.getInstance(oDate); // Don't overwrite the incoming variable
				} else {
					dTodayWeek = UI5Date.getInstance();
				}

				dTodayWeek.setHours(0, 0, 0, 0);
				// Thursday in current week decides the year.
				dTodayWeek.setDate(dTodayWeek.getDate() + 3 - ((dTodayWeek.getDay() + 6) % 7));
				// January 4 is always in week 1.
				var week1 = UI5Date.getInstance(dTodayWeek.getFullYear(), 0, 4);
				// Adjust to Thursday in week 1 and count number of weeks from date to week1.
				return (1 + Math.round(((dTodayWeek.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)).toString();
			},

			/*
			 * Method to find the ISO Year by Date
			 * @public
			 * @param {object} Date
			 * @return {number} ISO Year
			 */
			getISOYearByDate: function (oDate) {
				var oMutableDate = UI5Date.getInstance(oDate);
				oMutableDate.setDate(oMutableDate.getDate() + 3 - ((oMutableDate.getDay() + 6) % 7));
				return oMutableDate.getFullYear();
			},

			/*
			 * Utility method to check if its a mock run
			 * @public
			 * @param
			 * @return {Bool} Whether or not its a mock run
			 */
			isMockRun: function () {
				var oUriParams = jQuery.sap.getUriParameters();
				if (
					oUriParams.get("origional-url") === "mockServer.html" ||
					oUriParams.get("origional-url") === "flpSandboxMockServer.html" ||
					oUriParams.get("origional-url") === "opaTests.qunit.html" ||
					oUriParams.get("serverDelay") === "50" ||
					oUriParams.get("serverDelay") === "1000"
				) {
					return true;
				}
				return false;
			},

			getNextWeekStartAndEndDates: function () {
				var dStartDate = UI5Date.getInstance();
				var iIncrementToMonday = ((7 - dStartDate.getDay()) % 7) + 1;

				dStartDate = DateUtils.getDateWithStartOfDay(dStartDate);

				// Add the increment to StartDate to get next Monday
				dStartDate = DateUtils.getDateIncrementedByIndex(dStartDate, iIncrementToMonday);

				// Now add six days to the beginning of this week; voila - next week is ready
				var dEndDate = DateUtils.getDateIncrementedByIndex(dStartDate, 6);
				dEndDate = DateUtils.getDateWithEndOfDay(dEndDate);

				// Also get the week number
				var iNumber = this.getISOWeekByDate(dStartDate);

				return {
					startDate: dStartDate,
					endDate: dEndDate,
					weekNumber: iNumber
				};
			},

			/**
			 * Method to add message to the sap.ui.core.message.MessageManager generated in UI
			 * @param {string} sMessageText message text
			 * @param {string} sMessageType type of all messages as per sap.ui.core.MessageType
			 * @param {string} sDisplayType three types are possible as of now 1) MessagePopover, 2) MessageBox 3) MessageToast
			 *                                 if display type is not passed, MessagePopover will be taken as default
			 * @param {string} sTarget message target
			 * @param {boolean} bValidation message validation
			 */
			addMessage: function (sMessageText, sMessageType, sDisplayType, sTarget, bValidation) {
				var oMessage = null;
				var sMsgDisplayType = sDisplayType;
				var sTargetLocal = sTarget;
				var bValidationFlag = bValidation;
				// set defauls for display type if not explicitely passed
				if (!sMsgDisplayType) {
					sMsgDisplayType = Constants.sDisplayTypeMessagePopover;
				}

				// set defaults for target  if not explicitely passed
				if (!sTargetLocal) {
					sTargetLocal = null;
				}

				if (!bValidationFlag) {
					bValidationFlag = false;
				}

				oMessage = new Message({
					message: sMessageText,
					type: sMessageType
				});

				//enrich created message by display type parameter
				oMessage.displayType = sMsgDisplayType;

				//add the UI control as target
				oMessage.target = sTargetLocal;

				//set validation specific info
				oMessage.validation = bValidationFlag;

				//Finally add the message to the core message manager
				sap.ui.getCore().getMessageManager().addMessages(oMessage);
			},

			/**
			 * Set percent format for consistent display for % sign in charts
			 */
			setPercentFormat: function () {
				var formatterInstance = sap.viz.ui5.format.ChartFormatter.getInstance();
				sap.viz.ui5.api.env.Format.numericFormatter(formatterInstance);
				formatterInstance.registerCustomFormatter("percent", function (value) {
					var fixedPercent = sap.ui.core.format.NumberFormat.getPercentInstance({
						style: "standard",
						minFractionDigits: 0
					});
					return fixedPercent.format(value / 100);
				});
			},

			/**Calendar control(e.g.Date picker) will pick the default week start date by user locale,
			 *if not set.As per the requirement 'BCP-1880345941', All Datepickers should display Monday as
			 * start day of the week.
			 *The first day of week set independent of the user locale.
			 */
			setMondayFirstDayOfWeek: function () {
				var oCustomLocalData = sap.ui.getCore().getConfiguration().getFormatSettings().getCustomLocaleData();
				if (!oCustomLocalData || oCustomLocalData["weekData-firstDay"] !== 1) {
					sap.ui.getCore().getConfiguration().getFormatSettings().setFirstDayOfWeek(1);
				}
			},

			/**
			 * Copy the data from Source JSON object and merge into Destination JSON object.
			 * @param {JSONObject} oSourceJSON Source JSON object
			 * @param {JSONObject} oDestinationJSON Destination JSON object
			 */
			extendSimpleJSONCopy: function (oSourceJSON, oDestinationJSON) {
				for (var property in oSourceJSON) {
					if ({}.hasOwnProperty.call(oSourceJSON, property)) {
						oDestinationJSON[property] = oSourceJSON[property];
					}
				}
			},

			//This function should not longer be needed after FLP timezone changes! Currently still in use in not adjusted apps
			convertToUTCDate: function (oInputDate) {
				if (typeof oInputDate === "object") {
					return UI5Date.getInstance(oInputDate.getUTCFullYear(), oInputDate.getUTCMonth(), oInputDate.getUTCDate());
				}
				return oInputDate;
			},

			/**
			 *	This method converts the input UTC date to string format.
			 *	@public
			 *  @param {Date} oInputDate - Date in UTC
			 *	@param {Encode} bEncode - Should return value be encoded?
			 *	@return {Date} sDate - String date in gateway readable format (yyyy-mm-ddT00:00:00)
			 */
			convertDateToGatewayString: function (oInputDate, bEncode) {
				if (typeof oInputDate === "object") {
					// Append '0' to single digit dates
					var sDay = this._getTwoDigitValue(oInputDate.getDate());

					// NOTE: Month indexing starts with 0, hence add 1 to get the right month number in string format.
					// Also take care to append '0' when month value is between 1-9 (Jan to Sept)
					var sMonth = this._getTwoDigitValue(oInputDate.getMonth() + 1);

					var sDate = oInputDate.getFullYear() + "-" + sMonth + "-" + sDay + "T00:00:00";
					return bEncode ? encodeURIComponent(sDate) : sDate;
				}
				return oInputDate;
			},

			/**
			 *	Return duoble digit value
			 *	@param {intergerValue} iValue - month/date value
			 *	@return {stringValue} sValue - double digit month/date values
			 **/
			_getTwoDigitValue: function (iValue) {
				var sValue = iValue.toString();
				return sValue.length === 2 ? sValue : "0" + sValue;
			},

			getNumberOfWeeksInYear: function (iYear) {
				var oDate = UI5Date.getInstance(iYear, 0, 1);
				var bLeapYear;

				oDate = UI5Date.getInstance(iYear, 0, 1);
				bLeapYear = UI5Date.getInstance(iYear, 1, 29).getMonth() === 1;

				//check for a Jan 1 that's a Thursday or a leap year that has a
				//Wednesday jan 1. Otherwise it's 52
				return oDate.getDay() === 4 || (bLeapYear && oDate.getDay() === 3) ? 53 : 52;
			},

			checkIfOperationIsWithinTimePeriod: function (oItemModel, oTimePeriod) {
				if (
					(oItemModel.OrderOperationStartDateTime >= oTimePeriod.startDate && oItemModel.OrderOperationStartDateTime > oTimePeriod.endDate) ||
					(oItemModel.OrderOperationEndDateTime <= oTimePeriod.endDate && oItemModel.OrderOperationEndDateTime < oTimePeriod.startDate)
				) {
					return true;
				} else {
					return false;
				}
			},

			/** 
		 * Check for existence of different plants in sorted and unsorted list containing object with work center and plant
		 * Function returns true when more than one plant exists. 
		 * Empty plant information is ignored in the evaluation (needed for massChange dialog) and does not count as different plant
		 * @param {array} [workCenterPlantData] work center and plant containing list (empty data for plant allowed)
		 *	e.g [{
					"WorkCenter": "Keep Current Work Center",
					"Plant": ""
		    	  },{
					"WorkCenter": "RSH-SP01",
					"Plant": "1010"
		    	  },{
					"WorkCenter": "RSH-CK01",
					"Plant": "1000"
		    	  }
		    	]
		 * @return {boolean} Whether or not different plant present
		 */
			checkDifferentPlantPresent: function (workCenterPlantData) {
				if (workCenterPlantData && workCenterPlantData.length > 1) {
					var hasDifferentPlant = false;
					//Compare plant values until it is clear if different plant exists
					workCenterPlantData.some(function (element, index, array) {
						if (element.Plant) {
							//Every will return false when there is a different plant compared to element.Plant and true if not
							hasDifferentPlant = !array.every(function (item) {
								if (item.Plant) {
									return item.Plant === element.Plant;
								}
								return true;
							});
							// as the first search for a plant that is not empty will bring the expected result, some() can be left
							return true;
						}
						return false;
					});
					return hasDifferentPlant;
				}
				return false;
			},

			getCustomGroupFunction: function (oSmartTable, sSorterPath, oDescForSorterKey) {
				var bIsDateTypeKey = false;
				var sColumnEdmType;
				var sLabel = "";
				var aEdmType = ["Edm.DateTime", "Edm.DateTimeOffset"];
				if (oSmartTable && typeof oSmartTable._getColumnByKey === "function") {
					var oColumn = oSmartTable._getColumnByKey(sSorterPath);
					sLabel = oColumn.getHeader().getText();
					sColumnEdmType = oColumn.getCustomData()[0].getProperty("value").edmType;
					bIsDateTypeKey = aEdmType.includes(sColumnEdmType);
				}
				return function (oContext) {
					var label = sLabel;
					var text, key;
					if (bIsDateTypeKey) {
						var oDateFormatInstance;
						if (sColumnEdmType === "Edm.DateTimeOffset") {
							oDateFormatInstance = DateFormat.getDateTimeWithTimezoneInstance({
								showTimezone: false
							});
						} else {
							oDateFormatInstance = DateFormat.getDateTimeInstance({
								UTC: true
							});
						}
						text = oDateFormatInstance.format(oContext.getProperty(oDescForSorterKey));
						key = text;
					} else {
						text = oContext.getProperty(oDescForSorterKey);
						key = oContext.getProperty(sSorterPath);
					}
					if (text === undefined || text === null) {
						text = "";
					}
					return {
						key: key,
						text: label ? label + ": " + text : text
					};
				};
			},

			/**
			 * Returning field list that is used for selection in excel export
			 * First all currently visible columsn are collected. Those columns need to be sorted based on the current table variant to show in the right order in excel
			 * p13nData of columns. For description only display, column key is ignored and only description field is added
			 * For all other display behavior column key and additional columns (additionalProperty of p13nData) are added
			 * Finally, unneeded additional properties are filtered and duplicates are removed
			 * @param {array} tableColumns - array with column objects of the table
			 * @param {array} supressColumns - list with column names that should not be selected/evaluated
			 * @param {object} tableVariant - current smart variant used by the table
			 * @returns {array} selection fields as string array used for excel export
			 */
			getSelectionFieldsForExport: function (tableColumns, supressColumns, tableVariant, supressAdditionalProperties) {
				var selectionFields = [];
				var visibleColumns = [];
				//1. collect the currently visible columns from all table columns
				tableColumns.forEach(function (column) {
					if (column.getVisible() && column.getCustomData().length && column.getCustomData()[0].getProperty("key") === "p13nData") {
						var p13nData = column.getCustomData()[0].getProperty("value");
						if (!supressColumns.includes(p13nData.columnKey)) {
							//build up new list
							var visibleColumn = {};
							visibleColumn.columnKey = p13nData.columnKey;
							visibleColumn.columnIndex = p13nData.columnIndex;
							visibleColumn.p13nData = p13nData;
							visibleColumns.push(visibleColumn);
						}
					}
				});
				//2. Integrate the table variant information with order of the columns (change indexes and sort)
				if (visibleColumns.length > 0 && tableVariant && tableVariant.columns) {
					var variantColumns = tableVariant.columns.columnsItems;
					variantColumns.forEach(function (variantColumn) {
						if (variantColumn.index) {
							var column = visibleColumns.find(function (element) {
								return element.columnKey === variantColumn.columnKey;
							});
							if (column) {
								column.columnIndex = variantColumn.index + 1;
							}
						}
					});

					visibleColumns.sort(function (element1, element2) {
						return element1.columnIndex - element2.columnIndex;
					});
				}
				//3. Get the actual selection fields from p13nData including additional fields that need to be select for full data set
				visibleColumns.forEach(function (column) {
					var p13nData = column.p13nData;
					if (p13nData.displayBehaviour && p13nData.displayBehaviour === "descriptionOnly") {
						selectionFields.push(p13nData.description);
					} else {
						selectionFields.push(p13nData.columnKey);
						if (p13nData.additionalProperty) {
							var additionalFields = p13nData.additionalProperty.split(",");
							selectionFields = selectionFields.concat(additionalFields);
						}
					}
				});

				// Filter the selection fields according to the following two criteria:
				// 1. remove any duplicate fields that could be added due to overlapping of additionalProperty with columnKeys
				//only first occurnce of the field is kept
				// 2. Remove fields that are part of supressAdditionalProperties array
				selectionFields = selectionFields.filter(function (element, position) {
					var bIsNotDuplicate = selectionFields.indexOf(element) === position;
					var bIsNotSupressed = !supressAdditionalProperties.includes(element);
					return bIsNotDuplicate && bIsNotSupressed;
				});

				return selectionFields;
			},

			/**
			 * Modifies the data url for gateway excel export by replacing the fields in $select parameter with
			 * desired fields coming from the parameter
			 * @param {string} sExportUrl - data url that needs to be modified
			 * @param {array} selectionFields - list of selection fields for $select parameter represting current visible table column in correct order
			 * @returns {string} modified url with new selection fields
			 */
			modifyExportUrl: function (sExportUrl, selectionFields) {
				//Store the service url as it gets deleted after modifying parameters and recreating url
				var sServiceUrl = sExportUrl.split("?")[0];
				var parameters = "?" + sExportUrl.split("?")[1];
				//Create URLParsing object to parse $select parameters
				var oURLParser = new URLParsing();
				//Get the URL parameters
				var oParams = oURLParser.parseParameters(parameters);

				//Push the wanted fields into $select parameter
				oParams.$select.splice(0, oParams.$select.length); //clean up the array (=[] producing ESLint)
				oParams.$select.push(selectionFields.toString());

				return sServiceUrl + "?" + oURLParser.paramsToString(oParams);
			},

			addPadding: function (sInput, iFinalLength) {
				var sPaddedInput = sInput;

				while (sPaddedInput.length < iFinalLength) {
					sPaddedInput = "0" + sPaddedInput;
				}

				return sPaddedInput;
			}
		};
	}
);
