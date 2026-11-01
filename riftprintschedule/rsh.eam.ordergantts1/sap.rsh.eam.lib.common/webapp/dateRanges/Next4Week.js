/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/m/DynamicDateOption", "sap/ui/core/date/UI5Date", "sap/ui/core/date/UniversalDate", "sap/ui/core/format/DateFormat"],
	function (DynamicDateOption, UI5Date, UniversalDate, DateFormat) {
		"use strict";

		return DynamicDateOption.extend("sap.rsh.eam.lib.common.dateRanges.Next4Week", {
			getText: function () {
				var oModel = this.getModel("i18nLib");
				return oModel.getResourceBundle().getText("Next4Week");
			},

			getGroup: function () {
				return 100;
			},
			getGroupHeader: function () {
				var oModel = this.getModel("i18nLib");
				return oModel.getResourceBundle().getText("DateRangeGroupName");
			},

			getValueHelpUITypes: function () {
				return [];
			},

			format: function (oValue) {
				var _oDateFormatter = DateFormat.getDateTimeWithTimezoneInstance({
					showTimezone: false,
					showTime: false
				});
				var oModel = this.getModel("i18nLib");
				var aValueDates = this.toDates(oValue);

				var oStartDateNext = _oDateFormatter.format(aValueDates[0].oDate);
				var oEndDateNext = _oDateFormatter.format(aValueDates[1].oDate);

				return oModel.getResourceBundle().getText("Next4Week") + " (" + oStartDateNext + " – " + oEndDateNext + ")";
			},
			parse: function () {
				var oResult = {
					operator: "SAP_EAM_RSH_NEXT4WEEK",
					values: []
				};

				return oResult;
			},
			toDates: function (oValue) {
				var oStartDateNext = UI5Date.getInstance();
				var oEndDateNext = UI5Date.getInstance();
				oEndDateNext.setDate(oEndDateNext.getDate() + 28);
				oEndDateNext.setDate(oEndDateNext.getDate() - ((oEndDateNext.getDay() + 7) % 7));

				var oStartDate = UniversalDate.getInstance(oStartDateNext),
					oEndDate = UniversalDate.getInstance(oEndDateNext);
				return [oStartDate, oEndDate];
			}
		});
	}
);
