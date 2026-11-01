/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/controller/GanttChartAdapter.controller"], function (GanttChartAdapterController) {
	"use strict";

	return GanttChartAdapterController.extend("zrsh.eam.ordergantts1.mvc.ordergantt.OrderGantt.controller", {
		onInit: function () {
			GanttChartAdapterController.prototype.onInit.apply(this, arguments);

			this.controllers.customVariant.attachInitChanges(this.onInitCustomVariantChanges, this);
			this.controllers.customVariant.attachHandleChanges(this.onHandleCustomVariantChanges, this);

			// Activate Large Data Scrolling, to save runtime when scrolling.
			// When scrolling Gantt vertically, the tree table update and Gantt timeline rerendering shall be triggered once (not multiple times).
			// when the scroll clicks (or scrollbar pulls) are within a certain time threshold (e.g. 1000 ms depending on UI5 table)
			this._oFragment.setLargeDataScrolling(true);

			this.initNoDataStyle();
			this.enableNoDataStyle(true);
			this.setNoDataText(false);

			this.setTimeAxis();

			this.controllers.ordergantt.metadata.init().then(
				function (aOrderOpProperties) {
					this.controllers.ordergantt.columnAdaption.adapt(aOrderOpProperties);
					this.controllers.customVariant.initChanges();
				}.bind(this)
			);

			this.controllers.persGanttSettings.initialized().then(
				function () {
					this.controllers.ordergantt.relationshipsBinding.bind();
					this.controllers.ordergantt.utilizationBinding.bind();
				}.bind(this)
			);
		},

		// Destroy the controls which are persisted by design, for ex, aggregations shareable template.
		onExit: function () {
			this.byId("idRelationshipOperation").destroy();
			this.byId("idBaseRectangleWCUtilization").destroy();
		},

		onInitMembers: function () {
			GanttChartAdapterController.prototype.onInitMembers.apply(this, arguments);
			this.oGanttChartContainer = this.byId("idOrderGanttContainer");
		},

		_getTimePeriod: function () {
			return this.controllers.timePeriod.get();
		},

		// overridden behaviour of GanttChart.controller
		_setBusy: function (oEvent, bBusy) {
			if (!this._oFragment) {
				return;
			}
			var aRequests = oEvent.getParameter("requests");
			var bRequestRelevant = this._requestsRelevantForBusy(aRequests, bBusy); // super class checks single requests
			if (bRequestRelevant) {
				this.oGanttChartContainer.setBusy(bBusy); // super class applies busy to the chart
			}
		},

		// before cleanup: SchedulingBoard._requestSent/_requestComplete/requestProcessingHandler
		// "looks a bit bizarre but i did not dare to change this yet" (ThomasM)
		_requestsRelevantForBusy: function (aRequests, bBusy) {
			for (var i = 0; aRequests && i < aRequests.length; i++) {
				var bContainsOrderOpsRequest = aRequests[i].url.indexOf("C_RSHOrdersAndOperations") !== -1;
				if (bContainsOrderOpsRequest) {
					var oFirstRequest = aRequests[0];
					if (bBusy) {
						return !oFirstRequest.url.indexOf("C_RSHWorkCtrUtilization") !== -1;
					} else {
						return oFirstRequest.url.indexOf("C_RSHOrdersAndOperations") !== -1 && oFirstRequest.method === "GET";
					}
				}
			}
			return false;
		},

		getSelectedOperationPaths: function () {
			var aSelectedRowBindingContexts = this.getSelectedBindingContexts();
			var aSelectedOpRowPaths = [];
			aSelectedRowBindingContexts.forEach(function (oBindingContext) {
				if (oBindingContext.getObject().OrderOperationRowLevel === 1) {
					aSelectedOpRowPaths.push(oBindingContext.getPath());
				}
			});
			return aSelectedOpRowPaths;
		},

		onInitCustomVariantChanges: function (oEvent) {
			var oEventParams = oEvent.getParameters();
			var aColumns = this.getTable().getColumns();
			aColumns.forEach(
				function (oCol) {
					oEventParams.oldData[oCol.getSortProperty()] = oCol.getWidth();
					oEventParams.newData[oCol.getSortProperty()] = oCol.getWidth();
				}.bind(this)
			);
		},

		onHandleCustomVariantChanges: function (oEvent) {
			var oEventParams = oEvent.getParameters();
			var aColumns = this.getTable().getColumns();
			for (var i = 0; i < aColumns.length; i++) {
				var oColumn = aColumns[i];
				var sColumnName = oColumn.getSortProperty();
				var sWidth = oEventParams.data[sColumnName];
				// usually UI5 controls will ignore setting the same value and not rerender but you never know
				var bApplyWidth = sWidth && oColumn.getWidth() !== sWidth;
				if (bApplyWidth) {
					oColumn.setWidth(sWidth);
				}
			}
		},

		onSelectRows: function (oEvent) {
			var aChangedRowIndices = oEvent.getParameter("rowIndices");
			this.controllers.ordergantt.messages.removeMessagesByRow(aChangedRowIndices);
			this.controllers.ordergantt.enableToolbarButtons.update();
		},

		onSort: function (oEvent) {
			var oEventParams = oEvent.getParameters();
			if (oEventParams.applicationEvent) {
				this.controllers.ordergantt.sort.setFields(oEventParams.column, oEventParams.sortOrder);
				this.controllers.orderGantt.updateColumnSortIcons(oEventParams.column);
				this.controllers.ordergantt.binding.refreshBinding({ filtersChanged: false, force: true });
			} else {
				// in this case the event has been fired by the table
				// (as the user selected sort from the column menu)
				// without preventDefault UI5 would fire an own request
				oEvent.preventDefault();
				// we need to fire another event (that is not prevented)
				// for the change to be captured by gantt variant
				this.getTable().fireSort({
					column: oEventParams.column,
					sortOrder: oEventParams.sortOrder,
					applicationEvent: true
				});
			}
		},

		onFirstVisibleRowChanged: function () {
			this.controllers.ordergantt.expandOrders.restoreTableBinding();
			this.controllers.ordergantt.binding.onFirstVisibleRowChanged();
			this.controllers.ordergantt.contextMenus.close();
		},

		onColumnResize: function (oEvent) {
			var sColumnName = oEvent.getParameter("column").getSortProperty(),
				iWidth = oEvent.getParameter("width");
			this.controllers.customVariant.updateProperty("/" + sColumnName, iWidth);
			this.controllers.customVariant.submitUpdates();
		},

		onColumnVisibilityChanged: function (oEvent) {
			var oEventParams = oEvent.getParameters();
			if (oEventParams.applicationEvent) {
				var oSelectedColumn = oEventParams.column;
				if (oSelectedColumn.getVisible() && oSelectedColumn.getSorted()) {
					this.controllers.orderGantt.updateColumnSortIcons(oSelectedColumn);
				}
			}
		},

		onVisibleHorizonUpdate: function () {
			//If visible gantt chart changes horizontally then close the context menu if open
			this.controllers.ordergantt.contextMenus.close();
		},

		onShowHideButtonPress: function (oEvent) {
			var sSourceId = oEvent.getSource().getId(),
				bPressed = oEvent.getSource().getPressed();
			if (sSourceId.includes("idShowHideLabels")) {
				this.oUIModel.setProperty("/bLabelsToggleBtnOn", bPressed);
			} else if (sSourceId.includes("idShowHideRelationships")) {
				this.oUIModel.setProperty("/bRelationshipsToggleBtnOn", bPressed);
			} else {
				this.oUIModel.setProperty("/bUtilizationsToggleBtnOn", bPressed);
			}
			this.controllers.persGanttSettings.save();
		},

		assignPeople: function (aMenuShapePaths) {
			var oContainerSettings = this.controllers.ganttContainer.getSettings();
			var oTimePeriod = this.controllers.timePeriod.get();
			this.controllers.ordergantt.peopleGanttDialog.open(oTimePeriod, aMenuShapePaths, oContainerSettings).then(
				function (oTargetParams) {
					if (oTargetParams) {
						this.controllers.deltaRefresh.refresh(oTargetParams);
					}
				}.bind(this)
			);
		},

		unassignPeople: function (aMenuShapePaths) {
			this.oGanttChartContainer.setBusy(true);
			this.controllers.ordergantt.unassignPeople.unassignSplits(aMenuShapePaths).then(
				function (oTargetParams) {
					if (oTargetParams) {
						this.controllers.deltaRefresh.refresh(oTargetParams);
					}
				}.bind(this)
			);
		}
	});
});
