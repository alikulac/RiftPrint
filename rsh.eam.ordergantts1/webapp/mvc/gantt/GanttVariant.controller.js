/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/BaseViewChild.controller"], function (BaseViewChildController) {
	"use strict";

	return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.gantt.GanttVariant.controller", {
		onInitMembers: function () {
			this.oTreeTable = this.byId("idOrderTreeTable");
			this._bInitialVariantApplied = false;
			this._pInitialVariantApplied = new Promise(
				function (resolve, reject) {
					this._fnResolve = resolve;
					this._fnReject = reject;
				}.bind(this)
			);
		},

		initialVariantApplied: function () {
			return this._pInitialVariantApplied;
		},

		// This event is fired when all the changes from the variant is applied (either on app load / on variant change)
		onGanttVariantApplied: function (oEvent) {
			if (!this._bInitialVariantApplied) {
				this._applyInitialVariant();
			} else {
				this._apply();
			}
		},

		// no need to load data when applying the initial variant
		// this will be done once the filter bar search is triggered
		_applyInitialVariant: function () {
			var pPersAppStateInitialized = this.controllers.persAppState.initialized();
			var pPersGanttSettingsInitialized = this.controllers.persGanttSettings.initialized();
			var pPersInitialized = Promise.all([pPersAppStateInitialized, pPersGanttSettingsInitialized]);
			pPersInitialized.then(
				function () {
					var bSwitchRequired = !this.controllers.persAppState.getSwitchedToVariant();
					if (bSwitchRequired) {
						var bGanttVariantSaved = this.controllers.persAppState.switchToVariant();
						if (bGanttVariantSaved) {
							// if a gantt variant was saved the onGanttVariantApplied will be triggered again asynchronously
						} else {
							this.controllers.ordergantt.sort.applyDefaults();
							this._bInitialVariantApplied = true;
							this._fnResolve();
						}
					} else {
						this._resetStandardVariantColumnVisibilities();
						this._handleSortChangesFromGanttVariant();
						this._bInitialVariantApplied = true;
						this._fnResolve();
					}
				}.bind(this),
				this._fnReject
			);
		},

		_apply: function () {
			this._resetStandardVariantColumnVisibilities();
			this._handleSortChangesFromGanttVariant();
			this.controllers.ordergantt.enableToolbarButtons.disable();
			this.controllers.ordergantt.binding.refreshBinding({ filtersChanged: true, force: true });
			this.controllers.utilizationGantt.refreshBinding();
		},

		// If the current variant is standard, set the visibility of the default columns
		_resetStandardVariantColumnVisibilities: function () {
			var oColumns = this.oTreeTable.getColumns();
			var aDefaultVisibleColumns = ["MaintenanceOrder", "MainWorkCenter", "MaintPriority", "ProcessingStatus", "FunctionalLocationName"];
			var oVariantManagement = this.controllers.ganttContainer.getVariantManagement();
			if (oVariantManagement.getCurrentVariantKey().indexOf("variantManagement") !== -1) {
				for (var i = 0; i < oColumns.length; i++) {
					var sColumnName = oColumns[i].getSortProperty();
					if (aDefaultVisibleColumns.indexOf(sColumnName) !== -1) {
						oColumns[i].setVisible(true);
						this.oTreeTable.fireColumnVisibility({
							column: oColumns[i],
							newVisible: true,
							applicationEvent: true
						});
					} else {
						oColumns[i].setVisible(false);
					}
				}
			}
		},

		// Create sorters and update the binding according to the applied sort change from the variant
		_handleSortChangesFromGanttVariant: function () {
			var oSortColumn = this.controllers.orderGantt.getSortColumn();
			if (oSortColumn) {
				this.controllers.ordergantt.sort.setFields(oSortColumn, oSortColumn.getSortOrder());
				// TODO to be removed when pushSortColumns/getSortedColumns is removed
				this.controllers.orderGantt.updateColumnSortIcons(oSortColumn);
			} else {
				this.controllers.ordergantt.sort.applyDefaults();
			}
		}
	});
});
