/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/rsh/eam/lib/common/base/BaseViewChild.controller", "sap/rsh/eam/lib/common/utils/GanttUtils"],
	function (BaseViewChildController, GanttUtils) {
		"use strict";

		return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.gantt.GanttContainer.controller", {
			onInit: function () {
				BaseViewChildController.prototype.onInit.apply(this, arguments);
				GanttUtils.setStatusBarDateTimeFormat(this.oGanttContainer);
				this.controllers.customVariant.attachInitChanges(this.onInitCustomVariantChanges, this);
				this.controllers.customVariant.attachHandleChanges(this.onHandleCustomVariantChanges, this);
			},

			onInitMembers: function () {
				this.oViewSwitch = this.byId("idGanttViewSwitchOptions");
				this.oGanttContainer = this.byId("idOrderGanttContainer");
				this.oOrderGantt = this.byId("idOrderGanttChartWithTable");
				this.oFilterBar = this.byId("idOrderGanttSmartFilterBar");
				this._bToolbarAdjusted = false;
			},

			// manipulating the gantt toolbars to have the settings button at the standard place
			onAfterRendering: function () {
				if (!this._bToolbarAdjusted) {
					var oSettingsButton = this.byId("idCustomGanttSettingBtn");
					var oToolbar = this.oGanttContainer.getToolbar();
					oToolbar.removeContent(oSettingsButton);
					oToolbar.insertContent(oSettingsButton, oToolbar.getContent().length);
					this._bToolbarAdjusted = true;
				}
			},

			setDataOutdated: function (bValue) {
				var bAppStateInitialized = this.controllers.navigation.isAppStateInitialized();
				var bSubmitOfDeferredRequestsDone = this.controllers.filterBarSearch.submitOfDeferredRequestsDone();
				if (bAppStateInitialized && bSubmitOfDeferredRequestsDone) {
					this.oUIModel.setProperty("/bDataOutdated", bValue);
				}
			},

			getVariantManagement: function () {
				return this.oGanttContainer.getToolbar().getContent()[0];
			},

			getViewKey: function () {
				return this.oViewSwitch.getSelectedKey();
			},

			setViewKey: function (sViewKey) {
				this.oViewSwitch.setSelectedKey(sViewKey);
			},

			getSettings: function () {
				return {
					enableNowLine: this.oGanttContainer.getEnableNowLine(),
					enableCursorLine: this.oGanttContainer.getEnableCursorLine(),
					enableVerticalLine: this.oGanttContainer.getEnableVerticalLine(),
					enableStatusBar: this.oGanttContainer.getEnableStatusBar()
				};
			},

			applySettings: function (oSettings) {
				var oSettingsToApply = {
					enableNowLine: oSettings.enableNowLine !== undefined ? oSettings.enableNowLine : this.oGanttContainer.getEnableNowLine(),
					enableCursorLine: oSettings.enableCursorLine !== undefined ? oSettings.enableCursorLine : this.oGanttContainer.getEnableCursorLine(),
					enableVerticalLine:
						oSettings.enableVerticalLine !== undefined ? oSettings.enableVerticalLine : this.oGanttContainer.getEnableVerticalLine(),
					enableStatusBar: oSettings.enableStatusBar !== undefined ? oSettings.enableStatusBar : this.oGanttContainer.getEnableStatusBar()
				};
				this.oGanttContainer.applySettings(oSettingsToApply);
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
				var bUtilGanttAdded = this.oGanttContainer.getGanttCharts().length === 2;
				var sSelectedKey = this.oViewSwitch.getSelectedKey();
				if (sSelectedKey === "Orders" && bUtilGanttAdded) {
					this.oGanttContainer.removeGanttChart(1);
				} else if (sSelectedKey === "OrdersAndResources" && !bUtilGanttAdded) {
					this._loadUtilGantt();
				}
			},

			_loadUtilGantt: function () {
				var oUtilGantt = this.controllers.utilizationGantt.getGantt();
				if (oUtilGantt) {
					this.oGanttContainer.insertGanttChart(oUtilGantt, 1);
					this._setSplitterSize(); // must be called after inserting the util gantt chart
				} else {
					this.controllers.utilizationGantt.load().then(
						function (oLoadedUtilGantt) {
							this.oGanttContainer.insertGanttChart(oLoadedUtilGantt, 1);
							this._setSplitterSize(); // must be called after inserting the util gantt chart

							var bAutoApplyVariant = !!this.oFilterBar.isCurrentVariantExecuteOnSelectEnabled();
							var bDataLoadedOnce = this.controllers.filterBarSearch.submitOfDeferredRequestsDone() || bAutoApplyVariant;

							this.controllers.utilizationGantt.bind("iDBatchUtilization");
							this.controllers.utilizationGantt.enableNoDataStyle(!bDataLoadedOnce);
							this.controllers.utilizationGantt.setNoDataText(bDataLoadedOnce);
						}.bind(this)
					);
				}
			},

			_setSplitterSize: function () {
				var oState = this.controllers.persAppState.get();
				var sSplitterSize = oState.splitterSize ? oState.splitterSize : "auto";
				var oSplitter = this.byId("idOrderGanttContainer-ganttContainerSplitter");
				var oLayoutData = oSplitter.getContentAreas()[0].getLayoutData();
				oLayoutData.setSize(sSplitterSize);
			}
		});
	}
);
