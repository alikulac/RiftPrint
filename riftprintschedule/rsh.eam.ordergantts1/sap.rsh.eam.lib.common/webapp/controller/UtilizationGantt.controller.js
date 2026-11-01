/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/controller/GanttChart.controller",
		"sap/rsh/eam/lib/common/controller/UtilizationGanttFormatters",
		"sap/rsh/eam/lib/common/utils/GanttUtils",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/model/FilterType",
		"sap/ui/model/Sorter",
		"sap/ui/model/json/JSONModel",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/utils"
	],
	function (GanttChartController, UtilizationGanttFormatters, GanttUtils, Filter, FilterOperator, FilterType, Sorter, JSONModel, Constants, Utils) {
		"use strict";

		return GanttChartController.extend("sap.rsh.eam.lib.common.controller.UtilizationGantt.controller", {
			formatters: UtilizationGanttFormatters,
			ganttUtils: GanttUtils,

			/**
			 * @param {Object} oParams
			 * @param {Object} oParams.component
			 * @param {string} oParams.modelName
			 * @param {Object} oParams.dependent (optional)
			 */
			constructor: function (oParams) {
				oParams.fragmentId = oParams.dependent.getId();
				oParams.fragmentName = "sap.rsh.eam.lib.common.view.UtilizationGantt";
				GanttChartController.call(this, oParams);
			},

			onInitMembers: function (oParams) {
				GanttChartController.prototype.onInitMembers.apply(this, arguments);
				this.sSortWorkCenterField = "WorkCenter";
				this._oDataModel = this.oComponent.getModel(oParams.modelName);
				this._sDataModel = oParams.modelName;
			},

			onInit: function () {
				GanttChartController.prototype.onInit.apply(this, arguments);

				var oUtilizationGanttModel = new JSONModel({
					iRowCount: 0,
					iTitleLevel: 0
				});
				this._oFragment.setModel(oUtilizationGanttModel, "UtilizationGantt");
				this._oFragment.setModel(this._oDataModel, "data");

				this.setTimeAxis();
			},

			onExit: function () {
				if (!this._oFragment) {
					return;
				}
				// template for Rectangle shape needs to be destroyed as the template is set to shareable
				this.byId("idBaseRectangleWCUtilizationGantt").destroy();
			},

			//~~~ implementations of abstract functions ~~~~~~~~~~~~~~~~~~~~~~~

			_getFilters: function () {
				var oTimePeriodFilter = this._getTimePeriodFilter();
				var oWorkCenterFilter = this._getWorkCenterFilter();
				var oPerformingWorkCenterPlantFilter = this._getPerformingWorkCenterPlantFilter();
				var aFilters = [];
				var oMergedFilterBlock = new Filter({
					filters: [oWorkCenterFilter, oTimePeriodFilter],
					and: false
				});
				oMergedFilterBlock = new Filter({
					filters: [oMergedFilterBlock, oPerformingWorkCenterPlantFilter],
					and: true
				});
				aFilters.push(oMergedFilterBlock);
				return aFilters;
			},

			_requestRelevantForBusy: function (oRequest) {
				return oRequest.url.indexOf("C_RSHWorkCtrUtilization") !== -1 && oRequest.method === "GET";
			},

			bind: function (sGroupId) {
				if (!this._oFragment) {
					throw Error("gantt not loaded yet");
				}
				var aFilters = this._getFilters();
				var oSorter = new Sorter(this.sSortWorkCenterField, false);
				this.getTable().bindRows({
					path: "data>/C_RSHWorkCtrUtilization",
					parameters: {
						expand: "to_UtilIndicator",
						groupId: sGroupId
					},
					filters: aFilters,
					sorter: oSorter,
					events: {
						change: this._onBindingChange.bind(this)
					}
				});
			},

			_onBindingChange: function (oEvent) {
				var oBinding = oEvent.getSource();
				var iRowCount = oBinding.getCount();
				this.getModel("UtilizationGantt").setProperty("/iRowCount", iRowCount);
			},

			//~~~ additional abstract functions ~~~~~~~~~~~~~~~~~~~~~~~

			_getTimePeriodFilter: function () {
				throw new Error("not implemented");
			},

			_getWorkCenterFilter: function () {
				throw new Error("not implemented");
			},

			_getPerformingWorkCenterPlantFilter: function () {
				throw new Error("not implemented");
			},

			//~~~ more ~~~~~~~~~~~~~~~~~~~~~~~

			refreshBinding: function () {
				if (!this._oFragment) {
					return;
				}
				var oTable = this.getTable();
				var oBinding = oTable.getBinding("rows");
				if (oBinding) {
					// find sorter
					var oSorter;
					var aColumns = oTable.getColumns();
					for (var m = 0; m < aColumns.length; m++) {
						var oColumn = aColumns[m];
						if (oColumn.getSorted()) {
							oSorter = new Sorter(oColumn.getSortProperty(), oColumn.getSortOrder() === "Descending");
							break;
						}
					}

					// apply default sorter
					if (!oSorter) {
						oSorter = new Sorter(this.sSortWorkCenterField, false);
						var oWorkCenterColumn = aColumns.find(
							function (oCol) {
								return oCol.getSortProperty() === this.sSortWorkCenterField;
							}.bind(this)
						);
						oWorkCenterColumn.setSorted(true);
					}

					oBinding.sort(oSorter);

					var aFilters = this._getFilters();
					oBinding.filter(aFilters, FilterType.Application);

					oBinding.refresh();
				}
			},

			onVisibleHorizonUpdate: function (oEvent) {
				// Whenever there is a change in zoom level, type would be
				// "ZoomLevelChanged" - in case of single gantt chart, "SyncVisibleHorizon" - in case of multiple gantt charts
				if (oEvent.getParameter("type") === "ZoomLevelChanged" || oEvent.getParameter("type") === "SyncVisibleHorizon") {
					//Get AxisTimeStrategy of the Util Gantt Chart & find the interval b/w two neighbouring vertical lines
					var otimeLineOption = oEvent.getSource().getAxisTimeStrategy().getProperty("timeLineOption");
					var oTimeIntBtwVerticalLines = otimeLineOption.innerInterval;
					var oUtilGanttModel = this.getModel("UtilizationGantt");

					if (oTimeIntBtwVerticalLines.unit.includes("hour") || oTimeIntBtwVerticalLines.unit.includes("min")) {
						oUtilGanttModel.setProperty("/iTitleLevel", 2);
					} else if (oTimeIntBtwVerticalLines.unit.includes("day")) {
						if (oTimeIntBtwVerticalLines.span <= 2) {
							oUtilGanttModel.setProperty("/iTitleLevel", 1);
						} else {
							oUtilGanttModel.setProperty("/iTitleLevel", 0);
						}
					} else {
						oUtilGanttModel.setProperty("/iTitleLevel", 0);
					}
				}
			},

			onColumnVisibilityChanged: function (oEvent) {
				var bFirstColumn = oEvent.getParameters().column.getIndex() === 0;
				if (bFirstColumn) {
					oEvent.preventDefault();
					Utils.addMessage(
						this.oCommonBundle.getText("CannotHideWorkCenterColumn"),
						sap.ui.core.MessageType.Warning,
						Constants.sDisplayTypeMessageBox
					);
				}
			},

			applyVariantChanges: function (oUtilGanttChanges) {
				var aColumns = this.getTable().getColumns();
				for (var i = 0; i < aColumns.length; i++) {
					var oColumn = aColumns[i];
					var sColumnId = GanttUtils.getControlId(oColumn.getId());
					var sWidth = oUtilGanttChanges[sColumnId];
					// usually UI5 controls will ignore setting the same value and not rerender but you never know
					var bApplyWidth = sWidth && oColumn.getWidth() !== sWidth;
					if (bApplyWidth) {
						oColumn.setWidth(sWidth);
					}
				}
			},

			deltaRefresh: function (aWorkCentersToRefresh) {
				var oReadParams = {
					modelName: this._sDataModel,
					path: "/C_RSHWorkCtrUtilization",
					filters: this._getDeltaRefreshFilters(aWorkCentersToRefresh),
					urlParameters: {
						$expand: "to_UtilIndicator"
					},
					groupId: "",
					changeSetId: ""
				};
				return this.controllers.modelPromises.read(oReadParams);
			},

			// before cleanup: SchedulingBoard._getFiltersForWCUtilQuery
			_getDeltaRefreshFilters: function (aWorkCentersToRefresh) {
				var aWorkCenterFilters = [];
				for (var j = 0; j < aWorkCentersToRefresh.length; j++) {
					aWorkCenterFilters.push(new Filter("WorkCenter", FilterOperator.EQ, aWorkCentersToRefresh[j]));
				}
				var oWorkCenterFilter = new Filter({
					filters: aWorkCenterFilters,
					and: false
				});

				var oTimePeriod = this._getTimePeriod();
				var oDateTimeFilter = new Filter({
					filters: [new Filter("StartDate", FilterOperator.EQ, oTimePeriod.startDate), new Filter("EndDate", FilterOperator.EQ, oTimePeriod.endDate)],
					and: true
				});

				var aWCUtilFilter = [];
				aWCUtilFilter.push(new Filter(oWorkCenterFilter, false));
				aWCUtilFilter[0].aFilters.push(new Filter(oDateTimeFilter, false));
				return aWCUtilFilter;
			}
		});
	}
);
