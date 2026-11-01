/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/BaseViewChild.controller"], function (BaseViewChildController) {
	"use strict";

	return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.ordergantt.binding.Fields.controller", {
		getOrderSelectFields: function () {
			var aSelectFields = [];
			var sColumnFields = this.controllers.ordergantt.columnFields.getOrderFields();
			var aLabelFields = this.controllers.ordergantt.labelFields.getSelectedNonMandatoryOrderFields();
			var aColumnFields = sColumnFields ? sColumnFields.split(",") : [];
			var aSortFields = this.controllers.ordergantt.sort.getOrderFields();
			var aExpandFields = this.controllers.ordergantt.fields.getExpandFields();
			this._addSelectFields(aSelectFields, this.controllers.ordergantt.fields.orderMandatoryFields);
			this._addSelectFields(aSelectFields, aColumnFields);
			this._addSelectFields(aSelectFields, aLabelFields);
			this._addSelectFields(aSelectFields, aSortFields);
			this._addSelectFields(aSelectFields, aExpandFields);
			return aSelectFields;
		},

		getOperationSelectFields: function () {
			var aSelectFields = [];
			var sColumnFields = this.controllers.ordergantt.columnFields.getOperationFields();
			var aLabelFields = this.controllers.ordergantt.labelFields.getSelectedNonMandatoryOperationFields();
			var aColumnFields = sColumnFields ? sColumnFields.split(",") : [];
			var aSortFields = this.controllers.ordergantt.sort.getOperationFields();
			var aExpandFields = this.controllers.ordergantt.fields.getExpandFields();
			this._addSelectFields(aSelectFields, this.controllers.ordergantt.fields.operationMandatoryFields);
			this._addSelectFields(aSelectFields, aColumnFields);
			this._addSelectFields(aSelectFields, aLabelFields);
			this._addSelectFields(aSelectFields, aSortFields);
			this._addSelectFields(aSelectFields, aExpandFields);
			return aSelectFields;
		},

		_addSelectFields: function (aSelectFields, aFields) {
			for (var i = 0; i < aFields.length; i++) {
				var sField = aFields[i];
				if (sField && aSelectFields.indexOf(sField) === -1) {
					aSelectFields.push(sField);
				}
			}
		},

		getExpandFields: function () {
			var aExpandFields = [];
			var bIncludeRelationships = this.oUIModel.getProperty("/showImpRel") || this.oUIModel.getProperty("/showExpRel");
			var bIncludeUtilization = this.oUIModel.getProperty("/showUtilizationIndicator") || this.controllers.utilizationGantt.isLoaded();
			if (bIncludeRelationships) {
				aExpandFields.push("to_Relationships");
			}
			if (bIncludeUtilization) {
				aExpandFields.push("to_UtilIndicator");
			}
			return aExpandFields;
		},

		isOrderMandatoryField: function (sField) {
			return this.orderMandatoryFields.indexOf(sField) !== -1;
		},

		isOperationMandatoryField: function (sField) {
			return this.operationMandatoryFields.indexOf(sField) !== -1;
		},

		isOperationFilterField: function (sField) {
			return this.operationFilterFields.indexOf(sField) !== -1;
		},

		isLevelDependentField: function (sField) {
			return this.levelDependentFields.indexOf(sField) !== -1;
		},

		// before cleanup: SchedulingBoard._sOrderAllTechMandatoryFields
		orderMandatoryFields: [
			"MaintenanceOrder",
			"MaintenanceOrderDesc",
			"MaintenanceOrderInternalID",
			"OrderStartDateTime",
			"OrderEndDateTime",
			"ProcessingStatus",
			"ProcessingStatusText",
			"OrderOperationRowLevel",
			"OrderOperationParentRowID",
			"OrderOperationRowID",
			"OrderOperationIsExpanded",
			"MaintOrderRoutingNumber",
			"LatestAcceptableCompletionDate",
			"OrderType",
			"BasicSchedulingType",
			"OrdIsNotSchedldAutomatically",
			"MaintenanceRevision",
			"MaintPriority",
			"MaintPriorityDesc"
		],

		// before cleanup: SchedulingBoard._sOperationAllTechMandatoryFields
		operationMandatoryFields: [
			"MaintenanceOrder",
			"MaintenanceOrderOperation",
			"MaintenanceOrderSubOperation",
			"MaintenanceOrderDesc",
			"MainWorkCenter",
			"MaintenanceOrderInternalID",
			"MaintOrderOperationInternalID",
			"OrderOperationStartDateTime",
			"OrderOperationEndDateTime",
			"ProcessingStatus",
			"ProcessingStatusText",
			"OrderOperationRowLevel",
			"OrderOperationParentRowID",
			"OrderOperationRowID",
			"OrderOperationIsExpanded",
			"WorkCenter",
			"OperationHasLongText",
			"HasError",
			"OperationDescription",
			"WorkCenterInternalID",
			"HasCrossOrderRelationship",
			"HasErrorDescription",
			"ID",
			"OperationPersonResponsible",
			"OperationPersonRespName",
			"MaintOrderRoutingNumber",
			"MaintOrderOperationCounter",
			"OpBscStartDateConstraintType",
			"OrderOpStartConstraintDateTime",
			"OpBscEndDateConstraintType",
			"OrderOpEndConstraintDateTime",
			"OrderType",
			"OpActualExecutionStartDateTime",
			"OpActualExecutionEndDateTime",
			"ActualWorkQuantity",
			"RemainingWorkQuantity",
			"Plant",
			"NumberOfCapacities",
			"NumberOfAssignedPersons",
			"AssignedMaintOpStartDateTime",
			"AssignedMaintOpEndDateTime",
			"ConcatenatedAssignedPersonsTxt",
			"OperationPlannedWork"
		],

		// before cleanup: SchedulingBoard._afilterFieldGroups
		operationFilterFields: [
			"WorkCenterInternalID",
			"WorkCenterTypeCode",
			"Plant",
			"OperationControlKey",
			"OperationDuration",
			"OperationPlannedWork",
			"NumberOfCapacities",
			"OperationHasLongText",
			"OperationPersonResponsible",
			"OperationPersonRespName",
			"HasError",
			"MaintOpExecutionStageName",
			"SortSequence",
			"WorkCenter",
			"MaintOpExecStageShortText",
			"FirstMaintSchedSimulation",
			"OrderOperationStartDateTime",
			"OrderOperationEndDateTime",
			"OpActualExecutionStartDateTime",
			"OpActualExecutionEndDateTime",
			"NumberOfCapacities",
			"NumberOfAssignedPersons"
		],

		// before cleanup: SchedulingBoard._aSpecialSortCaseFields
		levelDependentFields: [
			"MainWorkCenter",
			"MaintOrdProcessPhaseCode",
			"MaintOrdProcessSubPhaseCode",
			"MaintenanceOrder",
			"OrderSystemConditionText",
			"FunctionalLocationName",
			"EquipmentName",
			"TechnicalObjectDescription",
			"TechObjIsEquipOrFuncnlLocDesc",
			"OrderStartDateTime",
			"OrderEndDateTime"
		]
	});
});
