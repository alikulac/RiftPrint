/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/gantt/GanttContainer.controller"], function (GanttContainerController) {
	"use strict";

	return GanttContainerController.extend("zrsh.eam.ordergantts1.mvc.gantt.GanttContainer.controller", {
		onInit: function () {
			GanttContainerController.prototype.onInit.apply(this, arguments);
			this.controllers.customVariant.attachInitChanges(this.onInitCustomVariantChanges, this);
			this.controllers.customVariant.attachHandleChanges(this.onHandleCustomVariantChanges, this);
		},

		onInitMembers: function () {
			GanttContainerController.prototype.onInitMembers.apply(this, arguments);
			this.oViewSwitch = this.byId("idGanttViewSwitchOptions");
			this.oOrderGantt = this.byId("idOrderGanttChartWithTable");
			this.oFilterBar = this.byId("idOrderGanttSmartFilterBar");
		},

		_getGanttContainer: function () {
			return this.byId("idOrderGanttContainer");
		},

		_getSettingsButton: function () {
			return this.byId("idCustomGanttSettingBtn");
		},

		setDataOutdated: function (bValue) {
			var bAppStateInitialized = this.controllers.inboundNavigation.isAppStateInitialized();
			var bSubmitOfDeferredRequestsDone = this.controllers.filterBarSearch.submitOfDeferredRequestsDone();
			if (bAppStateInitialized && bSubmitOfDeferredRequestsDone) {
				this.oUIModel.setProperty("/bDataOutdated", bValue);
			}
		},

		getViewKey: function () {
			return this.oViewSwitch.getSelectedKey();
		},

		setViewKey: function (sViewKey) {
			this.oViewSwitch.setSelectedKey(sViewKey);
		},

		// before cleanup: SchedulingBoard.onChangeGanttViewSwitchOptions
		onChangeGanttViewState: function (oEvent) {
			this.showSelectedGantts();
			var sSelectedKey = this.oViewSwitch.getSelectedKey();
			this.controllers.customVariant.updateProperty("/GanttViewState", sSelectedKey);
			this.controllers.customVariant.submitUpdates();
			if (sSelectedKey === "OrdersAndResources") {
				this.controllers.utilizationGantt.refreshBinding();
				this.controllers.filterBarSearch.submitDeferredRequestsUtilization();
			}
		},

		onInitCustomVariantChanges: function (oEvent) {
			var oEventParams = oEvent.getParameters();
			oEventParams.oldData.GanttViewState = this.oViewSwitch.getSelectedKey();
			oEventParams.newData.GanttViewState = this.oViewSwitch.getSelectedKey();
		},

		onHandleCustomVariantChanges: function (oEvent) {
			var oEventParams = oEvent.getParameters();
			var sSelectedKey = oEventParams.data.GanttViewState;
			this.oViewSwitch.setSelectedKey(sSelectedKey);
			this.showSelectedGantts();
			if (sSelectedKey === "OrdersAndResources") {
				this.controllers.filterBarSearch.submitDeferredRequestsUtilization();
			}
		},

		// before cleanup: SchedulingBoard.adjustGanttChartContainer
		showSelectedGantts: function () {
			var bUtilGanttAdded = this._oGanttContainer.getGanttCharts().length === 2;
			var sSelectedKey = this.oViewSwitch.getSelectedKey();
			if (sSelectedKey === "Orders" && bUtilGanttAdded) {
				this._oGanttContainer.removeGanttChart(1);
			} else if (sSelectedKey === "OrdersAndResources" && !bUtilGanttAdded) {
				this._loadUtilGantt();
			}
		},

		_loadUtilGantt: function () {
			var oUtilGantt = this.controllers.utilizationGantt.getGantt();
			if (oUtilGantt) {
				this._oGanttContainer.insertGanttChart(oUtilGantt, 1);
				this._applyPersSizes(oUtilGantt); // must be called after inserting the util gantt chart
			} else {
				this.controllers.utilizationGantt.load().then(
					function (oLoadedUtilGantt) {
						this._oGanttContainer.insertGanttChart(oLoadedUtilGantt, 1);
						this._applyPersSizes(oLoadedUtilGantt); // must be called after inserting the util gantt chart

						var bAutoApplyVariant = !!this.oFilterBar.isCurrentVariantExecuteOnSelectEnabled();
						var bDataLoadedOnce = this.controllers.filterBarSearch.submitOfDeferredRequestsDone() || bAutoApplyVariant;

						this.controllers.utilizationGantt.bind("iDBatchUtilization");
						this.controllers.utilizationGantt.enableNoDataStyle(!bDataLoadedOnce);
						this.controllers.utilizationGantt.setNoDataText(bDataLoadedOnce);
					}.bind(this)
				);
			}
		},

		_applyPersSizes: function (oUtilGantt) {
			this.controllers.persAppState.initialized().then(
				function () {
					var oState = this.controllers.persAppState.get();
					
					// vertical splitter requires a different solution than the horizontal splitter
					// there is no API for this size so we have to manipulate the layout data directly
					this.sizeVerticalSplitter(oState.splitterSize);
					
					// horizontal splitter requires a different solution than the vertical splitter
					// changing the layout data directly yields a wrong result
					oUtilGantt.setSelectionPanelSize(oState.selectionPanelSize);
				}.bind(this)
			);
		},

		sizeVerticalSplitter: function (sSize) {
			sSize = sSize ? sSize : "50%";
			var sSizeRaw = sSize.replaceAll("%", "");
			var iSize = parseInt(sSizeRaw, 10);
			var oSplitter = this.byId("idOrderGanttContainer-ganttContainerSplitter");
			var aContentAreas = oSplitter.getContentAreas();
			var oOrderGanttLayoutData = aContentAreas[0].getLayoutData();
			var oUtilGanttLayoutData = aContentAreas[1].getLayoutData();
			oOrderGanttLayoutData.setSize(iSize + "%");
			oUtilGanttLayoutData.setSize(100 - iSize + "%");
		}
	});
});
