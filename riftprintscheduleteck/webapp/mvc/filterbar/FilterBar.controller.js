/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/rsh/eam/lib/common/filter/FilterBar.controller", "sap/ui/core/library", "sap/rsh/eam/lib/common/utils/SmartFilterBarUtils"],
	function (FilterBarController, CoreLib, SmartFilterBarUtils) {
		"use strict";

		return FilterBarController.extend("rsh.eam.ordergantts1.mvc.filterbar.FilterBar.controller", {
			_getFilterBar: function () {
				return this.byId("idOrderGanttSmartFilterBar");
			},

			onAssignedFiltersChanged: function (oEvent) {
				this._resetPeriodTypeErrors();
				this._updateStatusText();
				this.controllers.ganttContainer.setDataOutdated(true);
			},

			_resetPeriodTypeErrors: function () {
				var oPeriodType = SmartFilterBarUtils.getControlByKey(this._getFilterBar(), "PeriodType");

				if (oPeriodType.getValueState() === CoreLib.ValueState.Error) {
					var sText = this.oBundle.getText("timePeriodFilterError");
					oPeriodType.setValueStateText(sText);
				}
			},

			_updateStatusText: function () {
				var oStatusText = this.byId("statusText");
				var sText = this._oFilterBar.retrieveFiltersWithValuesAsText();
				oStatusText.setText(sText);
			}
		});
	}
);
