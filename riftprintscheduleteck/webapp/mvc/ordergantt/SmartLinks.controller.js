/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/rsh/eam/lib/common/smartlinks/OrderSmartLink.controller",
		"sap/rsh/eam/lib/common/smartlinks/OperationSmartLink.controller",
		"sap/rsh/eam/lib/common/smartlinks/FunctionalLocationSmartLink.controller",
		"sap/rsh/eam/lib/common/smartlinks/EquipmentSmartLink.controller",
		"sap/rsh/eam/lib/common/smartlinks/MaintenanceEventSmartLink.controller"
	],
	function (
		BaseViewChildController,
		OrderSmartLinkController,
		OperationSmartLinkController,
		FunctionalLocationSmartLinkController,
		EquipmentSmartLinkController,
		MaintenanceEventSmartLinkController
	) {
		"use strict";

		return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.ordergantt.SmartLinks.controller", {
			onInitMembers: function () {
				var oReadModel = this.oComponent.getModel("readModel");
				this._sOrderAdditionalFields =
					"EquipmentName,Equipment,MaintOrdProcessSubPhaseDesc,MaintOrderProcessingContext,MaintOrdProcessingContextText,to_OrderActiveStatus,to_OrderDetails";
				this._sOperationFields =
					"MaintOrderOperationInternalID,MaintOrderRoutingNumber,OrderOperationRowID,ProcessingStatus,ProcessingStatusText,MaintenanceOrder,MaintenanceOrderOperation,MaintOrderRoutingNumber,MaintOrderOperationCounter,MaintenanceOrderSubOperation,MaintOrdOpProcessSubPhaseDesc,MaintOpExecutionStageName,OperationDescription,OperationEquipment,OperationEquipmentName,OperationFunctionalLocation,OpFunctionalLocationName,to_OperationActiveStatus,to_OperationDetails";
				this.controllers.orderSmartLink = new OrderSmartLinkController({
					component: this.oComponent,
					dependent: this.getView(),
					readModel: oReadModel
				});
				this.controllers.operationSmartLink = new OperationSmartLinkController({
					component: this.oComponent,
					dependent: this.getView(),
					readModel: oReadModel
				});
				this.controllers.functionalLocationSmartLink = new FunctionalLocationSmartLinkController({
					component: this.oComponent,
					dependent: this.getView(),
					readModel: oReadModel
				});
				this.controllers.equipmentSmartLink = new EquipmentSmartLinkController({
					component: this.oComponent,
					dependent: this.getView(),
					readModel: oReadModel
				});
				this.controllers.maintenanceEventSmartLink = new MaintenanceEventSmartLinkController({
					component: this.oComponent,
					dependent: this.getView(),
					readModel: oReadModel
				});
			},

			createOrderOperationContent: function (oNavigationTargets) {
				var oContext = this.byId(oNavigationTargets.originalId).getBindingContext();
				var oOrderOp = oContext.getObject();
				var bIsOrderLevel = oOrderOp.OrderOperationRowLevel === 0;
				if (bIsOrderLevel) {
					var sFields = this.controllers.ordergantt.fields.getOrderSelectFields() + "," + this._sOrderAdditionalFields;
					return this.controllers.orderSmartLink.createContent(oNavigationTargets, oContext, sFields);
				} else {
					var bIsSubOperationLevel = !!oOrderOp.MaintenanceOrderSubOperation;
					return this.controllers.operationSmartLink.createContent(oNavigationTargets, oContext, this._sOperationFields, bIsSubOperationLevel);
				}
			},

			createEquipmentContent: function (oNavigationTargets) {
				var oOrderOp = this.byId(oNavigationTargets.originalId).getBindingContext().getObject();
				var bIsOrderLevel = oOrderOp.OrderOperationRowLevel === 0;
				return this.controllers.equipmentSmartLink.createContent(oNavigationTargets, oOrderOp, bIsOrderLevel);
			},

			createFuncLocContent: function (oNavigationTargets) {
				var oOrderOp = this.byId(oNavigationTargets.originalId).getBindingContext().getObject();
				var bIsOrderLevel = oOrderOp.OrderOperationRowLevel === 0;
				return this.controllers.functionalLocationSmartLink.createContent(oNavigationTargets, oOrderOp, bIsOrderLevel);
			},

			createTechObjectContent: function (oNavigationTargets) {
				var oOrderOp = this.byId(oNavigationTargets.originalId).getBindingContext().getObject();
				var bIsOrderLevel = oOrderOp.OrderOperationRowLevel === 0;
				var sTechObjectTypePropName = bIsOrderLevel ? "TechObjIsEquipOrFuncnlLoc" : "OpTechObjEquipOrFuncnlLoc";
				var bIsEquipment = oOrderOp[sTechObjectTypePropName] === "EAMS_EQUI";
				if (bIsEquipment) {
					return this.controllers.equipmentSmartLink.createContent(oNavigationTargets, oOrderOp, bIsOrderLevel);
				} else {
					return this.controllers.functionalLocationSmartLink.createContent(oNavigationTargets, oOrderOp, bIsOrderLevel);
				}
			},

			createMaintEventContent: function (oNavigationTargets) {
				var oOrderOp = this.byId(oNavigationTargets.originalId).getBindingContext().getObject();
				return this.controllers.maintenanceEventSmartLink.createContent(oNavigationTargets, oOrderOp);
			}
		});
	}
);
