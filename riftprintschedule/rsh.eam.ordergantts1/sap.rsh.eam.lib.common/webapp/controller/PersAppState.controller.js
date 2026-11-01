/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/rsh/eam/lib/common/base/BaseViewChild.controller", "sap/rsh/eam/lib/common/utils/GanttUtils"],
	function (BaseViewChildController, GanttUtils) {
		"use strict";

		return BaseViewChildController.extend("sap.rsh.eam.lib.common.controller.PersAppState.controller", {
			onInitMembers: function () {
				this._oTable = this._getTable();
				this._oGantt = this._getGantt();
			},

			_getTable: function () {
				throw new Error("not implemented");
			},

			_getGantt: function () {
				throw new Error("not implemented");
			},

			// before clean: GanttUtils.oneTimeInitilzationOfAppState
			_oneTimeInitilzationOfAppState: function () {
				var oColumns = this._oTable.getColumns();
				var aVisibleColumns = [];
				var oAppState = {};
				var aSortColumn = {};
				for (var i = 0; i < oColumns.length; i++) {
					if (oColumns[i].getVisible()) {
						aVisibleColumns.push({
							width: oColumns[i].getWidth(),
							columnBindingName: oColumns[i].getSortProperty(),
							id: GanttUtils.getControlId(oColumns[i].getId())
						});
					}
					if (oColumns[i].getSorted()) {
						aSortColumn.sortOrder = oColumns[i].getSortOrder();
						aSortColumn.sortProperty = oColumns[i].getSortProperty();
						aSortColumn.id = GanttUtils.getControlId(oColumns[i].getId());
					}
				}

				oAppState.aVisibleColumns = aVisibleColumns;
				oAppState.aSortColumn = aSortColumn;
				oAppState.selectionPanelSize = this._oGantt.getSelectionPanelSize();
				return oAppState;
			},

			/**
			 * Property width and visibilty are directly set for visible fields,
			 * Panel size is set,
			 * using existing app state in subject view
			 * @public
			 * @param {Object} [oSavedAppState] Saved app state
			 */
			// before clean: GanttUtils.setGanttColumnPersonalization
			_setGanttColumnPersonalization: function (oSavedAppState) {
				if (oSavedAppState && oSavedAppState && Object.keys(oSavedAppState).length !== 0) {
					if (oSavedAppState.customData.aVisibleColumns) {
						var oColumns = this._oTable.getColumns();
						var oColumnData,
							aColsToSetVisibility = [];
						var i;
						for (i = 1; i < oColumns.length; i++) {
							if (oColumns[i].getVisible()) {
								this._oTable.fireColumnVisibility({
									column: oColumns[i],
									newVisible: false
								});
							}
							oColumns[i].setVisible(false);
						}
						for (i = 0; i < oSavedAppState.customData.aVisibleColumns.length; i++) {
							oColumnData = this.getView().byId(oSavedAppState.customData.aVisibleColumns[i].id);
							if (oColumnData) {
								this._setVisibilityOfColumn(oColumnData);
								oColumnData.setWidth(oSavedAppState.customData.aVisibleColumns[i].width);
							} else {
								var oColumnAdaption = this.controllers && this.controllers.columnAdaption;
								var bHasAdaptedColumns = oColumnAdaption ? oColumnAdaption.isAdapted() : false;
								if (bHasAdaptedColumns) {
									// Instances of dynamically added columns do not exist in the AppContext view
									// Identify all such columns from the oSavedAppState
									// Finally set the visibility fetching the column instance directly from the table control
									aColsToSetVisibility.push(oSavedAppState.customData.aVisibleColumns[i].id);
								}
							}
						}
						if (aColsToSetVisibility.length > 0) {
							for (i = 1; i < oColumns.length; i++) {
								if (aColsToSetVisibility.includes("id" + oColumns[i].getSortProperty())) {
									this._setVisibilityOfColumn(oColumns[i]);
								}
							}
						}
					}
					this._oGantt.setSelectionPanelSize(oSavedAppState.customData.selectionPanelSize);
				}
			},

			// before clean: GanttUtils._setVisibilityOfColumn
			_setVisibilityOfColumn: function (oColumn) {
				oColumn.setVisible(true);
				this._oTable.fireColumnVisibility({
					column: oColumn,
					newVisible: true
				});
			}
		});
	}
);
