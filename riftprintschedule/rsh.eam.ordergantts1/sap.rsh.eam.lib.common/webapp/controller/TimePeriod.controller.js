/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/ui/core/date/UI5Date",
		"sap/rsh/eam/lib/common/utils/GanttUtils",
		"sap/rsh/eam/lib/common/utils/DateUtils"
	],
	function (BaseViewChildController, Utils, UI5Date, GanttUtils, DateUtils) {
		"use strict";

		return BaseViewChildController.extend("sap.rsh.eam.lib.common.controller.TimePeriod.controller", {
			onInitMembers: function () {
				this._oFilterBar = this._getFilterBar();
			},

			_getGanttDate: function (dDate) {
				return GanttUtils.getDateInGanttFormat(dDate);
			},

			_getFilterBar: function () {
				throw new Error("not implemented");
			},

			get: function () {
				throw new Error("not implemented");
			},

			getPeriodTypeNext4Weeks: function () {
				// Set the date to today + 4 weeks
				// Then set it to the previous Sunday
				var dStartDate = UI5Date.getInstance();
				var dEndDate = UI5Date.getInstance();
				dEndDate.setDate(dEndDate.getDate() + 28);
				dEndDate.setDate(dEndDate.getDate() - ((dEndDate.getDay() + 7) % 7));
				var oPeriodType = this._getEmptyPeriodType();
				oPeriodType.conditionTypeInfo.data.operation = "FISCALPERIOD0";
				oPeriodType.ranges.push({
					Operations: "BT",
					value1: dStartDate,
					value2: dEndDate
				});
				return oPeriodType;
			},

			getPeriodTypePast6Months: function () {
				var dEndDate = UI5Date.getInstance();
				dEndDate.setDate(dEndDate.getDate() - 1);
				var dStartDate = UI5Date.getInstance();
				dStartDate.setMonth(dStartDate.getMonth() - 6);
				var oPeriodType = this._getEmptyPeriodType();
				oPeriodType.conditionTypeInfo.data.operation = "FISCALPERIOD1";
				oPeriodType.conditionTypeInfo.data.value1 = dStartDate;
				oPeriodType.conditionTypeInfo.data.value2 = dEndDate;
				oPeriodType.ranges.push({
					Operations: "BT",
					value1: dStartDate,
					value2: dEndDate
				});
				return oPeriodType;
			},

			getPeriodTypeDateRange: function (dStartDate, dEndDate) {
				var oPeriodType = this._getEmptyPeriodType();
				oPeriodType.conditionTypeInfo.data.operation = "DATERANGE";
				oPeriodType.conditionTypeInfo.data.value1 = dStartDate;
				oPeriodType.conditionTypeInfo.data.value2 = dEndDate;
				oPeriodType.ranges.push({
					Operation: "BT",
					value1: dStartDate,
					value2: dEndDate,
					exclude: false,
					keyField: "PeriodType"
				});
				return oPeriodType;
			},
			getPeriodTypeThisWeek: function () {
				var oPeriodType = this._getEmptyPeriodType();
				oPeriodType.conditionTypeInfo.data.operation = "THISWEEK";
				oPeriodType.ranges.push({
					Operation: "BT",
					exclude: false,
					keyField: "PeriodType"
				});
				return oPeriodType;
			},
			getPeriodTypeNextWeek: function () {
				var oPeriodType = this._getEmptyPeriodType();
				oPeriodType.conditionTypeInfo.data.operation = "NEXTWEEK";
				oPeriodType.ranges.push({
					Operation: "BT",
					exclude: false,
					keyField: "PeriodType"
				});
				return oPeriodType;
			},

			getPeriodTypeDateRangePast6Months: function () {
				var dEndDate = UI5Date.getInstance();
				dEndDate.setDate(dEndDate.getDate() - 1);
				var dStartDate = UI5Date.getInstance();
				dStartDate.setMonth(dStartDate.getMonth() - 6);
				return this.getPeriodTypeDateRange(dStartDate, dEndDate);
			},

			getPeriodTypeTodayFromTo: function (sFromDays, sToDays) {
				var oPeriodType = this._getEmptyPeriodType();
				oPeriodType.conditionTypeInfo.data.operation = "TODAYFROMTO";
				oPeriodType.conditionTypeInfo.data.value1 = sFromDays;
				oPeriodType.conditionTypeInfo.data.value2 = sToDays;
				oPeriodType.ranges.push({
					Operation: "BT",
					value1: sFromDays,
					value2: sToDays,
					exclude: false,
					keyField: "PeriodType"
				});
				return oPeriodType;
			},

			_getEmptyPeriodType: function () {
				return {
					conditionTypeInfo: {
						name: "custom.oDateRange",
						data: {
							calendarType: "Gregorian",
							key: "PeriodType"
						}
					},
					ranges: []
				};
			},

			getNavParams: function () {
				var sPeriodType = this._oFilterBar.getFilterData().PeriodType.conditionTypeInfo.data.operation;
				if (sPeriodType === "FISCALPERIOD0") {
					sPeriodType = "SAP_EAM_RSH_NEXT4WEEK";
				} else if (sPeriodType === "FISCALPERIOD1") {
					sPeriodType = "DATERANGE";
				}
				var oNavParams = { PeriodType: sPeriodType };

				if (sPeriodType === "TODAYFROMTO") {
					var oPeriodTypeData = this._oFilterBar.getFilterData().PeriodType.conditionTypeInfo.data;
					var iPeriodFrom = oPeriodTypeData.value1;
					var iPeriodTo = oPeriodTypeData.value2;
					oNavParams.PeriodFrom = iPeriodFrom;
					oNavParams.PeriodTo = iPeriodTo;
				} else if (sPeriodType === "DATERANGE") {
					var oTimePeriod = this.get();
					var dStartDate = oTimePeriod.originalStartDate;
					var dEndDate = oTimePeriod.originalEndDate;
					oNavParams.PeriodStartDate = Utils.convertDateToGatewayString(dStartDate, false);
					oNavParams.PeriodEndDate = Utils.convertDateToGatewayString(dEndDate, false);
				}
				return oNavParams;
			},
			
			getFilterTimePeriod: function () {
				var dStart;
				var dEnd;

				var oFilterData = this._oFilterBar.getFilterData();
				if (!oFilterData || (oFilterData && !oFilterData.PeriodType)) {
					dStart = UI5Date.getInstance();
					dEnd = UI5Date.getInstance();
					dEnd.setDate(dEnd.getDate() + 28);
					dEnd.setDate(dEnd.getDate() - ((dEnd.getDay() + 7) % 7));
				} else {
					dStart = UI5Date.getInstance(oFilterData.PeriodType.ranges[0].value1);
					dEnd = UI5Date.getInstance(oFilterData.PeriodType.ranges[0].value2);
					// In UI5 Version 1.112: 	Date Picker had returned 	end = 25.04. 23:59:59 for entered interval 24.04. - 24.04.
					// In Latest UI5 Version: 	Date Picker will return 	end = 24.04. 06:00:00 for entered interval 24.04. - 24.04.
					// Therefore correction needed here to +1 day for the FilterEnd
					dEnd.setDate(dEnd.getDate() + 1);
				}

				var sSystemTimeZone = this.controllers.systemTimeZone.get();

				var oStartDateAndTime = DateUtils.getDateTimeInTimeZone(dStart, sSystemTimeZone);
				var oEndDateAndTime = DateUtils.getDateTimeInTimeZone(dEnd, sSystemTimeZone);

				return {
					startDate: oStartDateAndTime.date,
					endDate: oEndDateAndTime.date,
					startTime: oStartDateAndTime.time,
					endTime: oEndDateAndTime.time
				};
			}
			
		});
	}
);
