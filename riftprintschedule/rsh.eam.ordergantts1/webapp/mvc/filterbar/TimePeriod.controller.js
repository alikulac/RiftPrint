/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/rsh/eam/lib/common/controller/TimePeriod.controller", "sap/rsh/eam/lib/common/utils/utils", "sap/ui/core/date/UI5Date"],
	function (TimePeriodController, Utils, UI5Date) {
		"use strict";

		return TimePeriodController.extend("zrsh.eam.ordergantts1.mvc.filterbar.TimePeriod.controller", {
			// before cleanup: SchedulingBoard.getPeriodTypeData
			getPeriodType: function (oStartupParams) {
				var sPeriodType = oStartupParams.PeriodType && oStartupParams.PeriodType[0];

				if (sPeriodType === "SAP_EAM_RSH_NEXT4WEEK") {
					return this.getPeriodTypeNext4Weeks();
				} else if (sPeriodType === "DATERANGE") {
					var sStartDate = oStartupParams.PeriodStartDate && oStartupParams.PeriodStartDate[0];
					var sEndDate = oStartupParams.PeriodEndDate && oStartupParams.PeriodEndDate[0];
					var dStartDate = this._convertDate(sStartDate);
					var dEndDate = this._convertDate(sEndDate);
					return this.getPeriodTypeDateRange(dStartDate, dEndDate);
				} else if (sPeriodType === "TODAYFROMTO") {
					var iPeriodFrom = oStartupParams.PeriodFrom && oStartupParams.PeriodFrom[0];
					var iPeriodTo = oStartupParams.PeriodTo && oStartupParams.PeriodTo[0];
					return this.getPeriodTypeTodayFromTo(iPeriodFrom, iPeriodTo);
				} else if (sPeriodType === "THISWEEK") {
					return this.getPeriodTypeThisWeek();
				} else if (sPeriodType === "NEXTWEEK") {
					return this.getPeriodTypeNextWeek();
				} else if (sPeriodType === "FUTURE" || sPeriodType === "PAST" || sPeriodType === "CUSTOM_TODAYFROMTO" || sPeriodType === "CUSTOM") {
					//old values : no longer sent by parameters , default value set
					return this.getPeriodTypeNext4Weeks();
				} else {
					throw new Error("unhandled period type: " + sPeriodType + ", " + sStartDate + ", " + sEndDate);
				}
			},

			_convertDate: function (sDate) {
				var sDateDecoded = decodeURIComponent(sDate);
				var oDate = UI5Date.getInstance(sDateDecoded);
				if (oDate instanceof Date && !isNaN(oDate)) {
					return Utils.convertDateToGatewayString(oDate);
				} else {
					throw Error("failed to convert date " + sDate);
				}
			},
			_getFilterBar: function () {
				return this.byId("idOrderGanttSmartFilterBar");
			},

			// sets time period to four weeks
			// before cleanup: SchedulingBoard.setDefaultDateRange
			setDefault: function () {
				var oFilterData = {
					PeriodType: {
						conditionTypeInfo: {
							name: "custom.oDateRange",
							data: {
								calendarType: "Gregorian",
								key: "PeriodType",
								value1: UI5Date.getInstance(),
								value2: Utils.getEndDateNext(),
								operation: "FISCALPERIOD0"
							}
						}
					}
				};
				this._oFilterBar.setFilterData(oFilterData);
			},

			/*
			 * returns e.g.
			 * {
			 *     startDate: "2022-12-08T23:00:00.626Z", // before cleanup: CalendarStartDate
			 *     endDate: "2023-01-14T23:00:00.626Z", // before cleanup: CalendarEndDate
			 *     ganttStartTime: "20221209000000", // before cleanup: InitStartDate
			 *     ganttEndTime: "20230115000000", // before cleanup: InitEndDate
			 *     adjustedStartDate: "2022-12-09T00:00:00.000Z", // before cleanup: oPeriodTypeDates.oStartDate
			 *     adjustedEndDate: "2023-01-15T00:00:00.000Z", // before cleanup: oPeriodTypeDates.oEndDate
			 *     workCenterCalendarStartDate: "2022-12-08T00%3A00%3A00",
			 *     workCenterCalendarEndDate: "2023-01-14T00%3A00%3A00"
			 * }
			 */
			// before cleanup: SchedulingBoard._getCurrentTimePeriod
			get: function () {
				var dStartDate;
				var dEndDate;
				var dOriginalStartDate, dOriginalEndDate;
				var dWorkCenterCalendarStartDate, dWorkCenterCalendarEndDate;

				if (
					this._oFilterBar.isInitialised() &&
					this._oFilterBar.getFilterData() &&
					(this._oFilterBar.getFilterData().PeriodType.conditionTypeInfo.data.operation === "DATERANGE" ||
						this._oFilterBar.getFilterData().PeriodType.conditionTypeInfo.data.operation === "TODAYFROMTO" ||
						this._oFilterBar.getFilterData().PeriodType.conditionTypeInfo.data.operation === "THISWEEK" ||
						this._oFilterBar.getFilterData().PeriodType.conditionTypeInfo.data.operation === "NEXTWEEK")
				) {
					if (Utils.isMockRun()) {
						var dDate1 = this._oFilterBar.getFilterData().PeriodType.conditionTypeInfo.data.value1;
						dStartDate = this._oFilterBar.getFilterData().PeriodType.conditionTypeInfo.data.value1;
					} else {
						//added date object copy to prevent contamination of the original date object
						//this will prevent the date to keep increasing whent he go button is pressed again and again
						var dDate1 = this._oFilterBar.getFilterData().PeriodType.ranges[0].value1;
						dStartDate = UI5Date.getInstance(dDate1);
					}

					dOriginalStartDate = UI5Date.getInstance(dStartDate.getTime());
					var dDate2 = this._oFilterBar.getFilterData().PeriodType.ranges[0].value2;
					dEndDate = UI5Date.getInstance(dDate2);
					dOriginalEndDate = UI5Date.getInstance(dEndDate.getTime());
					dEndDate.setDate(dEndDate.getDate() + 1);
				} else {
					// Handling for next 4 weeks:
					// To get the correct ending date of one week after selection date, increment needs to be dynamical
					// Set the horizon from -1 week from current date to next 5 weeks
					dStartDate = UI5Date.getInstance();
					dEndDate = UI5Date.getInstance();
					var iIncrementEndDate = 35 - dEndDate.getDay();
					dStartDate.setDate(dStartDate.getDate() - 7);
					dEndDate.setDate(dEndDate.getDate() + iIncrementEndDate);
					dOriginalStartDate = UI5Date.getInstance(dStartDate.getTime());
					dOriginalEndDate = UI5Date.getInstance(dEndDate.getTime());
				}
				dStartDate.setHours(0, 0, 0);
				dEndDate.setHours(0, 0, 0);

				// At both edges, request one day more, so that calendar covers missing work center availability caused by time zone deviations
				dWorkCenterCalendarStartDate = UI5Date.getInstance(dStartDate);
				dWorkCenterCalendarStartDate.setDate(dStartDate.getDate() - 1);
				dWorkCenterCalendarEndDate = UI5Date.getInstance(dEndDate);
				dWorkCenterCalendarEndDate.setDate(dEndDate.getDate() + 1);

				var oTimePeriod = {
					startDate: dStartDate,
					endDate: dEndDate,
					originalStartDate: dOriginalStartDate,
					originalEndDate: dOriginalEndDate,
					ganttStartTime: this._getGanttDate(dStartDate),
					ganttEndTime: this._getGanttDate(dEndDate),
					adjustedStartDate: Utils.getAdjustedDate(dStartDate),
					adjustedEndDate: Utils.getAdjustedDate(dEndDate),
					workCenterCalendarStartDate: Utils.isMockRun()
						? "2021-01-31T00%3A00%3A00"
						: Utils.convertDateToGatewayString(dWorkCenterCalendarStartDate, true),
					workCenterCalendarEndDate: Utils.isMockRun()
						? "2021-01-31T00%3A00%3A00"
						: Utils.convertDateToGatewayString(dWorkCenterCalendarEndDate, true)
				};

				return oTimePeriod;
			},

			onAfterVariantLoad: function (oEvent) {
				var sContext = oEvent.getParameter("context");
				var oDateRangeControl = this._oFilterBar.getControlByKey("PeriodType");
				var bNoContextNoValue = !sContext && !oDateRangeControl.getValue();
				var bResetStandardVariant = sContext === "RESET" && !!this._oFilterBar.isCurrentVariantStandard();
				if (bNoContextNoValue || bResetStandardVariant) {
					this.setDefault();
				}
			}
		});
	}
);
