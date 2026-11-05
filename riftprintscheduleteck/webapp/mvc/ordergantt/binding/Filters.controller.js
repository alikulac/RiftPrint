/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/ui/model/Filter",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/rsh/eam/lib/common/utils/FilterUtils"
	],
	function (BaseViewChildController, Filter, Utils, FilterUtils) {
		"use strict";

		return BaseViewChildController.extend("zrsh.eam.ordergantts1.mvc.ordergantt.binding.Filters.controller", {
			onInitMembers: function () {
				this._oFilterBar = this.byId("idOrderGanttSmartFilterBar");
			},

			// before cleanup: SchedulingBoard.updateTableBindingWithFiltersFromSmartFB
			get: function () {
				if (Utils.isMockRun()) {
					return this._getMockRun();
				} else {
					return this._get();
				}
			},

			_get: function () {
				var oFilterFromSmartFB = this._oFilterBar.getFilters()[0];
				var oTimePeriod = this.controllers.timePeriod.getFilterTimePeriod();
				var oFilterUtils = new FilterUtils();
				var oAdditionalDateRangeFilterBlock = oFilterUtils.getAdditionalDateRangeFilterBlock(oTimePeriod);

				if (!oFilterFromSmartFB) {
					return oAdditionalDateRangeFilterBlock;
				}
				var aFiltersFromSmartFB = oFilterFromSmartFB.aFilters;

				this._removePeriodTypeFilter(aFiltersFromSmartFB);
				this._replaceAssignedPeopleFilter(aFiltersFromSmartFB);

				if (aFiltersFromSmartFB.length === 0) {
					return oAdditionalDateRangeFilterBlock;
				} else {
					return new Filter({
						filters: [oFilterFromSmartFB, oAdditionalDateRangeFilterBlock],
						and: true
					});
				}
			},

			_getMockRun: function () {
				var oFilterFromSmartFB = this._oFilterBar.getFilters()[0];
				if (oFilterFromSmartFB) {
					var aFiltersFromSmartFB = oFilterFromSmartFB.aFilters;
					this._replaceAssignedPeopleFilter(aFiltersFromSmartFB);
				}
				return oFilterFromSmartFB;
			},

			_removePeriodTypeFilter: function (aFiltersFromSmartFB) {
				for (var i = 0; i < aFiltersFromSmartFB.length; i++) {
					if (
						(aFiltersFromSmartFB[i].sPath && aFiltersFromSmartFB[i].sPath === "PeriodType") ||
						(aFiltersFromSmartFB[i].aFilters && aFiltersFromSmartFB[i].aFilters[0].sPath === "PeriodType")
					) {
						aFiltersFromSmartFB.splice(i, 1);
						break;
					}
				}
			},

			_replaceAssignedPeopleFilter: function (aFiltersFromSmartFB) {
				for (var i = 0; i < aFiltersFromSmartFB.length; i++) {
					if (
						(aFiltersFromSmartFB[i].sPath && aFiltersFromSmartFB[i].sPath === "MaintOpIsAssignedToPeople") ||
						(aFiltersFromSmartFB[i].aFilters && aFiltersFromSmartFB[i].aFilters[0].sPath === "MaintOpIsAssignedToPeople")
					) {
						var oAssignPeopleFilter = this._getAssignedPeopleFilter(aFiltersFromSmartFB[i]);
						aFiltersFromSmartFB.splice(i, 1);
						aFiltersFromSmartFB.push(oAssignPeopleFilter);
						break;
					}
				}
			},

			_getAssignedPeopleFilter: function (oAssignFilter) {
				var bPeopleAreAssigned = oAssignFilter.getFilters() ? oAssignFilter.getFilters()[0].oValue1 : oAssignFilter.oValue1;
				var sOperator = bPeopleAreAssigned ? "NE" : "EQ";

				var oAssignPeopleFilter = new Filter({
					path: "AssignedPerson",
					value1: null,
					operator: sOperator
				});
				return oAssignPeopleFilter;
			}
		});
	}
);
