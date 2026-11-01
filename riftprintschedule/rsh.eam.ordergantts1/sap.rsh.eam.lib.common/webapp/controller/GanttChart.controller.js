/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/rsh/eam/lib/common/base/BaseFragment.controller", "sap/gantt/config/TimeHorizon", "sap/gantt/axistime/ProportionZoomStrategy"],
	function (BaseFragmentController, TimeHorizon, ProportionZoomStrategy) {
		"use strict";

		return BaseFragmentController.extend("sap.rsh.eam.lib.common.controller.GanttChart.controller", {
			onInit: function () {
				this._attachModelEventHandlers();
			},

			_attachModelEventHandlers: function () {
				this.oModel.attachBatchRequestSent(this._onRequestSent, this);
				this.oModel.attachBatchRequestCompleted(this._onRequestComplete, this);
			},

			onInitMembers: function (oParams) {
				this._bSetNoDataStyle = undefined;
			},

			//~~~ MUST be implemented ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

			_getTimePeriod: function () {
				throw new Error("not implemented");
			},

			_getFilters: function () {
				throw new Error("not implemented");
			},

			bind: function () {
				throw new Error("not implemented");
			},

			refreshBinding: function () {
				throw new Error("not implemented");
			},

			_requestRelevantForBusy: function (oRequest) {
				throw new Error("not implemented");
			},

			//~~~ CAN be implemented ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

			onSettingsChange: function (oSettings) {},

			onColumnResize: function () {},

			//~~~ common public behaviour ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

			load: function () {
				return this.getFragment();
			},

			isLoaded: function () {
				return !!this._oFragment;
			},

			getGantt: function () {
				return this._oFragment;
			},

			getTable: function () {
				if (this._oFragment) {
					return this._oFragment.getTable();
				} else {
					return null;
				}
			},

			setTimeAxis: function () {
				if (!this._oFragment) {
					return;
				}
				var oTimePeriod = this._getTimePeriod();
				var oCoreConfig = new sap.ui.getCore().getConfiguration();
				var oZoomStrategy = new ProportionZoomStrategy({
					totalHorizon: new TimeHorizon({
						startTime: oTimePeriod.ganttStartTime,
						endTime: oTimePeriod.ganttEndTime
					}),
					visibleHorizon: new TimeHorizon({
						startTime: oTimePeriod.ganttStartTime,
						endTime: oTimePeriod.ganttEndTime
					}),
					calendarType: oCoreConfig.getCalendarType()
				});
				this._oFragment.setAxisTimeStrategy(oZoomStrategy);
			},

			setNoDataText: function (bDataLoadedOnce) {
				if (this._oFragment) {
					var sTextKey = bDataLoadedOnce ? "NoDataFoundText" : "ClickGoToStartText";
					var sText = this.oCommonBundle.getText(sTextKey);
					var oTable = this.getTable();
					oTable.setNoData(sText);
				}
			},

			// Since the binding request to tree table is deferred on initializing the app, the no-data text
			// for the table disappears due to re-render triggered by the ESH_SEARCH_SRV. Therefore, manually
			// adding a css class that restores the no-data text after rendering of the table.
			initNoDataStyle: function () {
				this.getTable().addEventDelegate({
					onAfterRendering: function () {
						if (this._bSetNoDataStyle) {
							this.getTable().addStyleClass("sapUiTableEmpty");
						}
					}.bind(this)
				});
			},

			enableNoDataStyle: function (bEnable) {
				if (!this._oFragment) {
					return;
				}
				this._bSetNoDataStyle = bEnable;
				var oTable = this.getTable();
				if (!bEnable && oTable.hasStyleClass("sapUiTableEmpty")) {
					// stop adding the class "sapUiTableEmpty" to the tree table once we start fetching results
					oTable.toggleStyleClass("sapUiTableEmpty");
				}
			},

			getVisibleColumnIds: function () {
				var aAllColumns = this.getTable().getColumns();
				var aVisibleColumnIds = [];

				aAllColumns.forEach(function (oColumn) {
					if (oColumn.getVisible()) {
						aVisibleColumnIds.push(oColumn.getId());
					}
				});

				return aVisibleColumnIds;
			},

			getSelectedBindingContexts: function () {
				var aSelectedRowBindingContexts = [];
				var aSelectedRowIndices = this.getSelectedIndices();
				var aRowBindings = this.getTable().getBinding("rows");
				for (var i = 0; i < aSelectedRowIndices.length; i++) {
					if (aRowBindings.getContextByIndex(aSelectedRowIndices[i])) {
						aSelectedRowBindingContexts.push(aRowBindings.getContextByIndex(aSelectedRowIndices[i]));
					}
				}
				return aSelectedRowBindingContexts;
			},

			getSelectedIndices: function () {
				// All selection related actions shall be performed via the MultiSelectionPlugin
				var oMultiSelectionPlugin = this.getTable().getPlugins();
				return oMultiSelectionPlugin[0].getSelectedIndices();
			},

			clearSelection: function () {
				// All selection related actions shall be performed via the MultiSelectionPlugin
				var oMultiSelectionPlugin = this.getTable().getPlugins();
				oMultiSelectionPlugin[0].clearSelection();
			},

			getColumn: function (sProperty) {
				var aColumns = this.getTable().getColumns();
				var oColumn = aColumns.find(
					function (oColumn) {
						return oColumn.getSortProperty() === sProperty;
					}.bind(this)
				);
				return oColumn;
			},
			
			getSortColumn: function () {
				var aColumns = this.getTable().getColumns();
				for (var m = 0; m < aColumns.length; m++) {
					var oColumn = aColumns[m];
					if (oColumn.getSorted()) {
						return oColumn;
					}
				}
				return null;
			},

			updateColumnSortIcons: function (oNewSortColumn) {
				var oTable = this.getTable();
				var aColumns = oTable.getColumns();
				aColumns.forEach(function (oColumn) {
					var bSorted = oNewSortColumn ? oNewSortColumn.getId() === oColumn.getId() : false;
					oColumn.setSorted(bSorted);
				});
				if (oNewSortColumn) {
					// this is actually a private API
					// it makes sure that oTable.getSortColumns() is working
					// to be removed after all usages of getSortColumns are gone
					oTable.pushSortedColumn(oNewSortColumn);
				}
			},

			//~~~ common private behaviour ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

			_onRequestSent: function (oEvent) {
				this._setBusy(oEvent, true);
			},

			_onRequestComplete: function (oEvent) {
				this._setBusy(oEvent, false);
			},

			_setBusy: function (oEvent, bBusy) {
				if (!this._oFragment) {
					return;
				}
				var aRequest = oEvent.getParameter("requests");
				for (var i = 0; aRequest && i < aRequest.length; i++) {
					var bRequestRelevant = this._requestRelevantForBusy(aRequest[i]);
					if (bRequestRelevant) {
						this._oFragment.setBusy(bBusy);
					}
				}
			}
		});
	}
);
