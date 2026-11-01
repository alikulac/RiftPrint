/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/ui/core/format/DateFormat",
		"sap/rsh/eam/lib/common/utils/GanttUtils",
		"sap/ui/core/date/UI5Date",
		"sap/ui/core/format/NumberFormat",
		"sap/ui/core/Configuration"
	],
	function (Constants, DateFormat, GanttUtils, UI5Date, NumberFormat, Configuration) {
		"use strict";

		return {
			oNumberFormatter: NumberFormat.getInstance({
				locale: Configuration.getLocale()
			}),
			
			/**
			 * Rounds the number unit value to 2 digits
			 * @public
			 * @param {string} sValue the number string to be rounded
			 * @returns {string} sValue with 2 digits rounded
			 */
			numberUnit: function (sValue) {
				if (!sValue) {
					return "";
				}
				return parseFloat(sValue).toFixed(2);
			},
			/**
			 * Removes leading zeros only for row level which is not zero
			 * @public
			 * @param {Integer} OrderOperationRowLevel the row level
			 * @param {string} sValue the number string to remove leading zeros
			 * @returns {string} sValueWithoutLeadingZeros after removing leading zeros
			 */
			removeLeadingZeros: function (OrderOperationRowLevel, sValue) {
				if (OrderOperationRowLevel !== 0) {
					var sValueWithoutLeadingZeros = sValue;
					sValueWithoutLeadingZeros = +sValueWithoutLeadingZeros;
					return sValueWithoutLeadingZeros;
				} else {
					return undefined;
				}
			},
			/**
			 * Change the colours of the words in the column "Processing Status"
			 * @public
			 * @param {string} status the string to change the colour
			 * @returns {string} the string that have the corresponding colour
			 */
			statusColor: function (status) {
				switch (status) {
					case 20: // Due
						return "Warning";
					case 25: // Scheduled
						return "Success";
					case 30: // Dispatched
						return "Success";
					case 40: // In Process
						return "None";
					default:
						return "None";
				}
			},

			/**
			 * Change the colours of the words in the column "MaintOrdOpSimulationStatusText"
			 * @public
			 * @param {string} status the string to change the colour
			 * @returns {string} the string that have the corresponding colour
			 */
			schedulingColor: function (status) {
				switch (status) {
					case "10": // Draft
						return sap.ui.core.ValueState.None;
					case "20": // Error
						return sap.ui.core.ValueState.Error;
					case "21": // Object Locked
						return sap.ui.core.ValueState.Error;
					default:
						return sap.ui.core.ValueState.None;
				}
			},

			/**
			 * Change the colours of the words in the column "Material Status"
			 * @public
			 * @param {string} status the string to change the colour
			 * @returns {string} the string that have the corresponding colour
			 */
			materialStatusColor: function (status) {
				switch (status) {
					case 10:
						return "Error";
					case 20:
						return "Warning";
					case 30:
						return "None";
					case 40:
						return "Success";
					default:
						return "None";
				}
			},

			//Usage of this function need to be stopped. Single time fields can't be evaluated without the corresponding date as the timezone offset
			//can be different due to daylight saving
			formatTime: function (oTime) {
				if (!oTime) {
					return oTime;
				}
				return sap.ui.core.format.DateFormat.getDateTimeWithTimezoneInstance({
					showTimezone: false,
					showDate: false
				}).format(UI5Date.getInstance(oTime.ms));
			},

			/** Formatter for Concatinating Opertion & Sub-Operation
			 * @public
			 * @param {String} [sOperation] Operation
			 * @param {String} [sSubOperation] Sub Operation
			 * @return {String} Concatenated value of Operation/SubOperation
			 **/
			formatSubOperation: function (sOperation, sSubOperation) {
				if (!sOperation) {
					return false;
				}
				if (!sSubOperation) {
					return sOperation;
				} else {
					return sOperation + "/" + sSubOperation;
				}
			},

			formatDate: function (oMaxDate, bUseUTC) {
				var oDate = new Date(oMaxDate);

				var oLocale = sap.ui.getCore().getConfiguration().getLocale();
				var oDateFormatter = DateFormat.getInstance({
					locale: oLocale
				});

				if (isNaN(oDate.valueOf())) {
					oDate = oDateFormatter.parse(oMaxDate);
				}

				var oFormattedDate = oDateFormatter.format(oDate, bUseUTC);

				return oFormattedDate;
			},

			/**
			 * Function that is call for formatting the time in PTHMS format
			 * @public --------------------------------------
			 * @param {date} [date] javascript Date
			 * @return {Date} formatted date with user entered time
			 */
			formatTimeToPTHMSFormat: function (date) {
				var dDate = date;
				if (!dDate) {
					dDate = new Date();
				}
				var oTimeFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: "'PT'H'H'mm'M'ss'S'"
				});
				return oTimeFormat.format(dDate);
			},

			/*
			 * Change the icon of the orders"
			 * @public
			 * @param {string} rowLevel the string to change the icon
			 * @returns {string} the string that have the corresponding icon
			 */
			imageOrder: function (rowLevel) {
				if (rowLevel === 0) {
					return "sap-icon://chevron-phase-2";
				} else {
					return "sap-icon://circle-task-2";
				}
			},

			/*
			 * Change the tooltip of the orders"
			 * @public
			 * @param {string} status the string to change the tooltip
			 * @returns {string} the string that have the corresponding tooltip
			 */
			imageTooltip: function (rowLevel) {
				if (rowLevel === 0) {
					return this.getResourceBundle().getText("titleOrderPopup");
				} else {
					return this.getResourceBundle().getText("operation");
				}
			},

			formatDuration: function (sDuration) {
				return this.oNumberFormatter.format(sDuration);
			},
			
			parseLocaleNumber: function (sNumber) {
				return this.oNumberFormatter.parse(sNumber);
			},
			
			/**
			 * return the i18n locale text for given key
			 * @public
			 * @param {string} sResourceText key for text of i18n file
			 * @returns {string} text from i18n
			 */
			formatI18nText: function (sResourceText) {
				return this.getResourceBundle().getText(sResourceText);
			},

			/**
			 * Retunr status color for Assigned and unassigned status
			 * @param {integer} status incoming status
			 * @returns {string} state to define status color
			 */
			assignmentStatusColor: function (status) {
				switch (status) {
					case 10: // Unassigned
						return "Warning";
					case 20: // Assigned
						return "Success";
					default:
						return "None";
				}
			},

			/**
			 * format activity type for show code and description together
			 * @param {string} formatActivityType Activity Type
			 * @param {string} activityTypeName Activity Type name
			 * @returns {string} The concatenated display for activity type column in operation table.
			 */
			formatActivityType: function (formatActivityType, activityTypeName) {
				if (formatActivityType && activityTypeName) {
					return activityTypeName + " (" + formatActivityType + ")";
				} else {
					return undefined;
				}
			},

			/**
			 * Returnes the Icon based on the the message with the highest severity
			 * @param {array} aMessages - array of the messages to be rated
			 * @returns {string} sIcon
			 */
			messageButtonIconFormatter: function (aMessages) {
				var sIcon;
				aMessages.forEach(function (sMessage) {
					switch (sMessage.type) {
						case "Error":
							sIcon = "sap-icon://message-error";
							break;
						case "Warning":
							sIcon = sIcon !== "sap-icon://message-error" ? "sap-icon://message-warning" : sIcon;
							break;
						case "Success":
							sIcon = sIcon !== "sap-icon://message-error" && sIcon !== "sap-icon://message-warning" ? "sap-icon://message-success" : sIcon;
							break;
						default:
							sIcon = !sIcon ? "sap-icon://message-information" : sIcon;
							break;
					}
				});

				return sIcon;
			},

			/**
			 * Returnes the message type based on the the message with the highest severity
			 * @param {array} aMessages - array of the messages to be rated
			 * @returns {string} sHighestSeverity
			 */
			messageButtonTypeFormatter: function (aMessages) {
				var sHighestSeverity;
				aMessages.forEach(function (sMessage) {
					switch (sMessage.type) {
						case "Error":
							sHighestSeverity = "Negative";
							break;
						case "Warning":
							sHighestSeverity = sHighestSeverity !== "Negative" ? "Critical" : sHighestSeverity;
							break;
						case "Success":
							sHighestSeverity = sHighestSeverity !== "Negative" && sHighestSeverity !== "Critical" ? "Success" : sHighestSeverity;
							break;
						default:
							sHighestSeverity = !sHighestSeverity ? "Neutral" : sHighestSeverity;
							break;
					}
				});

				return sHighestSeverity;
			},

			/**
			 * Returnes the count of message with the highest severity
			 * @param {string} sHighestSeverityIconType - highest severity message type
			 * @param {array} aMessages - array of the messages to be rated
			 * @returns {string} count
			 */
			countHighestSeverityMessages: function (sHighestSeverityIconType, aMessages) {
				var sHighestSeverityMessageType;
				switch (sHighestSeverityIconType) {
					case "Negative":
						sHighestSeverityMessageType = "Error";
						break;
					case "Critical":
						sHighestSeverityMessageType = "Warning";
						break;
					case "Success":
						sHighestSeverityMessageType = "Success";
						break;
					default:
						sHighestSeverityMessageType = !sHighestSeverityMessageType ? "Information" : sHighestSeverityMessageType;
						break;
				}

				return (
					aMessages.reduce(function (iNumberOfMessages, oMessageItem) {
						var iNoOfMessages = iNumberOfMessages;
						return oMessageItem.type === sHighestSeverityMessageType ? ++iNoOfMessages : iNoOfMessages;
					}, 0) || ""
				);
			},

			/**
			 * Returns the background color for the avatar in assign person dialog
			 * @param {String} sPersonResponsibleID Operation Person Responsible ID
			 * @returns {String} The accent to be used as background for avatars
			 */
			personResponsibleAvatarColor: function (sPersonResponsibleID) {
				if (sPersonResponsibleID) {
					var sLastDigit = sPersonResponsibleID.charAt(sPersonResponsibleID.length - 1);
					if (sLastDigit === "0") {
						return "Accent10";
					}
					return "Accent" + sLastDigit;
				} else {
					return "Accent6";
				}
			},

			/**
			 * Returns the initials for the avatar in assign person dialog
			 * @param {String} sOperationPersonResponsibleName Operation Person Responsible Name
			 * @returns {String} Initials of the person
			 */
			personResponsibleAvatarInitials: function (sOperationPersonResponsibleName) {
				if (sOperationPersonResponsibleName) {
					var aStringComponents = sOperationPersonResponsibleName.split(" ");
					if (aStringComponents.length < 3 && aStringComponents.length > 0) {
						var sInitials = "";
						aStringComponents.forEach(function (sName) {
							sInitials = sInitials + sName[0];
						});
						return sInitials;
					}
				}
				return undefined;
			},

			/**
			 * Formatter method for Combined Date/Time fields
			 * @public
			 * @param {DateTim} [dDateTime] Timestamp of Combined Start/End Date/Time
			 * @returns {String} Text to be displayed in the Combined Start/End column
			 */
			formatCombinedDateTime: function (dDateTime) {
				return dDateTime ? GanttUtils._formatToLocale(GanttUtils.removeTimeZoneOffset(dDateTime)) : dDateTime;
			},

			formatDurationUnit: function (UnitOfMeasureLongName, UnitOfMeasure) {
				return UnitOfMeasureLongName + " (" + UnitOfMeasure + ")";
			}
		};
	}
);
