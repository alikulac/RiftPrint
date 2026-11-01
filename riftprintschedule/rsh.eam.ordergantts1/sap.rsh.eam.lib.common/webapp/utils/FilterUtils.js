/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object", "sap/ui/model/Filter", "sap/ui/model/FilterOperator"], function (oSAPObject, Filter, FilterOperator) {
	"use strict";

	return oSAPObject.extend("sap.rsh.eam.lib.common.utils.FilterUtils", {
		flattenFilters: function (aIncomingFilters) {
			var aFilters;
			aFilters = [];

			for (var i = 0; i < aIncomingFilters.length; i++) {
				if (aIncomingFilters[i]._bMultiFilter) {
					//_bMultiFilter denotes an aggregate filter

					// Okay, this is a multifilter, does this multifilter have all items with the same sPath?
					var aKnownSPaths = [],
						// Multi filter with just one item? Flatten it
						bFlatten = aIncomingFilters[i].aFilters.length === 1; // if more than one, optimistically set it to false

					if (!bFlatten) {
						// More than one inner filters case

						for (var j = 0; j < aIncomingFilters[i].aFilters.length; j++) {
							// First check - Is there even one filter with no sPath?
							if (!aIncomingFilters[i].aFilters[j].sPath) {
								bFlatten = true; // Break immediately, this needs to be unpacked
								break;
							} else if (aKnownSPaths.length === 0) {
								// Otherwise, sPath is not initial, but we're in the first iteration, so store the key
								aKnownSPaths.push(aIncomingFilters[i].aFilters[j].sPath); // Here length cannot be 1, we checked for that
							} else if (aKnownSPaths.indexOf(aIncomingFilters[i].aFilters[j].sPath) === -1) {
								// sPath is not initial, but this sPath is not the same as the other one in this filter, break it
								bFlatten = true;
								break;
							}
						}
					}

					if (bFlatten) {
						// Either just one filter or all the inner filters are not the same, so flatten it
						// Recursion, if this is a multi filter get to the bottom of it
						aFilters = aFilters.concat(this.flattenFilters(aIncomingFilters[i].aFilters));
					} else {
						// All the sPaths are the same! Collect it, no point flattening it further
						// This allows us to preserve the inner AND, OR conditions
						aFilters.push(aIncomingFilters[i]);
					}
				} else {
					// Not a multi filter? collect it
					aFilters.push(aIncomingFilters[i]);
				}
			}

			// Return all the collected filters
			return aFilters;
		},

		getAdditionalDateRangeFilterBlock: function (oTimePeriod) {
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
		},

		replacePeriodTypeFilter: function (aIncomingFilters, oTimePeriod) {
			var aReturnFilters = [];

			for (var i = 0; i < aIncomingFilters.length; i++) {
				// Special handling for PeriodType filter -
				if (aIncomingFilters[i].sPath && aIncomingFilters[i].sPath === "PeriodType") {
					var oAdditionalDateRangeFilterBlock = this.getAdditionalDateRangeFilterBlock(oTimePeriod);
					aReturnFilters.push(oAdditionalDateRangeFilterBlock);
				} else {
					// No special handling for the others, they will come flattened
					aReturnFilters.push(aIncomingFilters[i]);
				}
			}

			return aReturnFilters;
		},

		amendExistingFilter: function (aExistingFilters, sPathOfFilterToAmend, oAdditionalFilter, bAnd) {
			var aIncomingFilters = aExistingFilters.slice(); // Create a new copy of existing filters; we don't want to modify it by reference

			for (var i = 0; i < aExistingFilters.length; i++) {
				var oFilter = aExistingFilters[i];
				if (oFilter.aFilters && oFilter.aFilters.length > 0) {
					oFilter.aFilters = this.amendExistingFilter(oFilter.aFilters, sPathOfFilterToAmend, oAdditionalFilter, bAnd);
				} else if (oFilter.sPath === sPathOfFilterToAmend) {
					aIncomingFilters.splice(
						i,
						1,
						new Filter({
							filters: [aIncomingFilters[i], oAdditionalFilter],
							and: bAnd
						})
					);
				}
			}

			return aIncomingFilters;
		},

		replaceFilter: function (aExistingFilters, oFilterToBeReplaced, oNewFilter) {
			var aIncomingFilters = aExistingFilters.slice(); // Create a new copy of existing filters; we don't want to modify it by reference
			for (var i = 0; i < aExistingFilters.length; i++) {
				var oFilter = aExistingFilters[i];
				if (oFilter.aFilters && oFilter.aFilters.length > 0) {
					oFilter.aFilters = this.replaceFilter(oFilter.aFilters, oFilterToBeReplaced, oNewFilter);
				} else if (
					oFilter.sPath === oFilterToBeReplaced.sPath &&
					oFilter.oValue1 === oFilterToBeReplaced.oValue1 &&
					oFilter.oValue2 === oFilterToBeReplaced.oValue2
				) {
					aIncomingFilters.splice(i, 1, oNewFilter);
					break;
				}
			}

			return aIncomingFilters;
		}
	});
});
