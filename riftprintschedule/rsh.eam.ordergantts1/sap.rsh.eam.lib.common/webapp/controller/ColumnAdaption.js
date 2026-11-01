/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/BaseComponent.controller", "sap/m/Text"], function (BaseComponentController, Text) {
	"use strict";

	return BaseComponentController.extend("sap.rsh.eam.lib.common.utils.ColumnAdaption", {
		_oTable: undefined,
		_sEntitySet: undefined,
		_oColumns: undefined,
		_aColsAdded: undefined,

		constructor: function (oParams) {
			BaseComponentController.call(this, oParams.component);
			this._oTable = oParams.table;
			this._sEntitySet = oParams.entitySet;
		},

		/* This function compares the list of non hidden properties from the metadata with already defined table columns
		 * If there are any new properties found, it creates new columns and add those to the table columns
		 */
		adapt: function (aMetadataProperties) {
			var aColumnProperties = aMetadataProperties.filter(function (oProperty) {
				return !oProperty.hiddenFilter;
			});
			var bAdaptionRequired = this._adaptionRequired(aColumnProperties);
			if (bAdaptionRequired) {
				this._harvestInitialAndCustomColumns();
				var aColumnsToAdd = this._createColumns(aColumnProperties);
				this._aColsAdded = aColumnsToAdd;
				this._addColumns(aColumnsToAdd);
			}
		},

		isAdapted: function () {
			return this._aColsAdded !== undefined;
		},

		isAddedColumn: function (sFieldName) {
			if (this._aColsAdded) {
				for (var i = 0; i < this._aColsAdded.length; i++) {
					if (this._aColsAdded[i].getSortProperty() === sFieldName) {
						return true;
					}
				}
				return false;
			} else {
				return false;
			}
		},

		_adaptionRequired: function (aColumnsProperties) {
			var aColumns = this._oTable.getColumns();
			if (aColumns.length !== aColumnsProperties.length) {
				return true;
			}
			for (var c = 0; c < aColumnsProperties.length; c++) {
				var oProperty = aColumnsProperties[c];
				var oColumn = aColumns[c];
				if (oProperty !== oColumn.getSortProperty()) {
					return true;
				}
			}
			return false;
		},

		_harvestInitialAndCustomColumns: function () {
			if (this._oColumns) {
				return;
			}

			this._oColumns = {};

			var aInitialColumns = this._oTable.getColumns();
			for (var i = 0; i < aInitialColumns.length; i++) {
				var sPropertyName = aInitialColumns[i].getSortProperty();
				this._oColumns[sPropertyName] = aInitialColumns[i];
			}
		},

		_addColumns: function (aColumns) {
			for (var i = 0; i < aColumns.length; i++) {
				var oColumn = aColumns[i];
				this._oTable.addColumn(oColumn);
			}
		},

		_createColumns: function (aProperties) {
			var aResult = [];
			for (var i = 0; i < aProperties.length; i++) {
				var oProperty = aProperties[i];
				var oColumn = this._getColumn(oProperty);
				if (oColumn) {
					aResult.push(oColumn);
				}
			}
			return aResult;
		},

		_getColumn: function (oProperty) {
			// Create column only if it is a non defined column in the xml and if field catalog is set to visible
			if (this._oColumns[oProperty.name] || oProperty.fieldCatalog !== "visible") {
				return undefined;
			} else {
				return this._createColumn(oProperty);
			}
		},

		_createColumn: function (oProperty) {
			var sFieldName, sLabelName, sSortProperty;

			sFieldName = oProperty.name;
			sLabelName = oProperty.label;
			sSortProperty = oProperty.sortProperty ? oProperty.sortProperty : sFieldName;
			/*Check if the create column is for Display Gant then don't make any changes with id as it effect Personalization,
			if it's for for asset board app or any other app in future then make column id as "tableID+FieldName"*/
			var oTreeTableId = this._oTable.getId();
			if (oTreeTableId.includes("displayGantt")) {
				var sColumnid = "id" + sFieldName;
			} else {
				sColumnid = oTreeTableId + sFieldName;
			}
			var oColumn = new sap.ui.table.Column({
				id: sColumnid,
				label: new sap.m.Label({
					text: sLabelName
				}),
				template: new sap.m.Text({
					text: {
						path: sFieldName
					},
					wrapping: false
				}),
				sortProperty: sSortProperty,
				visible: false,
				width: "20%",
				showSortMenuEntry: !oProperty.hiddenSorter
			});
			return oColumn;
		}
	});
});
