/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/BaseViewChild.controller", "sap/ui/model/Sorter"], function (BaseViewChildController, Sorter) {
	"use strict";

	return BaseViewChildController.extend("zrsh.eam.ordergantts1.mvc.ordergantt.binding.Sort.controller", {
		onInitMembers: function () {
			this.oTreeTable = this.byId("idOrderTreeTable");
			this.sOrderField = undefined; // before cleanup: sSortOrderField
			this.sOperationField = undefined; // before cleanup: sSortOperationField
			this.sOrderOrder = undefined; // before cleanup: sOrderSortOrder
			this.sOperationOrder = undefined; // before cleanup: sOperationSortOrder
		},

		applyDefaults: function () {
			// update fields
			this.sOrderField = "MaintenanceOrder";
			this.sOperationField = "MaintenanceOrderOperation";
			this.sOrderOrder = "Ascending";
			this.sOperationOrder = null;
			// update UI
			var oSortColumn = this.controllers.orderGantt.getColumn(this.sOrderField);
			this.controllers.orderGantt.updateColumnSortIcons(oSortColumn);
		},

		getOrderField: function () {
			return this.sOrderField;
		},

		getOperationField: function () {
			return this.sOperationField;
		},

		getOrderFields: function () {
			return this.sOrderField ? [this.sOrderField] : [];
		},

		getOperationFields: function () {
			return this.sOperationField ? [this.sOperationField] : [];
		},

		getOrderSorters: function () {
			var oSorter = new Sorter(this.sOrderField, this.sOrderOrder === "Descending");
			return [oSorter];
		},

		getOperationSorters: function () {
			var oSorter = new Sorter(this.sOperationField, this.sOperationOrder === "Descending");
			return [oSorter];
		},

		setFields: function (oSortColumn, sColSortOrder) {
			var sSortProperty = oSortColumn.getSortProperty();

			//Check if the selected column belongs to the operation fields.
			if (
				this.controllers.ordergantt.fields.isOperationFilterField(sSortProperty) ||
				this.controllers.ordergantt.metadata.isOperationExtensionField(sSortProperty)
			) {
				// Store the SortProperty & SortOrder for order fields to use in rowlevel = 1
				this.sOperationField = sSortProperty;
				this.sOperationOrder = sColSortOrder;
			} else if (
				this.controllers.ordergantt.metadata.isOrderExtensionField(sSortProperty) ||
				sSortProperty === "MaintOrdBasicStartDate" ||
				sSortProperty === "MaintOrdBasicEndDate"
			) {
				// If the selected column belongs to the order fields. Store the SortProperty & SortOrder for order fields to use in rowlevel = 0
				this.sOrderField = sSortProperty;
				this.sOrderOrder = sColSortOrder;
			} else {
				// Store the SortProperty & SortOrder for order fields to use in rowlevel = 0
				this.sOrderField = sSortProperty;
				this.sOrderOrder = sColSortOrder;
				// Store the SortProperty & SortOrder for order fields to use in rowlevel = 1
				this.sOperationField = sSortProperty;
				this.sOperationOrder = sColSortOrder;
				this._setLevelDependentFields(sSortProperty, sColSortOrder);
			}
		},

		// before cleanup: SchedulingBoard._checkSpecialCasesOfSort
		_setLevelDependentFields: function (sSortProperty, sColSortOrder) {
			//Special case - if Sort field is MaintenanceOrder, then
			//For operations we should use MaintenanceOperation
			if (sSortProperty === "MaintenanceOrder") {
				this.sOperationField = "MaintenanceOrderOperation";
				this.sOperationOrder = sColSortOrder;
			}

			//Special case - common field Processing Status
			//if Sort field is ProcessingStatus, we need to apply it for both levels
			if (sSortProperty === "ProcessingStatus") {
				this.sOperationField = this.sOrderField = sSortProperty;
				this.sOperationOrder = this.sOrderOrder = sColSortOrder;
			}

			if (sSortProperty === "FunctionalLocationName") {
				this.sOperationField = "OpFunctionalLocationName";
				this.sOrderField = sSortProperty;
				this.sOperationOrder = this.sOrderOrder = sColSortOrder;
			}

			if (sSortProperty === "EquipmentName") {
				this.sOperationField = "OperationEquipmentName";
				this.sOrderField = sSortProperty;
				this.sOperationOrder = this.sOrderOrder = sColSortOrder;
			}

			if (sSortProperty === "TechnicalObjectDescription") {
				this.sOperationField = "OperationTechnicalObjectDesc";
				this.sOrderField = sSortProperty;
				this.sOperationOrder = this.sOrderOrder = sColSortOrder;
			}

			if (sSortProperty === "OrderSystemConditionText") {
				this.sOperationField = "OperationSystemConditionText";
				this.sOrderField = sSortProperty;
				this.sOperationOrder = this.sOrderOrder = sColSortOrder;
			}

			if (sSortProperty === "OrderStartDateTime") {
				this.sOperationField = "OrderOperationStartDateTime";
				this.sOrderField = sSortProperty;
				this.sOperationOrder = this.sOrderOrder = sColSortOrder;
			}

			if (sSortProperty === "OrderEndDateTime") {
				this.sOperationField = "OrderOperationEndDateTime";
				this.sOrderField = sSortProperty;
				this.sOperationOrder = this.sOrderOrder = sColSortOrder;
			}

			//Special case - common field Work Center
			if (sSortProperty === "MainWorkCenter") {
				this.sOperationField = "WorkCenter";
				this.sOperationOrder = sColSortOrder;
			}

			//Special case - common field Phase
			if (sSortProperty === "MaintOrdProcessPhaseCode") {
				this.sOperationField = "MaintOrdOpProcessPhaseCode";
				this.sOperationOrder = sColSortOrder;
			}

			//Special case - common field Subphase
			if (sSortProperty === "MaintOrdProcessSubPhaseCode") {
				this.sOperationField = "MaintOrdOpProcessSubPhaseCode";
				this.sOperationOrder = sColSortOrder;
			}
		}
	});
});
