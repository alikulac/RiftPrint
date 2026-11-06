/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/BaseViewChild.controller", "sap/gantt/misc/Utility"], function (BaseViewChildController, GanttUtility) {
	"use strict";

	return BaseViewChildController.extend("zrift.rsh.eam.ordergantts1.mvc.ordergantt.actions.ExpandOrders.controller", {
		onInitMembers: function () {
			this.oGanttChartWithTable = this.byId("idOrderGanttChartWithTable");
			this.oTreeTable = this.byId("idOrderTreeTable");
			this._sExistingFilters = null; // before cleanup: _sExistingFilterString
			this._sPerformanceFilter = null; // before cleanup: _sPerformanceFilterOnExpand
		},

		//~~~ public ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

		expandSelectedOrders: function () {
			var aSelectedIndices = this.controllers.orderGantt.getSelectedIndices();
			var aSelectedRowsBindingContext = this.controllers.orderGantt.getSelectedBindingContexts();
			var aMaintenanceOrderIDs = this._getMaintOrderIDsByRowsBindingContext(aSelectedRowsBindingContext);
			this._addPerformanceFilter(aMaintenanceOrderIDs);
			this.oTreeTable.expand(aSelectedIndices);
		},

		collapseSelectedOrders: function () {
			var aSelectedIndices = this.controllers.orderGantt.getSelectedIndices();
			this.oTreeTable.collapse(aSelectedIndices);
		},

		expandOrderByShape: function (oShape) {
			var aSelectedShapeIndices = this._getSelectedShapeIndices(oShape);
			var aSelectedRowBindingContexts = [];
			var aRowBindings = this.oTreeTable.getBinding("rows");
			for (var i = 0; i < aSelectedShapeIndices.length; i++) {
				if (aRowBindings.getContextByIndex(aSelectedShapeIndices[i])) {
					aSelectedRowBindingContexts.push(aRowBindings.getContextByIndex(aSelectedShapeIndices[i]));
				}
			}
			var aMaintenanceOrderIDs = this._getMaintOrderIDsByRowsBindingContext(aSelectedRowBindingContexts);
			this._addPerformanceFilter(aMaintenanceOrderIDs);
			this.oTreeTable.expand(aSelectedShapeIndices);
			this.oGanttChartWithTable.deselectShapes(this.oGanttChartWithTable.getSelectedShapeUid());
		},

		collapseOrderByShape: function (oShape) {
			var aSelectedShapeIndices = this._getSelectedShapeIndices(oShape);
			this.oTreeTable.collapse(aSelectedShapeIndices);
			this.oGanttChartWithTable.deselectShapes(this.oGanttChartWithTable.getSelectedShapeUid());
		},

		restoreTableBinding: function () {
			var oRowBinding = this.oTreeTable.getBinding("rows");
			if (oRowBinding && this._sPerformanceFilter) {
				oRowBinding.sFilterParams = this._sExistingFilters;
				this._sPerformanceFilter = null;
			}
		},

		resetPerformanceFilter: function () {
			this._sPerformanceFilter = null;
		},

		//~~~ private ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

		onExpandRow: function (oEvent) {
			var bExpand = oEvent.getParameters().expanded === true;
			if (bExpand) {
				var sMaintenanceOrderID = oEvent.getParameters().rowContext.getProperty().MaintenanceOrder;
				var aMaintenanceOrderIDs = [sMaintenanceOrderID];
				this._addPerformanceFilter(aMaintenanceOrderIDs);
			}
		},

		/*
		 * Attach MaintenanceOrderFilter on expanding a row in Gantt to improve performance
		 * as the annotation key OrderOperationParentRowID is a calculated key and takes long within DB select
		 * called if user expands a single raw and if multi expand vie expand + button is done
		 *
		 * before cleanup: SchedulingBoard._addPerformanceFilterOnExpand
		 */
		_addPerformanceFilter: function (aMaintenanceOrderIDs) {
			var oRowBinding = this.oTreeTable.getBinding("rows");
			this._sExistingFilters = oRowBinding.sFilterParams;

			//in case a previous expand was done, remove the previous expand filter before building new
			if (this._sPerformanceFilter && this._sExistingFilters && this._sExistingFilters.startsWith(this._sPerformanceFilter)) {
				this._sExistingFilters = this._sExistingFilters.substr(this._sPerformanceFilter.length);
			}

			// build additional orders filters
			var sMaintenanceOrderFilter = null;
			for (var i = 0; i < aMaintenanceOrderIDs.length; i++) {
				if (aMaintenanceOrderIDs.length === 1) {
					sMaintenanceOrderFilter = "MaintenanceOrder eq '" + aMaintenanceOrderIDs[i] + "'";
					// add a bracket before the first entry
				} else if (i === 0) {
					sMaintenanceOrderFilter = "(" + "MaintenanceOrder eq '" + aMaintenanceOrderIDs[i] + "' or ";
					// add a bracket after the last entry
				} else if (i === aMaintenanceOrderIDs.length - 1) {
					sMaintenanceOrderFilter = sMaintenanceOrderFilter + "MaintenanceOrder eq '" + aMaintenanceOrderIDs[i] + "')";
				} else {
					sMaintenanceOrderFilter = sMaintenanceOrderFilter + "MaintenanceOrder eq '" + aMaintenanceOrderIDs[i] + "' or ";
				}
			}

			if (sMaintenanceOrderFilter) {
				sMaintenanceOrderFilter = encodeURIComponent(sMaintenanceOrderFilter);
				if (this._sExistingFilters) {
					oRowBinding.sFilterParams = sMaintenanceOrderFilter + "%20and%20" + this._sExistingFilters;
					this._sPerformanceFilter = sMaintenanceOrderFilter + "%20and%20";
				} else {
					oRowBinding.sFilterParams = sMaintenanceOrderFilter;
					this._sPerformanceFilter = sMaintenanceOrderFilter;
				}
			}
		},

		_getSelectedShapeIndices: function (oShape) {
			var aSelectedShapeUid = this.oGanttChartWithTable.getSelectedShapeUid();
			var aSelectedShapeIndices = [];
			aSelectedShapeUid.forEach(function (ShapeUid) {
				aSelectedShapeIndices.push(parseInt(GanttUtility.parseUid(ShapeUid).rowIndex, 10));
			});
			return aSelectedShapeIndices;
		},

		_getMaintOrderIDsByRowsBindingContext: function (aRowsBindingContext) {
			var aMaintenanceOrderIDs = [];
			for (var i = 0; i < aRowsBindingContext.length; i++) {
				aMaintenanceOrderIDs.push(aRowsBindingContext[i].getProperty().MaintenanceOrder);
			}
			return aMaintenanceOrderIDs;
		}
	});
});
