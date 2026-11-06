/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/BaseViewChild.controller"], function (BaseViewChildController) {
	"use strict";

	/**
	 * Some columns require multiple fields e.g. duration and duration unit.
	 * This controllers compiles the list of all fields required for the currently visible columns.
	 */
	return BaseViewChildController.extend("zrift.rsh.eam.ordergantts1.mvc.ordergantt.binding.ColumnFields.controller", {
		onInitMembers: function () {
			this._sOrderFields = undefined; // before cleanup: _sOrderAppStateFields
			this._sOperationFields = undefined; // before cleanup: _sOperationAppStateFields
		},

		getOrderFields: function () {
			return this._sOrderFields;
		},

		getOperationFields: function () {
			return this._sOperationFields;
		},

		hasOrderField: function (sField) {
			return this._sOrderFields.indexOf(sField) !== -1;
		},

		hasOperationField: function (sField) {
			return !!this._sOperationFields && this._sOperationFields.indexOf(sField) !== -1;
		},

		// before cleanup: SchedulingBoard._determineVisibleColumnsFromAppState
		setOrderFields: function () {
			this._sOrderFields = "";
			var aColumns = this.byId("idOrderTreeTable").getColumns();
			for (var i = 0; i < aColumns.length; i++) {
				var oColumn = aColumns[i];
				if (oColumn.getVisible()) {
					var sName = oColumn.getSortProperty();
					this._setOrderField(sName);
				}
			}
			if (this._sOrderFields.startsWith(",", 0)) {
				this._sOrderFields = this._sOrderFields.substring(1);
			}
		},

		// before cleanup: SchedulingBoard._determineVisibleColumnsFromAppState
		setOperationFields: function () {
			this._sOperationFields = "";
			var aColumns = this.byId("idOrderTreeTable").getColumns();
			for (var i = 0; i < aColumns.length; i++) {
				var oColumn = aColumns[i];
				if (oColumn.getVisible()) {
					var sName = oColumn.getSortProperty();
					this._setOperationField(sName);
				}
			}
			if (this._sOperationFields.startsWith(",", 0)) {
				this._sOperationFields = this._sOperationFields.substring(1);
			}
		},

		_setOrderField: function (sName) {
			switch (sName) {
				case "MaintenanceActivityType":
					this._sOrderFields += "," + sName + "," + "MaintenanceActivityTypeName";
					break;
				case "FunctionalLocationName":
					this._sOrderFields += "," + sName + "," + "FunctionalLocation,RelevantFunctionalLocation,TechObjTypeForFuncnlLocation";
					if (this._sOrderFields.indexOf("TechnicalObject") === -1) {
						this._sOrderFields += "," + "TechnicalObject,TechObjIsEquipOrFuncnlLoc,TechnicalObjectLabel";
					}
					break;
				case "EquipmentName":
					this._sOrderFields += "," + sName + "," + "Equipment,EquipmentInternalNumber,TechObjTypeForEquipment";
					if (this._sOrderFields.indexOf("TechnicalObject") === -1) {
						this._sOrderFields += "," + "TechnicalObject,TechObjIsEquipOrFuncnlLoc,TechnicalObjectLabel";
					}
					break;
				case "TechnicalObjectDescription":
					this._sOrderFields += "," + sName + "," + "TechnicalObjectLabel,TechnicalObject";
					// Adding technical object type fields as those will be required to display correct data in the popover
					if (this._sOrderFields.indexOf("TechObjIsEquipOrFuncnlLocDesc") === -1) {
						this._sOrderFields += "," + "TechObjIsEquipOrFuncnlLocDesc,TechObjIsEquipOrFuncnlLoc";
					}
					break;
				case "TechObjIsEquipOrFuncnlLocDesc":
					//Check if the technical object type fields is already added
					if (this._sOrderFields.indexOf("TechObjIsEquipOrFuncnlLocDesc") === -1) {
						this._sOrderFields += "," + sName + "," + "TechObjIsEquipOrFuncnlLocDesc,TechObjIsEquipOrFuncnlLoc";
					}
					break;
				case "MaterialStatusText":
					this._sOrderFields += "," + sName + "," + "MaterialStatus";
					break;
				case "MaintOrdProcessPhaseCode":
					this._sOrderFields += "," + sName + "," + "MaintOrdProcessPhaseDesc";
					break;
				case "MaintOrdProcessSubPhaseCode":
					this._sOrderFields += "," + sName + "," + "MaintOrdProcessSubPhaseDesc";
					break;
				case "MaintenanceRevision":
					this._sOrderFields += "," + sName + ",MaintenancePlanningPlant,MaintPlanningBucketUUID,MaintPlngBucketLabel";
					break;
				case "ServiceDocument":
					this._sOrderFields += "," + sName + "," + "ServiceDocumentDescription";
					break;
				case "ServiceDocumentItem":
					this._sOrderFields += "," + sName + "," + "ServiceDocumentItemDescription";
					break;
				case "MaintOrderProcessingContext":
					this._sOrderFields += "," + sName + "," + "MaintOrdProcessingContextText";
					break;
				case "SoldToParty":
					this._sOrderFields += "," + sName + "," + "BusinessPartnerFullName";
					break;
				case "SalesOrganization":
					this._sOrderFields += "," + sName + "," + "SalesOrganizationName";
					break;
				case "Product":
					this._sOrderFields += "," + sName + "," + "ProductName";
					break;
				case "ReadinessStatus":
					this._sOrderFields +=
						"," +
						"MaintOrdSchedCriticalityCode,MaintOrdCompAvailyCritltyCode,MaintOrdStatusCriticalityCode," +
						"ScheduledBasicStartDateTime,ScheduledBasicEndDateTime,MaintOrdProcessSubPhaseCode,LatestAcceptableCompletionDate";
				// don't add operation only fields
				case "OperationDuration":
				case "OperationPlannedWork":
				case "OperationControlKey":
				case "OpActualExecutionStartDateTime":
				case "OpActualExecutionEndDateTime":
				case "MaintOpExecutionStageName":
				case "SortSequence":
				case "MaintOpExecStageShortText":
				case "OperationPersonResponsible":
				case "OperationPersonRespName":
				case "NumberOfCapacities":
				case "HasError":
				case "OperationHasLongText":
				case "FirstMaintSchedSimulation":
					break;
				default:
					var bExtensionField = this.controllers.ordergantt.columnAdaption.isAddedColumn(sName);
					var bOrderExtensionField = this.controllers.ordergantt.metadata.isOrderExtensionField(sName);
					if (!bExtensionField || bOrderExtensionField) {
						this._sOrderFields += "," + sName;
					}
					break;
			}
		},

		_setOperationField: function (sName) {
			switch (sName) {
				case "MaintOrdProcessPhaseCode":
					this._sOperationFields += "," + "MaintOrdOpProcessPhaseCode" + "," + "MaintOrdOpProcessPhaseDesc";
					break;
				case "MaintOrdProcessSubPhaseCode":
					this._sOperationFields += "," + "MaintOrdOpProcessSubPhaseCode" + "," + "MaintOrdOpProcessSubPhaseDesc";
					break;
				case "MaintPriority":
					this._sOperationFields += "," + sName + "," + "MaintPriorityDesc";
					break;
				case "OrderSystemConditionText":
					this._sOperationFields += "," + sName + "," + "OperationSystemCondition,OperationSystemConditionText";
					break;
				case "MaintenanceActivityType":
					this._sOperationFields += "," + sName + "," + "MaintenanceActivityTypeName";
					break;
				case "FunctionalLocationName":
					this._sOperationFields +=
						"," +
						sName +
						"," +
						"FunctionalLocation,OperationFunctionalLocation,OpFunctionalLocationName,RelevantOperationFuncLocation,TechObjTypeForFuncnlLocation";
					if (this._sOperationFields.indexOf("TechnicalObject") === -1) {
						this._sOperationFields += "," + "TechnicalObject,TechObjIsEquipOrFuncnlLoc,TechnicalObjectLabel";
					}
					break;
				case "EquipmentName":
					this._sOperationFields +=
						"," + sName + "," + "Equipment,OperationEquipment,OperationEquipmentName,OpEquipmentInternalNumber,TechObjTypeForEquipment";
					if (this._sOperationFields.indexOf("TechnicalObject") === -1) {
						this._sOperationFields += "," + "TechnicalObject,TechObjIsEquipOrFuncnlLoc,TechnicalObjectLabel";
					}
					break;
				case "TechnicalObjectDescription":
					this._sOperationFields +=
						"," + sName + "," + "TechnicalObjectLabel,OperationTechnicalObjectLabel,OperationTechnicalObjectDesc,OperationTechnicalObject";
					// Adding technical object type fields as it will be required to do show correct data in the popover
					if (this._sOperationFields.indexOf("OpTechObjEquipOrFuncnlLoc") === -1) {
						this._sOperationFields +=
							"," + "TechObjIsEquipOrFuncnlLoc,TechObjIsEquipOrFuncnlLocDesc,OpTechObjEquipOrFuncnlLoc,OpTechObjEquipOrFuncnlLocDesc";
					}
					break;
				case "TechObjIsEquipOrFuncnlLocDesc":
					//Check if the technical object type fields is already added
					if (this._sOperationFields.indexOf("OpTechObjEquipOrFuncnlLoc") === -1) {
						this._sOperationFields += "," + sName + "," + "TechObjIsEquipOrFuncnlLoc,OpTechObjEquipOrFuncnlLoc,OpTechObjEquipOrFuncnlLocDesc";
					}
					break;
				case "OperationDuration":
					this._sOperationFields += "," + sName + "," + "OperationDurationUnit";
					break;
				case "OperationPlannedWork":
					this._sOperationFields += "," + sName + "," + "OperationPlannedWorkUnit";
					break;
				case "MaterialStatusText":
					this._sOperationFields += "," + sName + "," + "MaterialStatus";
					break;
				case "FirstMaintSchedSimulation":
					this._sOperationFields += "," + sName + "," + "NumberOfMaintSchedSimulations" + "," + "MaintSchedSimlnUUID";
					break;
				case "SortSequence":
					this._sOperationFields += "," + sName + "," + "MaintOpExecutionStageName";
					break;
				case "MaintenanceRevision":
					this._sOperationFields += "," + sName + ",MaintenancePlanningPlant,MaintPlanningBucketUUID,MaintPlngBucketLabel";
					break;
				case "ServiceDocument":
					this._sOperationFields += "," + sName + "," + "ServiceDocumentDescription";
					break;
				case "ServiceDocumentItem":
					this._sOperationFields += "," + sName + "," + "ServiceDocumentItemDescription";
					break;
				case "MaintOrderProcessingContext":
					this._sOperationFields += "," + sName + "," + "MaintOrdProcessingContextText";
					break;
				case "SoldToParty":
					this._sOperationFields += "," + sName + "," + "BusinessPartnerFullName";
					break;
				case "SalesOrganization":
					this._sOperationFields += "," + sName + "," + "SalesOrganizationName";
					break;
				case "Product":
					this._sOperationFields += "," + sName + "," + "ProductName";
					break;
				case "ReadinessStatus":
					this._sOperationFields +=
						"," +
						"MaintOpSchedCriticalityCode,MaintOpCompAvailyCritltyCode,MaintOpStatusCriticalityCode,MaintOrdProcessSubPhaseCode,LatestAcceptableCompletionDate,MaintOrdOpProcessSubPhaseCode";
					break;
				default:
					this._sOperationFields += "," + sName;
					break;
			}
		}
	});
});
