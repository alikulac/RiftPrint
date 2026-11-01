/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/date/UI5Date"], function (UI5Date) {
	"use strict";

	var oDateUtils;

	oDateUtils = {
		getDateWithEndOfDay: function (dDate) {
			var dChangedDate = UI5Date.getInstance(dDate);
			dChangedDate = UI5Date.getInstance(dChangedDate.setHours(23, 59, 59, 0));
			return dChangedDate;
		},

		getDateWithStartOfDay: function (dDate) {
			var dChangedDate = UI5Date.getInstance(dDate);
			dChangedDate = UI5Date.getInstance(dChangedDate.setHours(0, 0, 0, 0));
			return dChangedDate;
		},

		getDateIncrementedByIndex: function (dDate, iIndex) {
			var dChangedDate = UI5Date.getInstance(dDate);
			dChangedDate = UI5Date.getInstance(dChangedDate.setDate(dChangedDate.getDate() + iIndex));
			return dChangedDate;
		},

		getUI5Date: function (dJsDate) {
			return dJsDate ? UI5Date.getInstance(dJsDate) : null;
		},

		getDateTimeInTimeZone: function (dDate, sTimeZone) {
			var sLocalString = dDate.toLocaleString("en-US", { timeZone: sTimeZone });
			var dDateInSystemTimezone = new Date(sLocalString);
			var dDateStartOfDay = oDateUtils.getDateWithStartOfDay(dDateInSystemTimezone);
			var sTime = oDateUtils._convertTimezone(dDateStartOfDay, sTimeZone);
			var sFormattedTime = oDateUtils._getFormattedTime(sTime);
			return {
				date: dDateInSystemTimezone,
				time: sFormattedTime
			};
		},

		_convertTimezone: function (dDate, sTimezone) {
			var sTime = dDate.toLocaleString("de-DE", {
				timeZone: sTimezone,
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit"
			});
			return sTime;
		},

		_getFormattedTime: function (sTime) {
			var sFormattedTime = "PT" + sTime.substring(0, 2) + "H" + sTime.substring(3, 5) + "M" + sTime.substring(6, 8) + "S";
			return sFormattedTime;
		}
	};

	return oDateUtils;
});
