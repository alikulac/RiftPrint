/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/gantt/def/cal/Calendar",
		"sap/gantt/def/cal/TimeInterval",
		"sap/rsh/eam/lib/common/utils/GanttUtils",
		"sap/ui/core/date/UI5Date"
	],
	function (BaseViewChildController, Calendar, TimeInterval, GanttUtils, UI5Date) {
		"use strict";

		return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.ordergantt.binding.CalendarBinding.controller", {

			onInitMembers: function () {
				this._oCalendarDef = this.byId("idCalDef");
				this._sBoundStartDatetime = undefined;
				this._sBoundEndDatetime = undefined;
			},

			// before cleanup: SchedulingBoard.bindCalendarDefHelper
			bind: function (bForce) {
				var bShowNonWorkingTimes = this.oUIModel.getProperty("/showNonWorkingTimes");
				if (bShowNonWorkingTimes) {
					var oTimePeriod = this.controllers.timePeriod.get();
					var bRequired = this._bindRequired(bForce, oTimePeriod);
					if (bRequired) {
						this._bind(oTimePeriod);
					}
				} else {
					this._oCalendarDef.unbindDefs();
				}
			},

			_bindRequired: function (bForce, oTimePeriod) {
				return (
					bForce ||
					this._sBoundStartDatetime !== oTimePeriod.workCenterCalendarStartDate ||
					this._sBoundEndDatetime !== oTimePeriod.workCenterCalendarEndDate ||
					!this._oCalendarDef.getDefs().length
				);
			},

			_bind: function (oTimePeriod) {
				this._oCalendarDef.bindAggregation("defs", {
					path:
						"/C_RSHOrderGanttCalendar(P_StartDate=datetime'" +
						oTimePeriod.workCenterCalendarStartDate +
						"',P_EndDate=datetime'" +
						oTimePeriod.workCenterCalendarEndDate +
						"')/Set",
					parameters: {
						expand: "to_Intervals",
						//pass the groupID to separate Calendar and OrderOperation batch calls making them parallel
						groupId: "GetCalendars"
					},
					events: {
						change: function () {
							this._sBoundStartDatetime = oTimePeriod.workCenterCalendarStartDate;
							this._sBoundEndDatetime = oTimePeriod.workCenterCalendarEndDate;
						}.bind(this)
					},
					template: new Calendar({
						key: "{WorkCenterInternalID}",
						backgroundColor: "sapList_AlternatingBackground",
						timeIntervals: {
							path: "to_Intervals",
							templateShareable: false,
							template: new TimeInterval({
								startTime: {
									path: "WorkCenterNonAvailStrtDteTme",
									formatter: GanttUtils.getDateInGanttFormat
								},
								endTime: {
									path: "WorkCenterNonAvailEndDteTme",
									formatter: GanttUtils.getDateInGanttFormat
								}
							})
						}
					})
				});
			}
		});
	}
);
