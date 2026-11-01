/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/controller/FilterBar.controller"], function (FilterBarController) {
	"use strict";

	return FilterBarController.extend("zrsh.eam.ordergantts1.mvc.filterbar.FilterBar.controller", {
		_getFilterBar: function () {
			return this.byId("idOrderGanttSmartFilterBar");
		},

		onAssignedFiltersChanged: function (oEvent) {
			this.controllers.ganttContainer.setDataOutdated(true);
			this._resetPeriodTypeErrors();
			this._updateStatusText();
		},

		_resetPeriodTypeErrors: function () {
			var oPeriodType = this._oFilterBar.getControlByKey("PeriodType");
			if (oPeriodType.getValueState() === sap.ui.core.ValueState.Error) {
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
});
