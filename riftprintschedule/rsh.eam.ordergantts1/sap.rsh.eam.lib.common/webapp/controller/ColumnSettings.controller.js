/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/rsh/eam/lib/common/base/BaseViewChild.controller", "sap/rsh/eam/lib/common/controller/ColumnSettingsPopup.controller"],
	function (BaseViewChildController, ColumnSettingsPopupController) {
		"use strict";

		return BaseViewChildController.extend("sap.rsh.eam.lib.common.controller.ColumnSettings.controller", {
			onInitMembers: function () {
				this.oTreeTable = this._getTable();
				this._oColumnSettingsPopup = new ColumnSettingsPopupController(this.oComponent, this.getView(), this.oTreeTable);
			},

			onExit: function () {
				this._oColumnSettingsPopup.destroy();
			},

			onOpen: function (oEvent) {
				var oByControl = oEvent.getSource();
				this._oColumnSettingsPopup.openPopup(oByControl).then(this._onChange.bind(this));
			},

			// before cleanup: SchedulingBoard._onColumnSettingsChange
			_onChange: function (oChangedColSettings) {
				this._onChangeSelection(oChangedColSettings.column);
				this._onChangeSort(oChangedColSettings);
				this._onChangeOrder(oChangedColSettings.reorderedColumns);
			},

			// before cleanup: SchedulingBoard._handleColumnSelectionChanges
			_onChangeSelection: function (oChangedColItems) {
				if (oChangedColItems) {
					var oColumns = this.oTreeTable.getColumns();
					var bAtleastOneColAdded = false;
					for (var m = 0; m < oColumns.length; m++) {
						var oColumn = oColumns[m];
						var sColumnName = oColumn.getSortProperty();
						if (oChangedColItems[sColumnName] !== undefined) {
							var bVisible = oChangedColItems[sColumnName];
							if (bVisible) {
								bAtleastOneColAdded = true;
							}
							oColumn.setVisible(bVisible);
							this.oTreeTable.fireColumnVisibility({
								column: oColumn,
								newVisible: bVisible,
								applicationEvent: true
							});
						}
					}
					if (bAtleastOneColAdded) {
						this._onAddColumn();
					}
				}
			},

			// before cleanup: SchedulingBoard._handleColumnSortChanges
			_onChangeSort: function (oChangedColSettings) {
				var oChangedSortColumns = oChangedColSettings.sort;
				if (oChangedSortColumns) {
					var oColumns = this.oTreeTable.getColumns();
					// If there are any sort column changes (changed or added sort column/changed sort order), call the sort event handler
					for (var m = 0; m < oColumns.length; m++) {
						var oColumn = oColumns[m];
						var sColumnName = oColumn.getSortProperty();
						if (oChangedSortColumns[sColumnName] !== undefined) {
							var bDescending = oChangedSortColumns[sColumnName];
							this.oTreeTable.fireSort({
								column: oColumn,
								sortOrder: bDescending ? "Descending" : "Ascending",
								applicationEvent: true
							});
						}
					}
				} else if (oChangedColSettings.removedSortColumns) {
					// If there are no sort column changes but existing sort column settings are removed, then update the column status
					this._onDisableSort();
				}
			},

			// before cleanup: SchedulingBoard._handleColumnReorderChanges
			_onChangeOrder: function (aReorderedColumns) {
				if (aReorderedColumns) {
					aReorderedColumns.forEach(
						function (oReorderedCol) {
							var iNewIndexOfMovedColumn = 0;
							if (oReorderedCol.moveNextToColumn) {
								// iIndex here is the index of column from the current table structure next to which the moved column has to be placed
								var iIndex = this.oTreeTable.indexOfColumn(oReorderedCol.moveNextToColumn),
									iCurIndexOfMovedColumn = this.oTreeTable.indexOfColumn(oReorderedCol.column);
								iNewIndexOfMovedColumn = iIndex + 1;

								// A move consists of a remove and an insert, so decrease the index by 1 if a column is moved to a higher index
								if (iNewIndexOfMovedColumn > iCurIndexOfMovedColumn) {
									iNewIndexOfMovedColumn--;
								}
							}

							this.oTreeTable.fireColumnMove({
								column: oReorderedCol.column,
								newPos: iNewIndexOfMovedColumn
							});

							this.oTreeTable.removeColumn(oReorderedCol.column, true);
							this.oTreeTable.insertColumn(oReorderedCol.column, iNewIndexOfMovedColumn);
						}.bind(this)
					);
				}
			},

			_getTable: function () {
				throw Error("not implemented");
			},

			_onAddColumn: function () {},

			_onDisableSort: function () {}
		});
	}
);
