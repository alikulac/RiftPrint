/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseFragment.controller",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/ui/core/Fragment"
	],
	function (BaseFragmentController, Constants, Utils, Fragment) {
		"use strict";

		return BaseFragmentController.extend("sap.rsh.eam.lib.common.controller.ColumnSettingsPopup", {
			constructor: function (oComponent, oDependent, oTable) {
				BaseFragmentController.call(this, {
					component: oComponent,
					dependent: oDependent,
					fragmentName: "sap.rsh.eam.lib.common.view.ColumnSettingsPopup",
					fragmentId: oDependent.getId()
				});
				this._oTable = oTable;
			},

			_prepareColumnData: function () {
				this._oColumnSettingsData.columns = [];
				var oColumns = this._oTable.getColumns();
				for (var i = 0; i < oColumns.length; i++) {
					var oColumn = oColumns[i];
					this._oColumnSettingsData.columns.push({
						visible: oColumn.getVisible(),
						name: oColumn.getSortProperty(),
						label: oColumn.getLabel().getText()
					});
				}
			},

			_prepareSortData: function () {
				this._oColumnSettingsData.sort = [];
				var oColumns = this._oTable.getColumns();
				for (var i = 0; i < oColumns.length; i++) {
					var oColumn = oColumns[i],
						bDescending = false;
					if (oColumn.getShowSortMenuEntry()) {
						if (oColumn.getSorted()) {
							bDescending = oColumn.getSortOrder() === "Descending";
						}
						this._oColumnSettingsData.sort.push({
							sorted: oColumn.getSorted(),
							name: oColumn.getSortProperty(),
							label: oColumn.getLabel().getText(),
							descending: bDescending
						});
					}
				}
			},

			/**
			 * Custom comparator function to sort the non selected columns alphabetically
			 * @param {Object} [oColItemA] P13n column item
			 * @param {Object} [oColItemB] P13n column item
			 * @returns {Integer} returns -1, 1, or 0
			 */
			_sortP13nColumnItems: function (oColItemA, oColItemB) {
				/* Return value = -1, oColItemA is sorted before oColItemB,
				Return value = 1, oColItemB is sorted before oColItemA,
				Return value = 0, no changes are done with the sort order of the two values.
			*/
				if (oColItemA.visible > oColItemB.visible) {
					return -1;
				} else if (oColItemA.visible < oColItemB.visible) {
					return 1;
				} else if (oColItemA.visible === false) {
					if (oColItemA.label < oColItemB.label) {
						return -1;
					} else if (oColItemA.label > oColItemB.label) {
						return 1;
					}
				}
				return 0;
			},

			/**
			 * Custom comparator function to sort the columns in the sort by dropdown list alphabetically
			 * @param {Object} [oItemA] item 1
			 * @param {Object} [oItemB] item 2
			 * @returns {Integer} returns -1, 1, or 0
			 */
			_sortSortByDropdownItems: function (oItemA, oItemB) {
				/* Return value = -1, oItemA is sorted before oItemB,
				Return value = 1, oItemB is sorted before oItemA,
				Return value = 0, no changes are done with the sort order of the two values.
			*/
				if (oItemA.label < oItemB.label) {
					return -1;
				} else if (oItemA.label > oItemB.label) {
					return 1;
				}
				return 0;
			},

			onInit: function () {
				this._oColumnSettingsData = {
					columns: [],
					sort: []
				};
			},

			onClose: function (oEvent) {
				var sReason = oEvent.getParameter("reason");
				var bColSettingsChanged = false;
				var oChangedColSettings = {};

				if (sReason === "Ok") {
					if (Object.keys(this.oChangedColItems).length) {
						bColSettingsChanged = true;
						oChangedColSettings.column = this.oChangedColItems;
					}

					if (Object.keys(this.oChangedSortColumns).length) {
						bColSettingsChanged = true;
						oChangedColSettings.sort = this.oChangedSortColumns;
					}

					if (this.aRemovedSortColumns.length) {
						bColSettingsChanged = true;
						oChangedColSettings.removedSortColumns = this.aRemovedSortColumns;
					}

					if (this.aReorderedColItems.length) {
						bColSettingsChanged = true;
						oChangedColSettings.reorderedColumns = this.aReorderedColItems;
					}

					if (bColSettingsChanged) {
						this._fnResolve(oChangedColSettings);
					}
				} else if (sReason === "Cancel") {
					this._oColumnSettingsData.sort = JSON.parse(JSON.stringify(this.oSortSettingsBackup));
				}
			},

			onReset: function () {
				this.oChangedColItems = {};
				this.oChangedSortColumns = {};
				this.aRemovedSortColumns = [];
				this.aReorderedColItems = [];
				var oColumnsPanel = this._getColumnsPanel(),
					oSortPanel = this._getSortPanel();

				oColumnsPanel.setP13nData(this._oColumnSettingsData.columns);
				this._oColumnSettingsData.sort = JSON.parse(JSON.stringify(this.oSortSettingsBackup));
				oSortPanel.setP13nData(this._oColumnSettingsData.sort);

				this.aColsP13nDataBeforeChange = JSON.parse(JSON.stringify(this._oColumnSettingsData.columns));
			},

			_getColumnsPanel: function () {
				return this._oFragment.getPanels()[0];
			},

			_getSortPanel: function () {
				return this._oFragment.getPanels()[1];
			},

			openPopup: function (oSourceControl) {
				return new Promise(
					function (resolve, reject) {
						this.getFragment().then(
							function (oPopup) {
								this._fnResolve = resolve;
								var oColumnsPanel = this._getColumnsPanel(),
									oSortPanel = this._getSortPanel();

								// Holds Column name to visibility mapping
								this.oChangedColItems = {};

								// Holds Sort by field to sort order mapping
								this.oChangedSortColumns = {};
								this.aRemovedSortColumns = [];

								// Holds list of objects containing details of reordered column & column next to which it has has to be added
								this.aReorderedColItems = [];

								this._prepareColumnData();
								this._oColumnSettingsData.columns.sort(this._sortP13nColumnItems);
								oColumnsPanel.setP13nData(this._oColumnSettingsData.columns);

								this._prepareSortData();
								this._oColumnSettingsData.sort.sort(this._sortSortByDropdownItems);
								oSortPanel.setP13nData(this._oColumnSettingsData.sort);

								// Any change in sort settings is directly updating the array object (this._oColumnSettingsData.sort) bounded to it
								// So this backup is required for reset scenario and also when sort settings are changed and clicked on cancel
								this.oSortSettingsBackup = JSON.parse(JSON.stringify(this._oColumnSettingsData.sort));

								// Require this to find out the old index and the moved item details on move action of column item
								this.aColsP13nDataBeforeChange = JSON.parse(JSON.stringify(oColumnsPanel.getP13nData()));

								oPopup.open(oSourceControl);
							}.bind(this)
						);
					}.bind(this)
				);
			},

			/**
			 * Called when Column item is selected / deselected.
			 * @param {Object} [oEvent] Event Object
			 */
			onColSettingChange: function (oEvent) {
				var sReason = oEvent.getParameter("reason");
				if (sReason === "Add" || sReason === "Remove") {
					var oChangedColItem = oEvent.getParameter("item");
					if (oChangedColItem.name === "MaintenanceOrder") {
						oChangedColItem.visible = true;
						Utils.addMessage(this.oCommonBundle.getText("CannotHideOrderColumn"), sap.ui.core.MessageType.Warning, Constants.sDisplayTypeMessageBox);
					} else if (oChangedColItem.name === "MaintAssetBoardReadableKey") {
						oChangedColItem.visible = true;
						Utils.addMessage(this.oCommonBundle.getText("CannotHideAssetsColumn"),
							sap.ui.core.MessageType.Warning, Constants.sDisplayTypeMessageBox);
					} else {
						if (this.oChangedColItems[oChangedColItem.name] === undefined) {
							this.oChangedColItems[oChangedColItem.name] = oChangedColItem.visible;
						} else {
							delete this.oChangedColItems[oChangedColItem.name];
						}
					}
				} else if (sReason === "Move") {
					// Item from the event paramters holds column item that replaced the actual moved item
					// Using this, find out the moved item and its old index
					var oColItemInPosOfMovedItem = oEvent.getParameter("item"),
						iOldIndexOfMovedItem = this._findIndexOfColItemInP13nData(oColItemInPosOfMovedItem),
						oReorderedColItem = this.aColsP13nDataBeforeChange[iOldIndexOfMovedItem];

					// Find the new index of moved item
					var iNewIndexOfMovedItem = this._findIndexOfColItemInP13nData(oReorderedColItem);

					if (iNewIndexOfMovedItem === iOldIndexOfMovedItem) {
						return;
					}

					var oColumns = this._oTable.getColumns(),
						oColumnBeforeDropPoint,
						oColumntoBeMoved;
					if (iNewIndexOfMovedItem === 0) {
						oColumnBeforeDropPoint = null;
					} else {
						// Get the column details next to which the moved item is dropped
						// When item is moved to lower index then the column item before the drop point would be one less than newer index
						var oColItemBeforeDropPoint =
							iNewIndexOfMovedItem < iOldIndexOfMovedItem ? this.aColsP13nDataBeforeChange[iNewIndexOfMovedItem - 1] : this.aColsP13nDataBeforeChange[
								iNewIndexOfMovedItem];
						oColumnBeforeDropPoint = oColumns.find(function (oCol) {
							return oColItemBeforeDropPoint.name === oCol.getSortProperty();
						});
					}

					// Get the column instance of the moved column item
					oColumntoBeMoved = oColumns.find(function (oCol) {
						return oReorderedColItem.name === oCol.getSortProperty();
					});

					this.aReorderedColItems.push({
						column: oColumntoBeMoved,
						moveNextToColumn: oColumnBeforeDropPoint
					});

					// Backup the current P13n data to find out the old index and the moved item details on the next move action of column item
					this.aColsP13nDataBeforeChange = JSON.parse(JSON.stringify(this._getColumnsPanel().getP13nData()));
				}
			},

			/**
			 * Called when Sort Settings are changed.
			 * @param {Object} [oEvent] Event Object
			 */
			onSortSettingsChange: function (oEvent) {
				var sReason = oEvent.getParameter("reason");
				var oSortByItem = oEvent.getParameter("item");
				if (sReason === "Add" || sReason === "sortorder") {
					this.oChangedSortColumns[oSortByItem.name] = oSortByItem.descending;
					if (this.aRemovedSortColumns.indexOf(oSortByItem.name) !== -1) {
						this.aRemovedSortColumns.splice(this.aRemovedSortColumns.indexOf(oSortByItem.name), 1);
					}
				} else if (sReason === "Remove") {
					delete this.oChangedSortColumns[oSortByItem.name];
					this.aRemovedSortColumns.push(oSortByItem.name);
				}
			},

			_findIndexOfColItemInP13nData: function (oColItem) {
				var aColsP13nData = this._getColumnsPanel().getP13nData(),
					iIndexOfRequestedItem;

				aColsP13nData.some(function (oItem, iIndex) {
					if (oColItem.name === oItem.name) {
						iIndexOfRequestedItem = iIndex;
						return true;
					}
					return false;
				});

				return iIndexOfRequestedItem;
			}
		});
	}
);
