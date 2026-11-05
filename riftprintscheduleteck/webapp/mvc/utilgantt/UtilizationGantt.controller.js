/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/utilization/UtilizationGantt.controller",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/rsh/eam/lib/common/utils/utils"
	],
	function (UtilizationGanttController, Filter, FilterOperator, Utils) {
		"use strict";

		return UtilizationGanttController.extend("zrsh.eam.ordergantts1.mvc.utilgantt.UtilizationChart.controller", {
			constructor: function () {
				UtilizationGanttController.apply(this, arguments);
				this.controllers.customVariant.attachInitChanges(this.onInitCustomVariantChanges, this);
				this.controllers.customVariant.attachHandleChanges(this.onHandleCustomVariantChanges, this);
			},

			onInit: function () {
				UtilizationGanttController.prototype.onInit.apply(this, arguments);
				this.initNoDataStyle();
				this._customVariantDelayedInit();
			},

			onInitMembers: function (oParams) {
				UtilizationGanttController.prototype.onInitMembers.apply(this, arguments);
				this._oFilterBar = oParams.filterBar;
				this._oCustomVariantData = undefined;
			},

			// override the super function to refresh the binding only if the gantt is currently shown
			refreshBinding: function () {
				var sViewKey = this.controllers.ganttContainer.getViewKey();
				if (sViewKey === "OrdersAndResources") {
					UtilizationGanttController.prototype.refreshBinding.apply(this, arguments);
				}
			},

			_getTimePeriod: function () {
				return this.controllers.timePeriod.get();
			},

			_getTimePeriodFilter: function () {
				var oTimePeriod = this._getTimePeriod();
				var oFilter = new Filter({
					filters: [new Filter("StartDate", FilterOperator.EQ, oTimePeriod.startDate), new Filter("EndDate", FilterOperator.EQ, oTimePeriod.endDate)],
					and: true
				});
				return oFilter;
			},

			_getWorkCenterFilter: function () {
				var oFilter = new Filter("WorkCenter", FilterOperator.NE, "");
				var oSFBarWorkCenterFilter = this._oFilterBar.getFilters(["WorkCenter"]);
				if (oSFBarWorkCenterFilter.length) {
					oFilter = oSFBarWorkCenterFilter[0];
				}
				return oFilter;
			},

			_getPerformingWorkCenterPlantFilter: function () {
				var oFilter = new Filter("Plant", FilterOperator.NE, "");
				var oSFBarWorkCenterFilter = this._oFilterBar.getFilters(["Plant"]);
				if (oSFBarWorkCenterFilter.length) {
					oFilter = oSFBarWorkCenterFilter[0];
				}
				return oFilter;
			},

			// before cleanup: SchedulingBoard.onUtilGanttColumnChanges
			onColumnResize: function (oEvent) {
				var sId = oEvent.getParameter("column").getId();
				var sColumnId = Utils.getControlId(sId);
				var iWidth = oEvent.getParameter("width");
				this.controllers.customVariant.updateProperty("/UtilGantt/" + sColumnId, iWidth);
				this.controllers.customVariant.submitUpdates();
			},

			// the gantt variant can only be initialized after utilization gantt is loaded (see _customVariantDelayedInit)
			onInitCustomVariantChanges: function (oEvent) {
				var oEventParams = oEvent.getParameters();
				oEventParams.oldData.UtilGantt = {};
				oEventParams.newData.UtilGantt = {};
				this._oCustomVariantOldData = oEventParams.oldData;
				this._oCustomVariantNewData = oEventParams.newData;
			},

			onHandleCustomVariantChanges: function (oEvent) {
				var oEventParams = oEvent.getParameters();
				this._oCustomVariantData = oEventParams.data;
				this._oCustomVariantApply = oEventParams.apply;
				if (this._oFragment) {
					this.applyVariantChanges(this._oCustomVariantData.UtilGantt);
				}
			},

			// the gantt variant can only be initialized after utilization gantt is loaded (see onGanttVariantInit)
			// but potentially a different gantt variant has been selected in the meantime (see onGanttVariantSet)
			// before cleanup: SchedulingBoard._createCustomSettingsDataForUtilGantt
			_customVariantDelayedInit: function () {
				var aColumns = this.getTable().getColumns();
				var bCustomChangesForUtilGantt =
					this._oCustomVariantData && this._oCustomVariantData.UtilGantt && Object.keys(this._oCustomVariantData.UtilGantt).length > 0;
				if (bCustomChangesForUtilGantt) {
					aColumns.forEach(
						function (oColumn) {
							var sColumnId = Utils.getControlId(oColumn.getId());
							var sNewWidth = this._oCustomVariantApply ? this._oCustomVariantData.UtilGantt[sColumnId] : oColumn.getWidth();
							var sOldWidth = this._oCustomVariantApply ? oColumn.getWidth() : this._oCustomVariantData.UtilGantt[sColumnId];
							this._oCustomVariantNewData.UtilGantt[sColumnId] = sNewWidth;
							this._oCustomVariantOldData.UtilGantt[sColumnId] = sOldWidth;
						}.bind(this)
					);
				} else {
					aColumns.forEach(
						function (oColumn) {
							var sColumnId = Utils.getControlId(oColumn.getId());
							this._oCustomVariantNewData.UtilGantt[sColumnId] = oColumn.getWidth();
							this._oCustomVariantOldData.UtilGantt[sColumnId] = oColumn.getWidth();
						}.bind(this)
					);
				}

				var bDataChanged = JSON.stringify(this._oCustomVariantNewData.UtilGantt) !== JSON.stringify(this._oCustomVariantOldData.UtilGantt);
				if (bDataChanged) {
					this.applyVariantChanges(this._oCustomVariantData.UtilGantt);
				}
			}
		});
	}
);
