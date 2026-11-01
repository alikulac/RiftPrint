/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/ui/model/Filter",
		"sap/rsh/eam/lib/common/utils/utils"
	],
	function (BaseViewChildController, Filter, Utils) {
		"use strict";

		return BaseViewChildController.extend("zrsh.eam.ordergantts1.mvc.ordergantt.binding.Filters.controller", {
			onInitMembers: function () {
				this._oFilterBar = this.byId("idOrderGanttSmartFilterBar");
			},

			// before cleanup: SchedulingBoard.updateTableBindingWithFiltersFromSmartFB
			get: function () {
				var oFiltersFromSmartFB = this._oFilterBar.getFilters();
				if (Utils.isMockRun()) {
					return oFiltersFromSmartFB;
				}

				var oTimePeriod = this.controllers.timePeriod.getFilterTimePeriod();
				var oAdditionalDateRangeFilterBlock = this._getAdditionalDateRangeFilterBlock(oTimePeriod);

				if (oFiltersFromSmartFB && oFiltersFromSmartFB.length === 1) {
					var oMergedFilterBlock = new Filter({
						filters: [oFiltersFromSmartFB[0], oAdditionalDateRangeFilterBlock],
						and: true
					});
					var aExistingFilters = oMergedFilterBlock.aFilters[0].aFilters;
					var filterCount = 0;
					for (; filterCount < aExistingFilters.length; filterCount++) {
						if (
							(aExistingFilters[filterCount].sPath && aExistingFilters[filterCount].sPath === "PeriodType") ||
							(aExistingFilters[filterCount].aFilters && aExistingFilters[filterCount].aFilters[0].sPath === "PeriodType")
						) {
							aExistingFilters.splice(filterCount, 1);
						}
						if (
							(aExistingFilters[filterCount] &&
								aExistingFilters[filterCount].sPath &&
								aExistingFilters[filterCount].sPath === "MaintOpIsAssignedToPeople") ||
							(aExistingFilters[filterCount] &&
								aExistingFilters[filterCount].aFilters &&
								aExistingFilters[filterCount].aFilters[0].sPath === "MaintOpIsAssignedToPeople")
						) {
							var oAssignPeopleFilter = this._getAssignedPeopleFilter(aExistingFilters[filterCount]);
							// Replace MaintOpIsAssignedToPeople filter with AssignedPersons filter
							aExistingFilters.splice(filterCount, 1);
							aExistingFilters.push(oAssignPeopleFilter);
						}
					}
					if (aExistingFilters.length === 0) {
						oMergedFilterBlock.aFilters.splice(0, 1);
					}
					return oMergedFilterBlock;
				} else {
					return oAdditionalDateRangeFilterBlock;
				}
			},

			_getAssignedPeopleFilter: function (oAssignFilter) {
				var sOperator;
				var sFilterValue = oAssignFilter.getFilters() ? oAssignFilter.getFilters()[0].oValue1 : oAssignFilter.oValue1;
				if (sFilterValue === "X") {
					sOperator = "NE";
				} else {
					sOperator = "EQ";
				}
				var oAssignPeopleFilter = new Filter({
					path: "AssignedPerson",
					value1: null,
					operator: sOperator
				});
				return oAssignPeopleFilter;
			},

			_getAdditionalDateRangeFilterBlock: function (oTimePeriod) {

				var oForward = new Filter({ path: "SchedulingIsPerformedBackward", operator: "EQ", value1: " " });
				var oBackward = new Filter({ path: "SchedulingIsPerformedBackward", operator: "EQ", value1: "X" });

				var oEE1 = new Filter({
					path: "OpErlstSchedldExecEndDte",
					operator: "GT",
					value1: oTimePeriod.startDate
				});
				var oEE2 = new Filter({
					path: "OpErlstSchedldExecEndDte",
					operator: "EQ",
					value1: oTimePeriod.startDate
				});
				var oEE3 = new Filter({
					path: "OpErlstSchedldExecEndTme",
					operator: "GT",
					value1: oTimePeriod.endTime
				});

				var oES1 = new Filter({
					path: "OpErlstSchedldExecStrtDte",
					operator: "LT",
					value1: oTimePeriod.endDate
				});
				var oES2 = new Filter({
					path: "OpErlstSchedldExecStrtDte",
					operator: "EQ",
					value1: oTimePeriod.endDate
				});
				var oES3 = new Filter({
					path: "OpErlstSchedldExecStrtTme",
					operator: "LT",
					value1: oTimePeriod.startTime
				});

				var oLE1 = new Filter({
					path: "OpLtstSchedldExecEndDte",
					operator: "GT",
					value1: oTimePeriod.startDate
				});
				var oLE2 = new Filter({
					path: "OpLtstSchedldExecEndDte",
					operator: "EQ",
					value1: oTimePeriod.startDate
				});
				var oLE3 = new Filter({
					path: "OpLtstSchedldExecEndTme",
					operator: "GT",
					value1: oTimePeriod.endTime
				});

				var oLS1 = new Filter({
					path: "OpLtstSchedldExecStrtDte",
					operator: "LT",
					value1: oTimePeriod.endDate
				});
				var oLS2 = new Filter({
					path: "OpLtstSchedldExecStrtDte",
					operator: "EQ",
					value1: oTimePeriod.endDate
				});
				var oLS3 = new Filter({
					path: "OpLtstSchedldExecStrtTme",
					operator: "LT",
					value1: oTimePeriod.startTime
				});

				var oEE = new Filter({ and: false, filters: [oEE1, new Filter({ and: true, filters: [oEE2, oEE3] })] });
				var oES = new Filter({ and: false, filters: [oES1, new Filter({ and: true, filters: [oES2, oES3] })] });
				var oLE = new Filter({ and: false, filters: [oLE1, new Filter({ and: true, filters: [oLE2, oLE3] })] });
				var oLS = new Filter({ and: false, filters: [oLS1, new Filter({ and: true, filters: [oLS2, oLS3] })] });

				var oFinalForward = new Filter({ and: true, filters: [oForward, oEE, oES] });
				var oFinalBackward = new Filter({ and: true, filters: [oBackward, oLE, oLS] });

				var oFilter = new Filter({ and: false, filters: [oFinalForward, oFinalBackward] });

				return oFilter;
			}
		});
	}
);
